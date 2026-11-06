const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = ["core", "outlook", "dashboard", "dashboard-events", "orgi-avatar", "app"];

assert.match(html, /<link rel="stylesheet" href="styles\/app\.css">/);
assert.doesNotMatch(html, /<style\b|<script(?![^>]*\bsrc=)/);
assert.deepEqual(
  [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map(match => match[1]),
  scripts.map(name => `scripts/${name}.js`),
  "Classic scripts must load in dependency order",
);
assert.match(fs.readFileSync(path.join(root, "styles/app.css"), "utf8"), /--orgi-bg:\s*#0E1420/);
for (const name of scripts) {
  const source = fs.readFileSync(path.join(root, `scripts/${name}.js`), "utf8");
  assert.match(source, /^\s*"use strict";/);
  new vm.Script(source, { filename: `${name}.js` });
}
console.log("Static asset boundaries and script order passed.");
