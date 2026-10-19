# dev-digest-marketplace

Claude Code plugins for DevDigest engineering teams. This marketplace is released independently of the DevDigest product: each plugin has its own owner, version and release cadence.

## Install

```
/plugin marketplace add AlenkaNahorna/dev-digest-marketplace
/plugin install <plugin>@dev-digest-marketplace
```

## Plugins

| Plugin | Purpose |
| :- | :- |
| `engineering-paved-path` | Shared engineering skills (React, Next.js, Fastify, testing, architecture, Drizzle, PostgreSQL, Zod, TypeScript, security, Mermaid), one source for all agents |
| `research-tools` | Read-only researcher agent: finds answers in the repo and external sources and reports with evidence |
| `architecture-review` | Read-only architecture-reviewer agent: reviews a diff against onion/UI layering and repository architecture rules |
| `sdd-engineering` | Spec-driven development workflow: spec-creator, implementation-planner, implementer, plan-verifier, implement-plan, workflow-retro |

A browsable catalog (React + Vite, see [site/README.md](site/README.md)) is built from `site/` and published to GitHub Pages.

## Repository layout

```text
.claude-plugin/marketplace.json   catalog
plugins/<name>/                   one directory per plugin, versioned independently
docs/                             guidelines, security, releases, cost baseline, site spec
scripts/                          validate, release, rollback
site/                             catalog site; data is generated at build time by site/scripts/build-index.mjs
CODEOWNERS                        one owner per plugin (enforced by the rulesets)
.github/rulesets/                 importable branch and tag protection rules
```

## Scripts

| Script | Purpose |
| :- | :- |
| `scripts/new-plugin.sh <name> --owner @org/team --description "..."` | Scaffold a plugin, its catalog entry and its CODEOWNERS line |
| `scripts/validate.sh [--no-cli]` | All checks (`VALIDATE_NO_CLI=1` skips the `claude` CLI). Run before every PR |
| `scripts/release.sh <plugin> <patch\|minor\|major\|X.Y.Z> [--push]` | Prepare a release commit on a branch (PR follows; CI tags after merge) |
| `scripts/rollback.sh <plugin> <X.Y.Z\|tag> [--push]` | Prepare a rollback as a new patch version |
| `scripts/tag-release.sh [--push] [--dry-run]` | Create missing `<plugin>--v<version>` tags (run by CI on `main`) |
| `node site/scripts/build-index.mjs [--check] [--out dir]` | Generate the catalog data and cost baseline (needs `npm ci --prefix site`) |

## Documentation

- [Contributing: start here](CONTRIBUTING.md)
- [Releases, channels and rollback](docs/RELEASES.md)
- [Plugin design guidelines](docs/PLUGIN-GUIDELINES.md)
- [Security](docs/SECURITY.md)
- [Cost baseline](docs/COST-BASELINE.md)
- [Site specification](docs/SITE-SPEC.md)
