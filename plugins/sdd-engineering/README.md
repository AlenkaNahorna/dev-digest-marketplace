# sdd-engineering

A spec-driven development (SDD) workflow for Claude Code: write a spec, plan from the spec, implement the plan, review it, and verify the result against the spec's acceptance criteria.

- **Owner:** see `CODEOWNERS`
- **Install:** `/plugin marketplace add AlenkaNahorna/dev-digest-marketplace`, then `/plugin install sdd-engineering@dev-digest-marketplace` (also installs `engineering-paved-path`, `research-tools` and `architecture-review`)

## What you get

| Component | Type | What it does |
| :- | :- | :- |
| `spec-creator` | agent | Turns a feature request and your design sources into one spec with EARS acceptance criteria (`AC-1`, `AC-2`, ...). Asks blocking questions first and marks every unresolved point `[NEEDS CLARIFICATION]` instead of guessing. Writes only new spec files. |
| `implementation-planner` | agent | Reads an existing spec or request plus the repository's rules and writes an Implementation Plan in which every step cites the acceptance criteria it covers. Never writes specs or code. |
| `implementer` | agent | Executes the plan, runs the repository's tests, and self-checks only its own diff. If it cannot find a test command it says so instead of guessing. |
| `plan-verifier` | agent | Read-only. Checks the finished code item by item against the plan and returns a traceability matrix (`PASS` / `FAIL` / `PARTIAL` / `NOT-VERIFIED`) with `file:line` evidence. |
| `implement-plan` | skill | Runs implementation, the architecture review gate with a capped fix loop, and verification in one go. |
| `workflow-retro` | skill | Manual-only retrospective of a finished run; appends to a ledger. |
| `engineering-insights` | skill | Procedure for capturing non-obvious learnings in an append-only insights file. |

## The pipeline

```mermaid
flowchart LR
  R[researcher] -.optional.-> S[spec-creator]
  S --> P[implementation-planner] --> IP[implement-plan]
  IP --> I[implementer] --> A[architecture-reviewer] --> V[plan-verifier]
  V -.manual.-> T[workflow-retro]
```

`spec-creator` and `implementation-planner` are run by hand, so a human sees the spec and the plan before any implementation tokens are spent. Agents never call each other: the main session, or the `implement-plan` skill, spawns them.

## Quick start

```text
1. Use sdd-engineering:spec-creator to write a spec for "export reports as CSV".
2. Use sdd-engineering:implementation-planner to plan specs/SPEC-2026-10-19-export-reports-csv.md.
3. /sdd-engineering:implement-plan plan=docs/plans/2026-10-19-export-reports-csv.md
4. /sdd-engineering:workflow-retro        (optional, manual only)
```

If the spec has open `[NEEDS CLARIFICATION] (for: researcher)` items, run `research-tools:researcher` on them and feed the findings back to `spec-creator` before step 2.

## Where things are written

| Output | Folder | Override |
| :- | :- | :- |
| Specs | `specs/` in the repository root. Repositories that already keep per-package `<package>/specs/` folders get single-package specs there. File name `SPEC-<YYYY-MM-DD>-<slug>.md`. | Name another folder in your request. |
| Plans | `docs/plans/<YYYY-MM-DD>-<slug>.md` | Name another folder in your request. |
| Retro ledger | `docs/retro/ledger.md` (appended, never overwritten) | Input `ledger`. |
| Insights | Path named in `AGENTS.md`/`CLAUDE.md`, else per-package `INSIGHTS.md`, else `ENGINEERING-INSIGHTS.md` in the root | Name another file in your request. |

## Inputs and defaults of `implement-plan`

| Input | Default | Meaning |
| :- | :- | :- |
| `plan` | required | Path to the plan file, or the plan pasted inline. |
| `requirements` | none | Extra clarifications, passed to the implementer as context, never as a plan replacement. |
| `designs` | none | Design references, passed to implementer and reviewer as context. |
| `max_fix_iterations` | `2` | Review-fix loops before it stops and reports open findings. |

The final report states what was implemented, how many fix iterations ran, which review findings are still open, and the `plan-verifier` status. It issues no merge verdict and does not run security review or write tests; do those with your own process.

## Behavior to know about

- **Test command not found.** The implementer reports it instead of inventing one, and `plan-verifier` marks claimed test results `NOT-VERIFIED` unless it re-ran them.
- **No spec acceptance-criteria ids.** The planner says so and skips AC citations.
- **`workflow-retro` never starts on its own.** It has `disable-model-invocation: true` and must be invoked by you.
- Agents use `model: sonnet` and keep the tool lists in their frontmatter. Plugin agents ignore `hooks`, `mcpServers` and `permissionMode`; none uses them.

## Dependencies

| Plugin | Range | Provides |
| :- | :- | :- |
| `engineering-paved-path` | `^1.0.0` | The technical skills the planner and implementer preload (for example `engineering-paved-path:onion-architecture`, `engineering-paved-path:zod`). |
| `research-tools` | `^1.0.0` | `research-tools:researcher`, used for questions `spec-creator` cannot answer itself. |
| `architecture-review` | `^1.0.0` | `architecture-review:architecture-reviewer`, the review gate in `implement-plan`. |

Skills and agents from dependencies are referenced with their plugin namespace.

## Requires

- Claude Code `>=2.1.110` (version-constrained dependencies).
- A git repository (the review and verification steps work on git ranges).
- The three dependency plugins above, installed automatically.

## Data and network

Reads and writes files in the current repository (specs, plans, the retro ledger, the insights file) and runs the repository's own build and test scripts. `researcher` can reach public websites. No credentials are used or stored.
