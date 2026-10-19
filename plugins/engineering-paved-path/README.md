# engineering-paved-path

One shared source of engineering skills for TypeScript web projects: React, Next.js, Fastify, testing, architecture, Drizzle, PostgreSQL, Zod, TypeScript, security and Mermaid. Other plugins and agents load them instead of carrying their own copies.

- **Owner:** see `CODEOWNERS`
- **Install:** `/plugin marketplace add AlenkaNahorna/dev-digest-marketplace`, then `/plugin install engineering-paved-path@dev-digest-marketplace`

## What you get

Skills load on demand when Claude decides they apply (only each skill's name and description are always in context).

| Area | Skill | Use it for |
| :- | :- | :- |
| React | `react-best-practices` | Component design, state, hooks misuse, performance, data fetching |
| React testing | `react-testing-library` | React Testing Library with Vitest: setup, query priority, `userEvent`, async patterns, mocking |
| Next.js | `next-best-practices` | File conventions, RSC boundaries, data patterns, async APIs, metadata, route handlers, bundling |
| Frontend architecture | `ui-frontend-architecture` | Component ownership, feature boundaries, where state and business logic live |
| Fastify | `fastify-best-practices` | Routes, plugins, schema validation, error handling, hooks, logging, deployment |
| Backend architecture | `onion-architecture` | Module-local onion layering, ports and adapters, forbidden imports, a per-layer review checklist for code an architecture check cannot reach |
| Data | `drizzle-orm-patterns` | Drizzle schemas, queries, relations, transactions, migrations |
| Data | `postgresql-table-design` | PostgreSQL types, indexing, constraints, performance |
| Validation | `zod` | Schemas, `safeParse`, error handling, type inference |
| TypeScript | `typescript-expert` | Type-level programming, performance, monorepos, migrations, tooling |
| Security | `security` | OWASP Top 10:2025 for web apps: auth, input handling, uploads, secrets |
| Diagrams | `mermaid-diagram` | Flowcharts, sequence, class, ER and state diagrams in Markdown |

Each skill folder holds its `SKILL.md` and, where useful, reference files (for example `fastify-best-practices/rules/`, `zod/references/`).

## How to use it

Skills trigger from your request, or you can name them:

```text
Use engineering-paved-path:onion-architecture to review this module.
Use engineering-paved-path:zod when you write the request schema.
```

Skills from this plugin are always namespaced with `engineering-paved-path:`.

## Used by other plugins

| Plugin | How it uses these skills |
| :- | :- |
| `sdd-engineering` | `implementation-planner` and `implementer` preload the technical skills; `spec-creator` reads `security` and `mermaid-diagram` on demand. |
| `architecture-review` | `architecture-reviewer` preloads `onion-architecture` and `ui-frontend-architecture`. |

Removing or renaming a skill here is a **major** release, because dependents reference skills by name.

## Notes on the stack

These skills assume a TypeScript web stack (React and Next.js on the frontend, Fastify and Drizzle on PostgreSQL on the backend). If your repository uses a different technology, the agents that preload them skip the ones that do not apply. `onion-architecture` expects the repository to say where its backend source root is (in `AGENTS.md`/`CLAUDE.md` or architecture docs).

## Sources

Several skills originate from public projects and keep their upstream attribution inside the skill folder. Confirm the licence of each before the 1.0.0 release.

| Skill | Origin |
| :- | :- |
| `drizzle-orm-patterns` | `giuseppe-trisciuoglio/developer-kit` |
| `fastify-best-practices` | `mcollina/skills` |
| `next-best-practices` | `vercel-labs/next-skills` |
| `postgresql-table-design` | `wshobson/agents` |
| `typescript-expert` | `sickn33/antigravity-awesome-skills` |
| `zod` | `pproenca/dot-skills` |
| `security`, `mermaid-diagram`, `react-testing-library`, `react-best-practices`, `onion-architecture`, `ui-frontend-architecture` | Origin not recorded yet; to be confirmed |

## Requires

- Claude Code (any version that supports plugins).
- No other plugin.

## Data and network

Instructions and reference files only. No hooks, scripts that run on install, MCP servers, network access or credentials. `typescript-expert` includes a diagnostic script (`scripts/ts_diagnostic.py`) that runs only if Claude chooses to run it.
