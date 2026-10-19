# Catalog site specification

## Purpose

A static site where engineers discover the plugins in this marketplace, see what each contains and which plugins it depends on, read its documentation and release notes, and copy the install command. Installing stays a Claude Code CLI action; the site is for discovery. Source and commands: [`site/README.md`](../site/README.md).

## Data

`site/scripts/build-index.mjs` generates, at build time, from `marketplace.json`, each `plugin.json`, `README.md`, `CHANGELOG.md`, `COMPATIBILITY.md`, and the frontmatter of every `SKILL.md`, agent and command file:

- `site/public/index.json`: `{ schemaVersion, generatedAt, marketplace, entries[] }`. One entry per plugin, skill, agent and command (`id`, `kind`, `name`, `plugin`, `description`, `keywords`, `author`, `version`, `updated`, `install`, `githubUrl`, `hasBody`, `searchText`, plus `invocation`, `tools`, `model` for artifacts and `dependencies`, `compatibility`, `releases`, `hooks`, `mcpServers`, `cost` for plugins).
- `site/public/bodies/<id>.md`: the README or the file text of each entry, loaded on its detail page.

The files are not committed (git-ignored). The shape is defined in `site/src/types.ts` and `schemaVersion` changes with every breaking change. Plugins with a remote `source` appear with catalog fields only (`remote: true`). `build-index.mjs --check` validates without writing and runs in `scripts/validate.sh` and CI.

## Pages (hash routes)

| Route | Content |
| :- | :- |
| `#/` | Search box, counts per kind, latest releases |
| `#/search?q=&kind=&kw=&author=&sort=` | Results with filters (type, keywords, author) and sorting; all state is in the URL |
| `#/plugin/<name>` | Version, author, update date, compatibility, context cost, dependencies, contents, README, changelog, install command with copy button; a notice when the plugin ships hooks or MCP servers |
| `#/artifact/<plugin>/<kind>/<name>` | Description, scoped name or invocation, tools, model, text, install command of its plugin |
| `#/whats-new` | Releases of all plugins from their `CHANGELOG.md` |
| `#/getting-started` | Add the marketplace, install, update |

Search matches every word against name, plugin name, keywords, description and the start of the text.

## Requirements

- React 18, TypeScript and Vite; no backend, no analytics, no third-party requests at runtime (system fonts, bundled code).
- Markdown from the repository is rendered with `marked` and always sanitized with `DOMPurify`; other text is inserted by React, never as HTML.
- Works at phone width; light and dark themes (system default, saved choice); keyboard accessible with visible focus.
- The page still reads correctly if the clipboard API is unavailable: install commands are always visible next to their copy button.
- UI text and documentation are in English.

## Build and hosting

- `.github/workflows/site.yml` runs tests and a production build on every pull request that touches `site/`, `plugins/` or `.claude-plugin/`.
- `.github/workflows/pages.yml` repeats the build after a merge to `main` and publishes `site/dist` to GitHub Pages. `site/public/` is copied into the build as is.
- `site/package-lock.json` is committed; CI uses `npm ci --ignore-scripts`. Dependabot updates npm packages and Actions weekly.

## Out of scope

Install analytics, user accounts, ratings, per-version history pages, server-side rendering and any server-side component.

## Real data only

The site shows exactly what the repository contains: every entry comes from `marketplace.json`, `plugin.json` and the files under `plugins/`. There is no sample content, and an empty marketplace renders an empty state. The static design prototype (with invented demo plugins) lives in `docs/design/catalog-ui/` and is not published.

## Local development

`npm run dev` in `site/` builds `public/index.json` and starts Vite on http://127.0.0.1:5173. While it runs, any change under `plugins/` or `.claude-plugin/` rebuilds the index and reloads the page; an invalid change prints the builder's problems and keeps the last good index.
