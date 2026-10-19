# architecture-review

Read-only architecture reviewer: checks a diff or a set of paths against the architecture rules your own repository states, and reports findings with evidence.

- **Owner:** see `CODEOWNERS`
- **Install:** `/plugin marketplace add AlenkaNahorna/dev-digest-marketplace`, then `/plugin install architecture-review@dev-digest-marketplace` (also installs `engineering-paved-path`)

## What you get

| Component | Type | What it does |
| :- | :- | :- |
| `architecture-reviewer` | agent | Reviews a git range or explicit paths for layering, forbidden imports, barrel exports, module shape, and protected or append-only paths. Never edits files and never issues a merge verdict. |

Tools: `Read`, `Grep`, `Glob`, `Bash` (read-only by prompt convention). Model: `sonnet`.

## Dependency

| Plugin | Range | Why |
| :- | :- | :- |
| `engineering-paved-path` | `^1.0.0` | The agent preloads `engineering-paved-path:onion-architecture` (backend layering rules, forbidden patterns, per-layer review checklist) and `engineering-paved-path:ui-frontend-architecture` (frontend feature boundaries). Installing this plugin installs that one too. |

## How the agent decides what is a violation

It checks only rules that literally exist in your repository or in the preloaded skills, and it quotes the source of each rule:

1. Root `AGENTS.md` / `CLAUDE.md` and the same file in each affected package.
2. Architecture docs those files point to.
3. The two preloaded skills, applied only where the code uses that layout or stack.
4. Machine-readable rules the repository ships (for example dependency-cruiser config or an architecture-check script). The agent finds the script in `package.json` or the docs and runs it once.

If the repository states no rules, the agent says so and lowers the confidence of its findings.

## How to use it

```text
Use architecture-review:architecture-reviewer on the changes since main.
Use architecture-review:architecture-reviewer on src/modules/billing.
```

The scope is always a git range (working tree or `merge-base..HEAD`) or the paths you give; it never silently widens to the whole repository. Findings outside the diff are tagged `scope: preexisting` and never block.

Each finding has: `id`, `rule_id`, `rule_source` (file, section, quoted rule), `severity`, `confidence`, `scope`, `from`, `to`, a verbatim `evidence` quote, `detection`, `impact`, `remediation_direction` and `blocking_candidate`. The report also lists rules checked, rules skipped, uncovered files, commands run and limitations.

## Used by other plugins

`sdd-engineering:implement-plan` calls this agent as its review gate and loops fixes through the implementer until no blocking finding remains or the iteration cap is hit.

## Out of scope

Security review, test coverage, and the merge verdict. When a defect has both an architectural and a security side, the agent reports the layering violation and adds `see also: security review`.

## Requires

- Claude Code `>=2.1.110`.
- `engineering-paved-path` `^1.0.0` (installed automatically).
- Optional: an architecture-check command in the repository (the agent runs it if present).

## Data and network

Reads the repository and runs read-only `git` and search commands, plus the repository's own architecture-check and typecheck commands. No network access, no credentials.
