const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const html = fs.readFileSync(process.argv[2] || "index.html", "utf8");
const source = html.match(/    function initOrgiPersonality\(\) \{[\s\S]*?\n    \}/)?.[0];
if (!source) throw new Error("Could not find initOrgiPersonality in the supplied HTML.");

function setup(random = 0.9) {
  let now = 0;
  let serial = 0;
  let queuedRandom = [];
  const timers = new Map();
  const document = new EventTarget();
  const window = new EventTarget();
  const motion = new EventTarget();
  const launcher = new EventTarget();
  const cta = new EventTarget();
  const classes = new Set();
  const style = {};
  const ctaClasses = new Set();
  const ctaWrap = { hidden: false, classList: { add: value => ctaClasses.add(value), remove: value => ctaClasses.delete(value) } };
  const sessionValues = new Map();
  const avatar = {
    dataset: {},
    style: { setProperty: (name, value) => { style[name] = value; } },
    classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
  };
  document.hidden = false;
  motion.matches = false;
  launcher.getBoundingClientRect = () => ({ left: 0, top: 0, width: 44, height: 44 });
  cta.hovered = false;
  cta.matches = selector => selector === ":hover" && cta.hovered;
  cta.contains = target => target === cta;
  window.matchMedia = () => motion;
  window.sessionStorage = {
    getItem: key => sessionValues.get(key) ?? null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
  };
  window.requestAnimationFrame = callback => { callback(); return 1; };
  window.setTimeout = (callback, delay) => {
    const id = ++serial;
    timers.set(id, { callback, at: now + delay });
    return id;
  };
  const math = Object.create(Math);
  math.random = () => queuedRandom.length ? queuedRandom.shift() : random;
  const context = vm.createContext({
    window,
    document,
    AbortController,
    clearTimeout: id => timers.delete(id),
    performance: { now: () => now },
    Math: math,
    $: selector => ({
      "#orgi-launcher": launcher,
      "#orgi-avatar": avatar,
      "#orgi-cta": cta,
      "#orgi-cta-wrap": ctaWrap,
      "#orgi-cta-arrow": { classList: { add() {}, remove() {} } },
    })[selector] ?? avatar,
  });
  vm.runInContext(`${source}\nvar cleanup = initOrgiPersonality();`, context);

  return {
    avatar, classes, cta, ctaClasses, ctaWrap, document, launcher, motion, sessionValues, style, timers, window,
    cleanup: () => context.cleanup(),
    reinitialize: () => context.initOrgiPersonality(),
    random: (...values) => { queuedRandom.push(...values); },
    tick(milliseconds) {
      const end = now + milliseconds;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = end;
    },
    move(x, y = 22) { document.emit?.("pointermove", { clientX: x, clientY: y, pointerType: "mouse" }); },
  };
}

function emit(target, type, properties = {}) {
  const event = new Event(type);
  Object.assign(event, properties);
  target.dispatchEvent(event);
}

// Add a small helper to the test document's EventTarget instance for pointer probes.
const originalSetup = setup;
setup = (...args) => {
  const test = originalSetup(...args);
  test.document.emit = (type, properties) => emit(test.document, type, properties);
  test.window.emit = (type, properties) => emit(test.window, type, properties);
  test.motion.emit = (type, properties) => emit(test.motion, type, properties);
  test.launcher.emit = (type, properties) => emit(test.launcher, type, properties);
  test.cta.emit = (type, properties) => emit(test.cta, type, properties);
  return test;
};

let failures = 0;
function test(name, run) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

test("gaze stays bounded and head follows after a delay", () => {
  const state = setup();
  state.move(122);
  assert.equal(state.style["--orgi-eye-x"], "2.1px");
  assert.equal(state.style["--orgi-tilt"], "0.0deg");
  state.tick(110);
  assert.equal(state.style["--orgi-tilt"], "3.4deg");
  state.move(141);
  assert.equal(state.style["--orgi-eye-x"], "0.0px");
});

test("idle glance cannot overwrite active cursor watching", () => {
  const state = setup();
  state.random(0.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.5, 0.9);
  state.tick(5260);
  state.move(70);
  state.tick(1900);
  assert.equal(state.avatar.dataset.state, "watching");
  assert.notEqual(state.style["--orgi-eye-x"], "0.0px");
});

test("happy state survives ordinary pointer movement", () => {
  const state = setup();
  emit(state.launcher, "pointerenter");
  state.tick(16);
  state.move(30);
  assert.equal(state.avatar.dataset.state, "happy");
});

test("surprise state survives the next pointer sample", () => {
  const state = setup();
  state.tick(9000);
  state.move(222);
  state.tick(20);
  state.move(22);
  assert.equal(state.avatar.dataset.state, "surprised");
  state.tick(16);
  state.move(23);
  assert.equal(state.avatar.dataset.state, "surprised");
});

test("hiding the tab clears a blink before cancelling timers", () => {
  const state = setup();
  state.tick(6740);
  assert(state.classes.has("is-blinking"));
  state.document.hidden = true;
  emit(state.document, "visibilitychange");
  assert.equal(state.timers.size, 0);
  assert(!state.classes.has("is-blinking"));
});

test("reduced motion and hidden-tab suspension cancel timers and cleanup listeners", () => {
  const state = setup();
  state.move(70);
  state.motion.matches = true;
  emit(state.motion, "change");
  assert.equal(state.timers.size, 0);
  state.move(30);
  assert.equal(state.avatar.dataset.state, "idle");
  state.motion.matches = false;
  emit(state.motion, "change");
  state.document.hidden = true;
  emit(state.document, "visibilitychange");
  assert.equal(state.timers.size, 0);
  state.document.hidden = false;
  emit(state.document, "visibilitychange");
  state.cleanup();
  assert.equal(state.timers.size, 0);
  state.move(30);
  assert.equal(state.timers.size, 0);
});

test("idle scheduling resumes after reduced motion is disabled", () => {
  const state = setup();
  state.move(70);
  state.motion.matches = true;
  emit(state.motion, "change");
  state.motion.matches = false;
  emit(state.motion, "change");
  assert(state.timers.size >= 2);
});

test("sleepy state wakes naturally", () => {
  const state = setup(0);
  state.tick(39600);
  assert.equal(state.avatar.dataset.state, "sleepy");
  state.tick(2100);
  assert.equal(state.avatar.dataset.state, "idle");
});

test("pagehide cancels timers and aborts listeners", () => {
  const state = setup();
  emit(state.window, "pagehide");
  assert.equal(state.timers.size, 0);
  state.move(30);
  emit(state.launcher, "pointerenter");
  assert.equal(state.timers.size, 0);
});

test("repeated avatar clicks toggle Orgi while only opening refreshes its content", () => {
  const calls = [];
  const registrations = [...html.matchAll(/\$\("#(orgi-launcher|orgi-cta)"\)\.addEventListener\("click", handleLauncherClick\)/g)].map(match => match[1]);
  assert.deepEqual(registrations, ["orgi-launcher"]);
  const open = html.match(/function openOrgi\(\) \{[^}]+\}/)?.[0];
  assert(open);
  const panelClasses = new Set();
  vm.runInNewContext(`${open}; openOrgi(); openOrgi();`, {
    $(selector) {
      assert.equal(selector, "#orgi-panel");
      return { classList: { contains: value => panelClasses.has(value) } };
    },
    renderOutlook: () => calls.push("render"),
    toggleOrgi(value) { calls.push(value); if (value) panelClasses.add("open"); else panelClasses.delete("open"); },
  });
  assert.deepEqual(calls, ["render", true, false]);
});

test("Orgi panel uses the supplied dark palette", () => {
  const palette = {
    bg: "#0E1420", sidebar: "#111827", surface: "#171F30", "surface-hover": "#202A40", border: "#2A354A",
    text: "#F5F7FF", "text-muted": "#A6B3C8", blue: "#4A9EFF", purple: "#826BFF", lavender: "#A68AFF",
    success: "#34D5A0", warning: "#FFBF69", danger: "#FF6B81", "avatar-body": "#0B1020", "avatar-eyes": "#F5FAFF", "avatar-outline": "#22D3EE", "avatar-glow": "#A78BFA",
  };
  for (const [name, value] of Object.entries(palette)) {
    assert.ok(new RegExp(`--orgi-${name}\\s*:\\s*${value}`).test(html), `missing --orgi-${name}: ${value}`);
  }
  assert.match(html, /\.orgi-avatar\s*\{[^}]*border:1px solid var\(--orgi-avatar-outline\)/);
  assert.match(html, /\.orgi-avatar-art stop:first-child\s*\{[^}]*stop-color:\s*var\(--orgi-avatar-outline\)[^}]*stop-opacity:\s*\.32/);
  assert.match(html, /\.orgi-avatar-art stop:last-child\s*\{[^}]*stop-color:\s*var\(--orgi-avatar-body\)/);
  assert.match(html, /\.orgi-launcher:hover \.orgi-avatar\s*\{[^}]*var\(--orgi-avatar-outline\)[^}]*var\(--orgi-avatar-glow\)/);
  assert.match(html, /\.orgi-panel\s*\{[^}]*background:var\(--orgi-bg\)[^}]*color:var\(--orgi-text\)/);
});

test("context CTA is informational, not a button, and has a right-pointing Fluent arrow", () => {
  assert.match(html, /<div class="orgi-cta" id="orgi-cta">/);
  assert.doesNotMatch(html, /<button[^>]*id="orgi-cta"|orgi-cta-dismiss|>×</);
  assert.match(html, /Mejoremos tu experiencia/);
  assert.match(html, /orgi-cta-arrow[^>]*>[\s\S]*?icons\/fluent\.svg#arrow-right-16-regular/);
  assert.match(html, /id="orgi-launcher" type="button"[^>]*aria-label="Abrir Orgi"/);
  assert.ok(/@media\(max-width:760px\)[\s\S]*?\.orgi-cta-wrap\s*\{\s*display:none/.test(html), "CTA should hide at narrow widths");
});

test("CTA appears with an eye-first curious glance and returns to idle", () => {
  const state = setup();
  assert(state.ctaClasses.has("is-visible"));
  assert.equal(state.style["--orgi-eye-x"], "-2.4px");
  state.tick(260);
  assert.equal(state.avatar.dataset.state, "curious");
  state.tick(1400);
  assert.equal(state.avatar.dataset.state, "idle");
  assert.equal(state.style["--orgi-eye-x"], "0.0px");
});

test("hovering the informational CTA tracks the cursor without adding dismissal controls", () => {
  const state = setup();
  state.cta.hovered = true;
  state.move(-70);
  assert(Number.parseFloat(state.style["--orgi-eye-x"]) < 0);
  assert.equal(state.ctaWrap.hidden, false);
  assert.equal(state.sessionValues.has("orgi-cta-dismissed"), false);
});

if (failures) process.exitCode = 1;
else console.log("All Orgi avatar probes passed.");
