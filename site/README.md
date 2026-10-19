# Catalog site

Static catalog of the marketplace: search, plugin and skill pages, release notes, install commands. React 18 + TypeScript + Vite, built by CI and published to GitHub Pages. No backend and no third-party requests.

## Commands

Run in `site/` (Node 22):

```bash
npm ci               # install (use npm install only to change dependencies)
npm run dev          # build the data, serve http://127.0.0.1:5173; reloads when plugins/ or marketplace.json change
npm test             # unit tests (Vitest) and the index builder test (node:test)
npm run build        # data + type check + production build into dist/
npm run preview      # serve dist/ locally, the closest thing to GitHub Pages
```

## How it fits together

```text
scripts/build-index.mjs   reads marketplace.json, plugin.json, README, CHANGELOG, COMPATIBILITY,
                          SKILL.md and agent/command frontmatter -> public/index.json + public/bodies/
src/                      the app; fetches index.json once and bodies/<id>.md per detail page
```

- `public/index.json` and `public/bodies/` are generated and git-ignored; `dist/` too.
- Routes are hash based (`#/search?q=zod`, `#/plugin/<name>`, `#/artifact/<plugin>/<kind>/<name>`, `#/whats-new`, `#/getting-started`), so Pages needs no rewrites. `base: './'` makes it work under `/<repo>/`.
- Search is a small scoring function in `src/search.ts` (every word must match; name, keywords, description, text). The state of the search and its filters lives in the URL.
- Markdown is rendered with `marked` and always passed through `DOMPurify`.
- Change the data shape: edit `scripts/build-index.mjs` and `src/types.ts` together and bump `schemaVersion` for breaking changes.
