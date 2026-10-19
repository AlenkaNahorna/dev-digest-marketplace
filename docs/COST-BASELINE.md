# Cost baseline

> Draft. The budgets below are proposals for the team to tune. The measurement itself is implemented.

Plugins cost context tokens in two ways:

| Cost | When it is paid | What counts |
| :- | :- | :- |
| **Always loaded** | Every session where the plugin is enabled | Each skill's `name` + `description` |
| **On invoke** | Only when a skill runs | The full `SKILL.md` body |

## How it is measured

`node site/scripts/build-index.mjs` estimates tokens as `ceil(characters / 4)` and stores the per-plugin totals in `site/public/index.json` (`cost.alwaysLoadedTokens`, `cost.onInvokeTokens`). The site shows both numbers per plugin. The estimate is deliberately simple and consistent; it is for tracking change, not billing.

## Baseline

Record the numbers from the first release of each plugin in the table, and update it when a release changes them noticeably.

Measured on 2026-10-19 with `node site/scripts/build-index.mjs`. The builder counts skills only; agents are estimated by hand with the same `ceil(chars / 4)` rule (name + description always, body on invoke).

| Plugin | Version | Always loaded (skills) | On invoke (skills) | Agents, always / on invoke (estimate) |
| :- | :- | :- | :- | :- |
| engineering-paved-path | 0.1.0 | 957 | 27,248 | none |
| research-tools | 0.1.0 | 0 | 0 | ~97 / ~1,217 |
| architecture-review | 0.1.0 | 0 | 0 | ~82 / ~2,166 |
| sdd-engineering | 0.1.0 | 204 | 2,473 | ~428 / ~10,493 |

`engineering-paved-path` is above the ~500 always-loaded budget (12 skills, 957 tokens). This is an accepted exception: the skills are only useful when all descriptions are visible so the right one triggers. Revisit if the number of skills grows.

## Proposed budgets

- A skill description: at most ~100 tokens.
- A plugin's always-loaded total: at most ~500 tokens.
- A skill body: at most ~5,000 tokens; split larger material into referenced files.

A release that raises a plugin's always-loaded cost by more than 20% should say so in the pull request.
