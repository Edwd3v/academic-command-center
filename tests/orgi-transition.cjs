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
    await evaluate("window.originalOrgiLauncher = document.querySelector('#orgi-launcher'); window.originalOrgiAvatar = document.querySelector('#orgi-avatar')");
    await click("#orgi-launcher");
    await click("#open-control-center");
    assert.equal(await visible("#orgi-transition"), true, "Panel CTA should enter a dedicated scene");
    const invitation = await evaluate("({same:document.querySelector('#orgi-launcher')===window.originalOrgiLauncher,avatar:document.querySelector('#orgi-avatar')===window.originalOrgiAvatar,location:document.querySelector('#orgi-launcher').parentElement.id,avatars:document.querySelectorAll('#orgi-avatar').length,size:document.querySelector('#orgi-avatar').getBoundingClientRect().width,header:!!document.querySelector('.transition-header'),footer:!!document.querySelector('.transition-footer'),eyebrow:!!document.querySelector('.transition-eyebrow'),staticFace:!!document.querySelector('.transition-face'),copy:document.querySelector('#orgi-transition').textContent})");
    assert.equal(invitation.same && invitation.avatar, true, "The existing animated launcher and avatar must be reused");
    assert.equal(invitation.location, "transition-portrait");
    assert.equal(invitation.avatars, 1, "No duplicate avatar should be created");
    assert(invitation.size >= 110, `Orgi should be visually prominent: ${invitation.size}px`);
    assert.equal(invitation.header || invitation.footer || invitation.eyebrow || invitation.staticFace, false, "Remove promotional chrome and the separate static face");
    assert.doesNotMatch(invitation.copy, /UN MOMENTO CON ORGI|Menos ruido|Tu espacio, más claro/i);
    const intro = await evaluate("({title:document.querySelector('#transition-title').innerText,cta:document.querySelector('#transition-start').innerText.trim(),description:getComputedStyle(document.querySelector('#transition-description')).visibility,disclaimer:getComputedStyle(document.querySelector('.transition-disclaimer')).visibility,visual:getComputedStyle(document.querySelector('.transition-visual')).visibility,back:document.querySelector('#transition-back').getAttribute('aria-label'),backText:document.querySelector('#transition-back').innerText.trim(),layout:document.querySelector('.transition-layout').getBoundingClientRect().toJSON(),portrait:document.querySelector('#transition-portrait').getBoundingClientRect().toJSON()})");
    assert.equal(intro.title, "Hagamos espacio para lo importante.");
    assert.equal(intro.cta, "Organizar mi espacio");
    assert.equal(intro.description, "hidden", "No extra explanation should compete with the welcome");
    assert.equal(intro.disclaimer, "hidden", "Demo disclosure belongs to the active story, not the welcome");
    assert.equal(intro.visual, "hidden", "Organization cards must not appear before the action");
    assert.equal(intro.back, "Volver a la bandeja");
    assert(intro.backText.length <= 2, "Back control should be a discreet icon");
    assert(Math.abs(intro.portrait.x + intro.portrait.width / 2 - (intro.layout.x + intro.layout.width / 2)) < 90, "Orgi should be centered in the welcome");
    await evaluate("(()=>{const r=document.querySelector('#orgi-launcher').getBoundingClientRect();document.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+r.width/2,clientY:r.top+r.height/2,pointerType:'mouse',bubbles:true}))})()");
    assert.equal(await evaluate("document.querySelector('#orgi-avatar').dataset.state"), "watching", "Existing avatar personality should work in the scene");
    await click("#orgi-launcher");
    assert.equal(await evaluate("document.querySelector('#orgi-panel').classList.contains('open')"), false, "Decorative avatar must not reopen the hidden panel");
    assert.equal(await visible("#dashboard-app"), false, "Dashboard must wait for the invitation action");
    assert.equal(await evaluate("document.activeElement.id"), "transition-start", "Keyboard focus should enter the scene");
    await click("#transition-back");
    assert.equal(await visible("#outlook-view"), true);
    assert.equal(await visible("#orgi-transition"), false);
    assert.equal(await evaluate("document.querySelector('#orgi-launcher').parentElement.id"), "orgi-launcher-slot", "Back should restore the original Outlook launcher");
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
    assert.match(await evaluate("document.querySelector('#orgi-transition').innerText"), /Vista demostrativa/i, "The active story must disclose it is illustrative");
    await delay(250);
    const motion = await evaluate("({visual:getComputedStyle(document.querySelector('.transition-visual')).opacity,card:getComputedStyle(document.querySelector('.transition-card-a')).opacity,position:document.querySelector('.transition-card-a').getBoundingClientRect().left})");
    assert(Number(motion.visual) > 0 && Number(motion.card) > 0, "Existing cards should enter progressively in the same scene");
    await until(() => evaluate("document.querySelector('#orgi-transition').dataset.phase === 'finding'"), "Attention scene never appeared");
    await until(() => evaluate("document.querySelector('#orgi-transition').dataset.phase === 'arranging'"), "Organization scene never appeared");
    await delay(180);
    const rearranging = await evaluate("({position:document.querySelector('.transition-card-a').getBoundingClientRect().left,transition:getComputedStyle(document.querySelector('.transition-card-a')).transitionDuration})");
    assert.notEqual(rearranging.position, motion.position, "Cards must move continuously instead of being swapped for a static image");
    assert.notEqual(rearranging.transition, "0s", "Card movement should be animated when motion is allowed");
    await until(() => evaluate("document.querySelector('#orgi-transition').dataset.phase === 'ready'"), "Confirmation never appeared");
    assert.equal(await visible("#dashboard-app"), false, "Confirmation must appear before arrival");
    await until(() => visible("#dashboard-app"), "Dashboard did not open after the story");
    assert.equal(await visible("#orgi-transition"), false);
    assert.equal(await evaluate("document.activeElement.id"), "back-to-inbox");
    assert.equal(await evaluate("document.querySelector('#orgi-launcher').parentElement.className"), "sidebar-heading", "Arrival should restore the original dashboard launcher");
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
    await click("#transition-start");
    await delay(220);
    const mobileStory = await evaluate("({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,visual:getComputedStyle(document.querySelector('.transition-visual')).visibility,disclosure:getComputedStyle(document.querySelector('.transition-disclaimer')).visibility,cardMotion:getComputedStyle(document.querySelector('.transition-card-a')).transitionDuration})");
    assert(mobileStory.page <= mobileStory.viewport + 1, `Story overflows mobile viewport: ${JSON.stringify(mobileStory)}`);
    assert.equal(mobileStory.visual, "visible");
    assert.equal(mobileStory.disclosure, "visible");
    assert.equal(mobileStory.cardMotion, "1e-05s", "Reduced-motion preference must suppress card movement");
    console.log("Orgi transition browser journey passed.");
  } finally {
    socket?.close(); browser.kill(); server.close(); fs.rmSync(profile, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
