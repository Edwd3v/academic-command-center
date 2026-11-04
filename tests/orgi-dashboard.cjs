const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "orgi-dashboard-browser-"));
const server = http.createServer((request, response) => {
  const file = path.resolve(root, `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`);
  if (!file.startsWith(`${root}${path.sep}`) && file !== path.join(root, "index.html")) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.setHeader("Content-Type", file.endsWith(".json") ? "application/json" : file.endsWith(".svg") ? "image/svg+xml" : "text/html; charset=utf-8");
    response.end(data);
  });
});
const debugPort = 42000 + (process.pid % 10000);
const browser = spawn("chromium", ["--headless=new", "--no-sandbox", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`, "about:blank"], { stdio: "ignore" });

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitFor(predicate, message) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const value = await predicate();
    if (value) return value;
    await delay(100);
  }
  throw new Error(message);
}

async function main() {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let socket;
  try {
    const targets = await waitFor(async () => {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`).catch(() => null);
      const pages = response?.ok ? await response.json() : [];
      return pages.find(target => target.type === "page");
    }, "Chromium page target was not available.");
    socket = new WebSocket(targets.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  };
  function cdp(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  }
  async function evaluate(expression) {
    const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`); }
  async function waitUntil(expression, message) {
    return waitFor(() => evaluate(expression), message);
  }
    await cdp("Page.enable");
    await cdp("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/index.html` });
    await waitUntil(`document.querySelector('#open-control-center')`, "Orgi dashboard entry point did not load.");
    await click("#open-control-center");
    await waitUntil(`!document.querySelector('#dashboard-app').classList.contains('hidden')`, "Dashboard did not open.");

    const home = await evaluate(`({title:document.querySelector('#dashboard-app h1').textContent.trim(), summaries:[...document.querySelectorAll('#summary-grid .summary-card')].length, heading:document.querySelector('#attention-title').textContent, demo:document.querySelector('#source-indicator').textContent})`);
    assert.equal(home.title, "Mi espacio académico");
    assert.equal(home.summaries, 3, "Home should show only the three requested summary indicators.");
    assert(!/urgente|requiere tu atención/i.test(home.heading));
    assert.match(home.demo, /demostración|datos de ejemplo/i);
    if (process.env.ORGI_TEST_HOME_ONLY === "1") {
      console.log("PASS Orgi dashboard smoke: simplified home and demo disclosure");
      return;
    }

    await evaluate(`document.querySelector('#global-search').value='Guía de ejercicios'; document.querySelector('#global-search-form').requestSubmit()`);
    await waitUntil(`document.querySelectorAll('#mail-list .mail-row').length === 1`, "Global search did not narrow to the matching communication.");
    const row = await evaluate(`document.querySelector('#mail-list .mail-row .mail-subject').textContent`);
    assert.match(row, /Guía de ejercicios/);

    await evaluate(`document.querySelector('#global-search').value='oportunidad'; document.querySelector('#global-search').dispatchEvent(new Event('input',{bubbles:true}))`);
    await waitUntil(`document.querySelectorAll('#mail-list .mail-row').length > 0`, "Search did not include the proposed category.");
    assert.match(await evaluate(`document.querySelector('#mail-list').textContent`), /convocatoria|boletín|charla/i);
    await evaluate(`document.querySelector('#global-search').value='Guía de ejercicios'; document.querySelector('#global-search').dispatchEvent(new Event('input',{bubbles:true}))`);
    await waitUntil(`document.querySelectorAll('#mail-list .mail-row').length === 1`, "Search could not return to a subject match.");

    await click("#mail-list .mail-row");
    await waitUntil(`document.querySelector('#detail-dialog').open`, "Communication detail did not open.");
    assert.match(await evaluate(`document.querySelector('#detail-content').textContent`), /Contenido no disponible en esta muestra/);
    assert.match(await evaluate(`document.querySelector('#detail-content').textContent`), /relevante/i);
    const overflow = await evaluate(`({width:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})`);
    assert(overflow.width <= overflow.client, `Horizontal overflow at desktop: ${JSON.stringify(overflow)}`);

    console.log("PASS Orgi dashboard smoke: home, search, details and desktop overflow");
  } finally {
    socket?.close();
    browser.kill("SIGTERM");
    server.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
