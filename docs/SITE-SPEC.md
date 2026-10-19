# Catalog site specification

## Purpose

A static page where engineers discover the plugins in this marketplace, see what each contains, and copy the install command.

## Data

`scripts/build-index.mjs` generates `site/data/index.json` at build time from `marketplace.json`, each `plugin.json` and each `SKILL.md`. The file is not committed (`site/data/` is git-ignored). The site has no other data source.

```jsonc
{
  "generatedAt": "ISO-8601",
  "marketplace": { "name": "", "description": "", "owner": "" },
  "plugins": [{
    "name": "", "description": "", "version": "", "category": "", "tags": [],
    "install": "/plugin install <name>@<marketplace>",
    "skills": [{ "name": "", "description": "", "metadataTokens": 0, "bodyTokens": 0 }],
    "commands": [], "agents": [], "hooks": false, "mcpServers": false,
    "cost": { "alwaysLoadedTokens": 0, "onInvokeTokens": 0 }
  }]
}
```

Plugins with a remote `source` appear with catalog fields only (`remote: true`, no version or skills).

## Page

- Header: marketplace name, description, generation date.
- Filter box matching name, description, category, tags and skill names.
- One card per plugin: name, version, description, category, tags, skill list, cost summary, install command with a copy button.

## Requirements

- Static HTML/CSS/JS, no framework, no external requests, no tracking.
- All text inserted with `textContent` (the data is repository content, not trusted markup).
- Works at phone width; light and dark themes; keyboard accessible with visible focus.
- The page still reads correctly if the clipboard API is unavailable.

## Build and hosting

`.github/workflows/pages.yml` runs the index builder and deploys `site/` to GitHub Pages when `site/`, `plugins/`, `.claude-plugin/` or the builder changes. `validate.yml` runs `build-index.mjs --check` on every pull request.

## Out of scope

Install analytics, user accounts, per-version history pages, and any server-side component.
