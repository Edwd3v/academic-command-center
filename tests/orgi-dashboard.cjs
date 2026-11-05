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
    const outlookAvatar = await evaluate(`({launcher:(window.orgiLauncherReference=document.querySelector('#orgi-launcher'))?.parentElement?.id,avatar:(window.orgiAvatarReference=document.querySelector('#orgi-avatar'))?.className,instances:document.querySelectorAll('#orgi-avatar').length,palette:(()=>{const avatar=document.querySelector('#orgi-avatar'),eye=document.querySelector('.orgi-eye'),reflection=document.querySelector('#orgi-sphere stop');return {border:getComputedStyle(avatar).borderTopColor,glow:getComputedStyle(avatar).boxShadow,eye:getComputedStyle(eye).fill,eyeGlow:getComputedStyle(eye).filter,reflection:getComputedStyle(reflection).stopColor,body:getComputedStyle(document.querySelector('#orgi-sphere stop:last-child')).stopColor}})()})`);
    assert.equal(outlookAvatar.launcher, "orgi-launcher-slot", "Original Outlook avatar should remain in its own slot.");
    assert.equal(outlookAvatar.avatar, "orgi-avatar");
    assert.equal(outlookAvatar.instances, 1, "The page should have only one avatar component.");
    await click("#orgi-launcher");
    await waitUntil(`document.querySelector('#orgi-panel').classList.contains('open')`, "Avatar should still open the Orgi panel in Outlook.");
    await click("#orgi-close");
    await waitUntil(`!document.querySelector('#orgi-panel').classList.contains('open')`, "Orgi panel should close in Outlook.");
    await click("#open-control-center");
    await waitUntil(`!document.querySelector('#dashboard-app').classList.contains('hidden')`, "Dashboard did not open.");

    const sidebar = await evaluate(`({brand:document.querySelector('.sidebar .brand')?.textContent.trim(),brandMark:document.querySelector('.sidebar .brand-mark'),toggle:document.querySelector('#orgi-launcher')?.getAttribute('aria-expanded'),tooltip:document.querySelector('#orgi-launcher')?.title,controls:document.querySelector('#orgi-launcher')?.getAttribute('aria-controls'),launcherSame:document.querySelector('#orgi-launcher')===window.orgiLauncherReference,avatarSame:document.querySelector('#orgi-avatar')===window.orgiAvatarReference,avatarInstances:document.querySelectorAll('#orgi-avatar').length,parent:document.querySelector('#orgi-launcher')?.parentElement.className,labels:[...document.querySelectorAll('.sidebar nav .nav-label')].map(label=>label.textContent.trim()),palette:(()=>{const avatar=document.querySelector('#orgi-avatar'),eye=document.querySelector('.orgi-eye'),reflection=document.querySelector('#orgi-sphere stop');return {border:getComputedStyle(avatar).borderTopColor,glow:getComputedStyle(avatar).boxShadow,eye:getComputedStyle(eye).fill,eyeGlow:getComputedStyle(eye).filter,reflection:getComputedStyle(reflection).stopColor,body:getComputedStyle(document.querySelector('#orgi-sphere stop:last-child')).stopColor}})()})`);
    assert.equal(sidebar.brand, "Orgi", "Sidebar should use Orgi as its only brand text.");
    assert.equal(sidebar.brandMark, null, "Sidebar should not show the old letter mark.");
    assert.equal(sidebar.toggle, "true", "Sidebar should start expanded with an accessible toggle.");
    assert.equal(sidebar.tooltip, "Contraer panel");
    assert.equal(sidebar.controls, "primary-navigation");
    assert.equal(sidebar.launcherSame, true, "Sidebar should reuse the original Outlook launcher node.");
    assert.equal(sidebar.avatarSame, true, "Sidebar should reuse the original animated avatar node.");
    assert.equal(sidebar.avatarInstances, 1, "The avatar must not be duplicated.");
    assert.equal(sidebar.parent, "sidebar-heading");
    assert.deepEqual(sidebar.palette, outlookAvatar.palette, "Avatar palette should remain identical after moving it into the sidebar.");
    assert.deepEqual(sidebar.labels, ["Inicio", "Comunicaciones", "Mis compromisos"]);
    await click("#orgi-launcher");
    await delay(250);
    const collapsed = await evaluate(`({expanded:document.querySelector('#orgi-launcher').getAttribute('aria-expanded'),collapsed:document.querySelector('#dashboard-app').classList.contains('sidebar-collapsed'),tooltip:document.querySelector('#orgi-launcher').title,controls:document.querySelector('#orgi-launcher').getAttribute('aria-controls'),titles:[...document.querySelectorAll('.sidebar nav button')].map(button=>button.title),labelWidths:[...document.querySelectorAll('.sidebar nav .nav-label')].map(label=>Math.round(label.getBoundingClientRect().width))})`);
    assert.equal(collapsed.expanded, "false", "Toggle should expose the collapsed state accessibly.");
    assert.equal(collapsed.collapsed, true, "Sidebar should enter its collapsed layout state.");
    assert.equal(collapsed.tooltip, "Expandir panel");
    assert.equal(collapsed.controls, "primary-navigation");
    assert.deepEqual(collapsed.titles, ["Inicio", "Comunicaciones", "Mis compromisos"], "Collapsed navigation should provide section tooltips.");
    assert(collapsed.labelWidths.every(width => width === 0), "Collapsed navigation should hide labels visually.");
    await click("#orgi-launcher");
    assert.equal(await evaluate(`document.querySelector('#orgi-launcher').getAttribute('aria-expanded')`), "true");

    const home = await evaluate(`({title:document.querySelector('#dashboard-app h1').textContent.trim(), summaries:[...document.querySelectorAll('#summary-grid .summary-card')].length, heading:document.querySelector('#attention-title').textContent, demo:document.querySelector('#source-indicator').textContent})`);
    assert.equal(home.title, "Mi espacio académico");
    const header = await evaluate(`({subtitle:document.querySelector('#dashboard-app .subtitle').textContent.trim(),button:document.querySelector('#back-to-inbox').textContent.trim(),icon:document.querySelector('#back-to-inbox use').getAttribute('href'),inHeader:document.querySelector('.main-content > header').contains(document.querySelector('#back-to-inbox')),search:document.querySelector('#global-search-form').contains(document.querySelector('#global-search')),disclosure:document.querySelector('#source-indicator').closest('details')?.className})`);
    assert.equal(header.subtitle, "Todo lo importante, en un solo lugar.");
    assert.equal(header.button, "Bandeja demo");
    assert.equal(header.icon, "icons/fluent.svg#mail-20-regular");
    assert.equal(header.inHeader, true);
    assert.equal(header.search, true);
    assert.equal(header.disclosure, "demo-disclosure");
    const headerDesktop = await evaluate(`(()=>{const title=document.querySelector('#dashboard-app h1').getBoundingClientRect(),button=document.querySelector('#back-to-inbox').getBoundingClientRect(),search=document.querySelector('#global-search').getBoundingClientRect();return {buttonRight:button.right,titleRight:title.right,searchWidth:search.width,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    assert(headerDesktop.buttonRight > headerDesktop.titleRight);
    assert(headerDesktop.searchWidth >= 190);
    assert.equal(headerDesktop.overflow, false);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    const headerMobile = await evaluate(`(()=>{const heading=document.querySelector('#dashboard-app h1').getBoundingClientRect(),button=document.querySelector('#back-to-inbox').getBoundingClientRect(),search=document.querySelector('#global-search').getBoundingClientRect();return {buttonRight:button.right,headingRight:heading.right,searchWidth:search.width,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    assert(headerMobile.buttonRight > headerMobile.headingRight);
    assert(headerMobile.searchWidth >= 190);
    assert.equal(headerMobile.overflow, false);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
    assert.equal(home.summaries, 3, `Home should show only the three requested summary indicators. ${await evaluate(`document.querySelector('#app-error').textContent`)}`);
    assert(!/urgente|requiere tu atención/i.test(home.heading));
    assert.match(home.demo, /demostración|datos de ejemplo/i);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 900, height: 900, deviceScaleFactor: 1, mobile: false });
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('#category-grid')).gridTemplateColumns.split(' ').length`), 2);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
    const categories = await evaluate(`({cards:[...document.querySelectorAll('#category-grid .category-card')].map(card=>({key:card.dataset.category,count:card.querySelector('.count')?.textContent,label:card.getAttribute('aria-label')})),data:emails.map(mail=>({key:mail.hipotesis_diseno?.categoria}))})`);
    assert.deepEqual(categories.cards.map(card=>card.key), ["academico", "institucional", "administrativo", "bienestar", "oportunidad", "all"]);
    categories.cards.slice(0, 5).forEach(card => {
      const total = categories.data.filter(mail => mail.key === card.key).length;
      assert.equal(card.count, String(total));
    });
    assert.equal(categories.cards[5].count, String(categories.data.length));
    assert.equal(await evaluate(`document.querySelector('#home-view').children[1].textContent.trim()`), "Explorar por categoría");
    assert.equal(await evaluate(`document.querySelector('#home-view').children[2].id`), "category-grid");
    const desktopColumns = await evaluate(`getComputedStyle(document.querySelector('#category-grid')).gridTemplateColumns.split(' ').length`);
    assert.equal(desktopColumns, 3);
    assert.equal(await evaluate(`new Set([...document.querySelectorAll('#category-grid .category-card')].map(card=>Math.round(card.getBoundingClientRect().top))).size`), 2);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1180, height: 900, deviceScaleFactor: 1, mobile: false });
    const expandedColumns = await evaluate(`getComputedStyle(document.querySelector('#category-grid')).gridTemplateColumns.split(' ').length`);
    await evaluate(`document.querySelector('#dashboard-app').classList.add('sidebar-collapsed')`);
    await waitFor(()=>evaluate(`document.querySelector('#dashboard-app').classList.contains('sidebar-collapsed')`), "Sidebar did not collapse for category layout check.");
    await delay(250);
    const collapsedColumns = await evaluate(`getComputedStyle(document.querySelector('#category-grid')).gridTemplateColumns.split(' ').length`);
    assert.equal(collapsedColumns, expandedColumns);
    await evaluate(`document.querySelector('#dashboard-app').classList.remove('sidebar-collapsed')`);
    await waitFor(()=>evaluate(`!document.querySelector('#dashboard-app').classList.contains('sidebar-collapsed')`), "Sidebar did not expand after category layout check.");
    await delay(250);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    const categoryMobile = await evaluate(`({columns:getComputedStyle(document.querySelector('#category-grid')).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.category-card')].every(card=>card.scrollWidth<=card.clientWidth+1)})`);
    assert.equal(categoryMobile.columns, 1);
    assert.equal(categoryMobile.overflow, false, "Mobile category cards should not cause horizontal overflow.");
    assert.equal(categoryMobile.cards, true, "Mobile category card content should remain within each card.");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1365, height: 900, deviceScaleFactor: 1, mobile: false });
    await click('#category-grid .category-card');
    assert.equal(await evaluate(`document.querySelector('#category-filter').value`), 'academico');
    assert.equal(await evaluate(`document.querySelectorAll('#mail-list .mail-row').length`), categories.data.filter(mail => mail.key === 'academico').length);
    await click('[data-view="home"]');
    await evaluate(`window.originalCategory=emails[0].hipotesis_diseno.categoria; emails[0].hipotesis_diseno.categoria=undefined; renderHome()`);
    assert.match(await evaluate(`document.querySelector('.unclassified-link').textContent`), /Sin clasificar: 1 comunicación/);
    await click('.unclassified-link');
    assert.equal(await evaluate(`document.querySelector('#communications-title').textContent`), 'Sin clasificar');
    assert.equal(await evaluate(`document.querySelectorAll('#mail-list .mail-row').length`), 1);
    await evaluate(`emails[0].hipotesis_diseno.categoria=window.originalCategory`);
    await click('[data-view="home"]');
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
    await click("#close-detail");
    await evaluate(`const mail=emails.find(item=>item.id==='demo-academico-revisar'); mail.cuerpo_disponible=true; mail.cuerpo='Confirmá el acceso al laboratorio en la plataforma.'; mail.observado.captura={url:'https://example.edu/messages/demo-academico-revisar'}; document.querySelector('#global-search').value='acceso al laboratorio'; document.querySelector('#global-search').dispatchEvent(new Event('input',{bubbles:true}))`);
    await waitUntil(`document.querySelectorAll('#mail-list .mail-row').length===1`, "Search did not match content when explicitly available.");
    await click("#mail-list .mail-row");
    await waitUntil(`document.querySelector('#detail-content').textContent.includes('Confirmá el acceso al laboratorio')`, "Available message content was not shown in details.");
    assert.equal(await evaluate(`document.querySelector('#detail-content a[href^="https://example.edu/"]')?.textContent`), "Abrir mensaje original");
    await click("#close-detail");
    await evaluate(`document.querySelector('#global-search').value='Guía de ejercicios'; document.querySelector('#global-search').dispatchEvent(new Event('input',{bubbles:true}))`);
    await waitUntil(`document.querySelectorAll('#mail-list .mail-row').length===1`, "Search did not return to the selected subject.");
    const detailActions = await evaluate(`document.querySelector('.detail-actions').textContent`);
    assert.match(detailActions, /Marcar como revisado/i);
    assert.match(detailActions, /Marcar como relevante/i);
    const overflow = await evaluate(`({width:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})`);
    assert(overflow.width <= overflow.client, `Horizontal overflow at desktop: ${JSON.stringify(overflow)}`);

    await evaluate(`document.querySelectorAll('.detail-actions button').forEach(button=>{if(button.textContent==='Marcar como revisado')button.click()})`);
    await waitUntil(`document.querySelector('#detail-content').textContent.includes('Estado de revisiónRevisado')`, "Review status did not update independently.");
    assert.match(await evaluate(`document.querySelector('#detail-content').textContent`), /RelevanciaSin marcar/);
    await evaluate(`document.querySelectorAll('.detail-actions button').forEach(button=>{if(button.textContent==='Marcar como relevante')button.click()})`);
    await waitUntil(`document.querySelector('#detail-content').textContent.includes('Marcada como relevante por vos')`, "Student relevance did not update.");
    assert.match(await evaluate(`document.querySelector('#detail-content').textContent`), /CompromisoSin compromiso asociado/);

    await click("#close-detail");
    await evaluate(`document.querySelector('#category-filter').value='academico'; document.querySelector('#category-filter').dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('#review-filter').value='reviewed'; document.querySelector('#review-filter').dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('#relevance-filter').value='relevant'; document.querySelector('#relevance-filter').dispatchEvent(new Event('change',{bubbles:true}))`);
    await waitUntil(`document.querySelectorAll('#mail-list .mail-row').length === 1`, "Combined category, review, and relevance filters did not match the selected communication.");
    await click("#reset");
    await evaluate(`document.querySelector('#global-search').value='Guía de ejercicios'; document.querySelector('#global-search').dispatchEvent(new Event('input',{bubbles:true}))`);
    await waitUntil(`document.querySelectorAll('#mail-list .mail-row').length===1`, "Communication search did not restore the selected message.");
    await click("#mail-list .mail-row");
    await click(".detail-actions .button.primary");
    await waitUntil(`document.querySelector('#task-dialog').open`, "Commitment form did not open from the communication.");
    const title = await evaluate(`document.querySelector('#task-title').value`);
    assert(title, "Commitment title should be proposed from the communication subject.");
    const sourceReference = await evaluate(`document.querySelector('#task-source').textContent`);
    assert.match(sourceReference, /Guía de ejercicios/);
    await evaluate(`window.confirmCalls=[]; window.confirm=message=>{window.confirmCalls.push(message);return true}; document.querySelector('#task-title').value='Repasar la guía'; document.querySelector('#task-description').value='Revisar los ejercicios'; document.querySelector('#task-form').requestSubmit()`);
    await waitUntil(`!document.querySelector('#task-dialog').open && JSON.parse(localStorage.getItem('academic-followup.tasks.v1')||'[]').length===1`, "Confirmed commitment was not persisted.");
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('academic-followup.tasks.v1'))[0].sourceEmailId`), "demo-academico-revisar");
    assert.match(await evaluate(`window.confirmCalls.join(' ')`), /Crear este compromiso/);

    await click("nav [data-view='tasks']");
    await waitUntil(`document.querySelectorAll('.task-card').length===1`, "Saved commitment was not shown in Mis compromisos.");
    assert.match(await evaluate(`document.querySelector('.task-card').textContent`), /Comunicación relacionada: Guía de ejercicios/);
    await evaluate(`[...document.querySelectorAll('.task-card button')].find(button=>button.textContent==='Editar').click()`);
    await waitUntil(`document.querySelector('#task-dialog').open`, "Commitment edit form did not open.");
    await evaluate(`document.querySelector('#task-title').value='Repasar ejercicios seleccionados'; document.querySelector('#task-form').requestSubmit()`);
    await waitUntil(`JSON.parse(localStorage.getItem('academic-followup.tasks.v1'))[0].title==='Repasar ejercicios seleccionados'`, "Edited commitment was not persisted.");
    await evaluate(`const status=document.querySelector('.task-card select'); status.value='finalizada'; status.dispatchEvent(new Event('change',{bubbles:true}))`);
    await waitUntil(`document.querySelector('.task-group h2').textContent.includes('Completados')`, "Commitment could not be marked complete.");
    await click("nav [data-view='home']");
    assert.equal(await evaluate(`document.querySelector('#summary-grid').textContent.includes('Compromisos activos0')`), true);

    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    const mobileOverflow = await evaluate(`({width:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,inner:innerWidth,visual:visualViewport.width,small:matchMedia('(max-width:560px)').matches,widths:['#dashboard-app','.main-content','#home-view','.home-bento','.attention-card','#category-grid','.category-card'].map(s=>[s,Math.round(document.querySelector(s).getBoundingClientRect().width),document.querySelector(s).scrollWidth]),categories:getComputedStyle(document.querySelector('#category-grid')).gridTemplateColumns})`);
    const overflowElements = await evaluate(`[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,id:el.id,class:typeof el.className==='string'?el.className:'',parent:el.parentElement?.className,text:el.textContent.trim().slice(0,65),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width),min:getComputedStyle(el).minWidth})).filter(el=>el.width>document.documentElement.clientWidth+1&&el.width<480).sort((a,b)=>a.width-b.width).slice(0,12)`);
    assert(mobileOverflow.width <= mobileOverflow.client, `Horizontal overflow at mobile: ${JSON.stringify(mobileOverflow)} ${JSON.stringify(overflowElements)}`);
    assert.equal(mobileOverflow.categories.split(' ').length, 2, "Mobile category cards should use two readable columns.");
    await click("#orgi-launcher");
    await delay(250);
    const mobileSidebar = await evaluate(`({expanded:document.querySelector('#orgi-launcher').getAttribute('aria-expanded'),sidebar:document.querySelector('.sidebar').getBoundingClientRect().toJSON(),main:document.querySelector('.main-content').getBoundingClientRect().toJSON(),width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth})`);
    assert.equal(mobileSidebar.expanded, "false", "Sidebar should also collapse through the avatar on mobile.");
    assert(mobileSidebar.sidebar.bottom <= mobileSidebar.main.top, "Mobile sidebar should remain above the content rather than overlap it.");
    assert(mobileSidebar.scrollWidth <= mobileSidebar.width, `Collapsed mobile sidebar caused horizontal overflow: ${JSON.stringify(mobileSidebar)}`);
    await click("#orgi-launcher");
    await cdp("Emulation.clearDeviceMetricsOverride");

    await cdp("Page.reload");
    await waitUntil(`document.querySelector('#open-control-center') && document.querySelector('#source-indicator')?.getAttribute('aria-label')`, "Dashboard demo did not reload.");
    await click("#open-control-center");
    await waitUntil(`!document.querySelector('#dashboard-app').classList.contains('hidden')`, "Dashboard did not reopen after reload.");
    const persistedHome = await evaluate(`document.querySelector('#summary-grid').textContent`);
    assert.match(persistedHome, /Relevantes para vos1/);
    assert.match(persistedHome, /Compromisos activos0/);
    await click("nav [data-view='tasks']");
    await waitUntil(`document.querySelector('.task-group h2').textContent.includes('Completados')`, "Completed commitment state did not survive reload.");
    assert.match(await evaluate(`document.querySelector('.task-card h3').textContent`), /Repasar ejercicios seleccionados/);
    await evaluate(`window.confirmCalls=[]; window.confirm=message=>{window.confirmCalls.push(message);return true}; document.querySelector('.task-card button.danger').click()`);
    await waitUntil(`JSON.parse(localStorage.getItem('academic-followup.tasks.v1')||'[]').length===0`, "Confirmed commitment deletion was not persisted.");
    assert.match(await evaluate(`window.confirmCalls.join(' ')`), /Eliminar el compromiso/);
    assert.match(await evaluate(`document.querySelector('#task-list').textContent`), /Tu espacio de compromisos empieza acá/);

    await evaluate(`localStorage.setItem('academic-followup.decisions.v1',JSON.stringify({'demo-academico-revisar':'relevante','demo-academico-informativo':'no_relevante'})); localStorage.removeItem('academic-followup.relevance.v1')`);
    await cdp("Page.reload");
    await waitUntil(`document.querySelector('#source-indicator')?.getAttribute('aria-label') || false`, "Legacy decision data did not reload.");
    await evaluate(`window.orgiLauncherReference=document.querySelector('#orgi-launcher'); window.orgiAvatarReference=document.querySelector('#orgi-avatar')`);
    await click("#open-control-center");
    await waitUntil(`!document.querySelector('#dashboard-app').classList.contains('hidden')`, "Dashboard did not reopen with legacy state.");
    const legacyStates = await evaluate(`({reviewed:mailState('demo-academico-informativo').reviewed,relevant:mailState('demo-academico-revisar').relevant,summary:document.querySelector('#summary-grid').textContent})`);
    assert.equal(legacyStates.reviewed, true, "Legacy no_relevante must still mean reviewed.");
    assert.equal(legacyStates.relevant, true, "Legacy relevante must migrate into student relevance.");
    assert.match(legacyStates.summary, /Comunicaciones sin revisar23/);
    assert.match(legacyStates.summary, /Relevantes para vos1/);

    await click("#back-to-inbox");
    await waitUntil(`!document.querySelector('#outlook-view').classList.contains('hidden')`, "Returning to Outlook should restore the inbox.");
    const returnedAvatar = await evaluate(`({sameLauncher:document.querySelector('#orgi-launcher')===window.orgiLauncherReference,sameAvatar:document.querySelector('#orgi-avatar')===window.orgiAvatarReference,parent:document.querySelector('#orgi-launcher').parentElement.id,controls:document.querySelector('#orgi-launcher').getAttribute('aria-controls'),label:document.querySelector('#orgi-launcher').getAttribute('aria-label'),tooltip:document.querySelector('#orgi-launcher').title,avatarInstances:document.querySelectorAll('#orgi-avatar').length})`);
    assert.equal(returnedAvatar.sameLauncher, true, "Returning to Outlook should restore the same launcher node.");
    assert.equal(returnedAvatar.sameAvatar, true, "Returning to Outlook should restore the same animated avatar node.");
    assert.equal(returnedAvatar.parent, "orgi-launcher-slot");
    assert.equal(returnedAvatar.controls, "orgi-panel");
    assert.equal(returnedAvatar.label, "Abrir Orgi");
    assert.equal(returnedAvatar.tooltip, "Abrir el panel de Orgi");
    assert.equal(returnedAvatar.avatarInstances, 1);
    await click("#orgi-launcher");
    await waitUntil(`document.querySelector('#orgi-panel').classList.contains('open')`, "Avatar should retain its original Outlook panel action after returning.");
    await click("#orgi-close");
    await click("#open-control-center");
    await waitUntil(`!document.querySelector('#dashboard-app').classList.contains('hidden')`, "Dashboard should reopen after checking the Outlook avatar behavior.");

    await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.fetch=()=>Promise.reject(new Error('offline smoke test'));" });
    await cdp("Page.reload");
    await waitUntil(`Boolean(document.querySelector('#app-error') && !document.querySelector('#app-error').classList.contains('hidden'))`, "Data-loading error state was not presented.");
    assert.match(await evaluate(`document.querySelector('#app-error').textContent`), /No se pudo cargar la demostración/);

    console.log("PASS Orgi dashboard smoke: home, search, details, separate state, filters, commitment lifecycle, legacy persistence, errors and responsive width");
  } finally {
    socket?.close();
    browser.kill("SIGTERM");
    server.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
