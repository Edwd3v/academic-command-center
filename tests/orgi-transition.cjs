const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "orgi-transition-"));
const server = http.createServer((request, response) => {
  const file = path.resolve(root, `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`);
  if (!file.startsWith(`${root}${path.sep}`) && file !== path.join(root, "index.html")) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.setHeader("Content-Type", file.endsWith(".json") ? "application/json" : file.endsWith(".svg") ? "image/svg+xml" : file.endsWith(".css") ? "text/css" : file.endsWith(".js") ? "text/javascript" : "text/html");
    response.end(data);
  });
});
const port = 43000 + process.pid % 10000;
const browser = spawn("chromium", ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, description) {
  for (let attempt = 0; attempt < 100; attempt++) { if (await fn()) return; await delay(100); }
  throw new Error(description);
}
async function main() {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let socket;
  try {
    let target;
    await until(async () => {
      const reply = await fetch(`http://127.0.0.1:${port}/json/list`).catch(() => null);
      target = reply?.ok && (await reply.json()).find(page => page.type === "page");
      return target;
    }, "Chromium did not start");
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let id = 0;
    const pending = new Map();
    socket.onmessage = event => {
      const reply = JSON.parse(event.data);
      if (pending.has(reply.id)) { const { resolve, reject } = pending.get(reply.id); pending.delete(reply.id); reply.error ? reject(new Error(reply.error.message)) : resolve(reply.result); }
    };
    const cdp = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
    async function evaluate(expression) {
      const reply = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description ?? reply.exceptionDetails.text);
      return reply.result.value;
    }
    const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const visible = selector => evaluate(`!document.querySelector(${JSON.stringify(selector)}).classList.contains('hidden')`);
    await cdp("Page.enable");
    await cdp("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/index.html` });
    await until(() => evaluate("document.querySelector('#orgi-launcher-slot') && emails.length === 25"), "Demo did not load");
    await click("#orgi-launcher");
    await click("#open-control-center");
    assert.equal(await visible("#orgi-transition"), true, "Panel CTA should enter a dedicated scene");
    assert.equal(await visible("#dashboard-app"), false, "Dashboard must wait for the invitation action");
    assert.match(await evaluate("document.querySelector('#orgi-transition').textContent"), /demostraci[oó]n/i, "Scene must disclose it is illustrative");
    assert.equal(await evaluate("document.activeElement.id"), "transition-start", "Keyboard focus should enter the scene");
    await click("#transition-back");
    assert.equal(await visible("#outlook-view"), true);
    assert.equal(await visible("#orgi-transition"), false);
    await click("#orgi-launcher");
    await click("#open-control-center");
    const before = await evaluate("JSON.stringify([localStorage.getItem('academic-followup.tasks.v1'),localStorage.getItem('academic-followup.decisions.v1'),localStorage.getItem('academic-followup.relevance.v1'),localStorage.getItem('academic-outlook-read.v1')])");
    await click("#transition-start");
    await click("#transition-back");
    await delay(950);
    assert.equal(await visible("#dashboard-app"), false, "Cancelled story must not navigate later");
    await click("#orgi-launcher");
    await click("#open-control-center");
    await click("#transition-start");
    assert.equal(await evaluate("document.querySelector('#transition-start').disabled"), true, "Start must not restart an active sequence");
    assert.equal(await evaluate("document.querySelector('#orgi-transition').dataset.phase"), "collecting");
    await until(() => evaluate("document.querySelector('#orgi-transition').dataset.phase === 'finding'"), "Attention scene never appeared");
    await until(() => evaluate("document.querySelector('#orgi-transition').dataset.phase === 'arranging'"), "Organization scene never appeared");
    await until(() => evaluate("document.querySelector('#orgi-transition').dataset.phase === 'ready'"), "Confirmation never appeared");
    assert.equal(await visible("#dashboard-app"), false, "Confirmation must appear before arrival");
    await until(() => visible("#dashboard-app"), "Dashboard did not open after the story");
    assert.equal(await visible("#orgi-transition"), false);
    assert.equal(await evaluate("document.activeElement.id"), "back-to-inbox");
    assert.equal(await evaluate("JSON.stringify([localStorage.getItem('academic-followup.tasks.v1'),localStorage.getItem('academic-followup.decisions.v1'),localStorage.getItem('academic-followup.relevance.v1'),localStorage.getItem('academic-outlook-read.v1')])"), before, "Story must not mutate stored data");
    await click("#back-to-inbox");
    await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await click("#orgi-launcher");
    await click("#open-control-center");
    await click("#transition-start");
    await until(() => visible("#dashboard-app"), "Reduced-motion journey must complete");
    assert.equal(await evaluate("document.querySelector('#orgi-transition').dataset.phase"), "intro", "Replay should reset the story");
    await click("#back-to-inbox");
    await click("#orgi-launcher");
    await click("#orgi-attention-list button");
    assert.equal(await visible("#dashboard-app"), true, "Contextual mail entry should still open dashboard directly");
    assert.equal(await visible("#orgi-transition"), false, "Contextual mail entry must bypass the story");
    assert.equal(await visible("#communications-view"), true);
    await click("#back-to-inbox");
    await click("#orgi-launcher");
    await click("#open-control-center");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 360, height: 700, deviceScaleFactor: 1, mobile: false });
    const widths = await evaluate("({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,scene:document.querySelector('#orgi-transition').getBoundingClientRect().width})");
    assert(widths.page <= widths.viewport + 1, `Invitation overflows mobile viewport: ${JSON.stringify(widths)}`);
    console.log("Orgi transition browser journey passed.");
  } finally {
    socket?.close(); browser.kill(); server.close(); fs.rmSync(profile, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
