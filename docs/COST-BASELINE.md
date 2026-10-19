# Cost baseline

> Draft. The budgets below are proposals for the team to tune. The measurement itself is implemented.

Plugins cost context tokens in two ways:

| Cost | When it is paid | What counts |
| :- | :- | :- |
| **Always loaded** | Every session where the plugin is enabled | Each skill's `name` + `description` |
| **On invoke** | Only when a skill runs | The full `SKILL.md` body |

## How it is measured

`node scripts/build-index.mjs` estimates tokens as `ceil(characters / 4)` and stores them in `site/data/index.json` (`cost.alwaysLoadedTokens`, `cost.onInvokeTokens`, and per skill `metadataTokens`, `bodyTokens`). The site shows both numbers per plugin. The estimate is deliberately simple and consistent; it is for tracking change, not billing.

## Baseline

Record the numbers from the first release of each plugin in the table, and update it when a release changes them noticeably.

| Plugin | Version | Always loaded | On invoke |
| :- | :- | :- | :- |
| engineering-paved-path | 0.1.0 | ~52 | ~144 |
| research-tools | 0.1.0 | ~39 | ~115 |
| architecture-review | 0.1.0 | ~48 | ~133 |
| sdd-engineering | 0.1.0 | ~42 | ~122 |

## Proposed budgets

- A skill description: at most ~100 tokens.
- A plugin's always-loaded total: at most ~500 tokens.
- A skill body: at most ~5,000 tokens; split larger material into referenced files.

A release that raises a plugin's always-loaded cost by more than 20% should say so in the pull request.
