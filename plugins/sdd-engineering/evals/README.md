# sdd-engineering evals

Behavior evals for this plugin's agents. Each case is plain data (`cases.json`) plus a prompt
fixture, so any runner can execute it (for example the vitest + Agent SDK runner used in
`ai-dev-digest/evals`). `check-static.sh` is a model-free guard that runs anywhere.

## Layout

| Path | Purpose |
| :- | :- |
| `check-static.sh` | Greps the agent instruction for the rules the cases rely on. No model needed. |
| `spec-creator/cases.json` | Cases: `id`, `since` (plugin version that introduced it), `fixture`, `expect` / `forbid`. |
| `spec-creator/fixtures/*.md` | The user request given to the agent. |

## Running

```bash
bash plugins/sdd-engineering/evals/check-static.sh          # static guard
claude --plugin-dir ./plugins/engineering-paved-path --plugin-dir ./plugins/research-tools \
       --plugin-dir ./plugins/architecture-review --plugin-dir ./plugins/sdd-engineering \
       -p "$(cat plugins/sdd-engineering/evals/spec-creator/fixtures/<fixture>.md)"
```

For a behavior run, give the agent the fixture, then check the written spec and report against
the case's `expect` (strings or patterns that must appear) and `forbid` (must not appear).
Run every case with `since <= current version` for regression: **old cases must still pass after
an upgrade.**
