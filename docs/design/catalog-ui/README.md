# Catalog UI (design prototype)

Standalone design prototype of the catalog (search, facets, plugin and artifact pages, ⌘K palette, light/dark theme). It is **not** part of the catalog app in `site/src` and shares no code or data with it: its mock data lives in `index.html`.

- `index.html` – the whole prototype (markup, styles, logic, mock data)
- `support.js` – the generated `dc-runtime` bundle (do not edit by hand; rebuild it in `dc-runtime` and copy it here)

Vite copies `site/public/` into the build as is, so GitHub Pages serves it at `https://<owner>.github.io/<repo>/catalog-ui/`. Locally: `npm run dev` in `site/`, then open `/catalog-ui/`.

It loads React 18.3.1 and ReactDOM 18.3.1 from `unpkg.com` (pinned, SRI-checked) and IBM Plex from Google Fonts. To drop the unpkg dependency, host the two UMD files locally and set `window.__resources` before `support.js`.
