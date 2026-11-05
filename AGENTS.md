# Project Guide

## Stack

- Static app: HTML5, CSS, and browser-native JavaScript; no framework, build step, package manager, backend, or runtime API dependency.
- Demo communications: `data/comunicaciones_demo_v01.json`, loaded by the browser with `fetch`.
- Icons: local Fluent SVG sprite at `icons/fluent.svg`. `icons/build_sprite.py` is a manual asset-maintenance script, not part of app startup.
- Tests: Node.js built-in test utilities; test files use CommonJS.
- Python's built-in HTTP server is sufficient for local development.

## Run and verify

Serve the repository root; do not open `index.html` as a `file://` URL because the app fetches its JSON data.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Run the existing checks with:

```sh
node tests/orgi-dashboard.cjs
node tests/orgi-avatar.cjs
```

There is no `npm install`, build, or production-server command in the current project.

## Project conventions

- Keep the prototype dependency-free; do not introduce a framework, package manager, service, or external runtime asset without an explicit product need.
- Preserve existing navigation, search, filters, sorting, task workflows, demo-data semantics, and localStorage keys and formats.
- Keep interface changes responsive and keyboard-accessible; retain visible focus and `prefers-reduced-motion` behavior.
- Use the existing local Fluent sprite for icons and keep visual styling consistent with the current design tokens in `index.html`.
- Treat `outlook_espejo_*.html` and `outlook_espejo_*.json` as generated reference artifacts, not app entry points.
