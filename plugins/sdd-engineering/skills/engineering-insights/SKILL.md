---
name: engineering-insights
description: "Captures and reuses non-obvious engineering insights across sessions for a repository. Read the insights file at the start of a task and summarize the top 3 relevant entries; at the end, append a new entry only if it is non-obvious, actionable and not already recorded. Never overwrite past entries."
---

# engineering-insights

This skill is a repository's append-only memory of non-obvious engineering learnings. It exists so a
future session doesn't relearn what a past session already figured out. It ships the procedure only;
the entries live in the repository that uses it.

## Where the insights live

Use the first of these that applies:

1. A path the user or the repository's agent instructions (`AGENTS.md` / `CLAUDE.md`) name.
2. A per-package `INSIGHTS.md`, when the repository keeps one next to each package, for the package the task touches.
3. `ENGINEERING-INSIGHTS.md` in the repository root. Create it from the template below if no insights file exists yet.

## How to use this skill

1. **At the start**: read the insights file(s) in scope. Summarize the top 3 entries relevant to the current task, out loud, before writing any code. This forces active reading instead of silent loading. If the file is empty, say so and move on.
2. **During work**: observe what works, what breaks, what surprises you. Don't write yet.
3. **At the end**: decide whether anything is worth recording. Apply the quality gate below. If yes, re-read the file first to make sure it's not already there, then append.

### Quality gate (all three must pass, or skip)

1. **Not obvious**: would any developer reading the code already know this?
   - Bad: "Promises can be tricky"
   - Good: "Promise.all() on the ingest pipeline times out after 30 items; use Promise.allSettled() with batches of 10"
2. **Actionable**: can someone apply it cold, Monday morning, without asking questions?
   - Bad: "Be careful with async"
   - Good: "Checkout flow state always goes through the cart store; the cart is shared by 3 components"
3. **Not a duplicate**: check the file first. If it's already there, skip. If it's there but wrong or incomplete, add a dated clarification note instead of rewriting it.

### Entry format

```
- [YYYY-MM-DD] **Category**: Finding, stated cold. Evidence: `file:line`.
```

Categories: What Works, What Doesn't Work, Codebase Patterns, Tool & Library Notes, Recurring Errors & Fixes, Decisions, Session Notes, Open Questions.

**Rules**: append-only (never edit or delete past entries); correct mistakes with a new dated note, not a rewrite; skip trivial sessions, since not every session produces an entry; never record secrets or credentials.

## Template for a new insights file

```markdown
# Engineering insights

Append-only. Format and quality gate: see the `engineering-insights` skill.

## What Works
## What Doesn't Work
## Codebase Patterns
## Tool & Library Notes
## Recurring Errors & Fixes
## Decisions
## Session Notes
## Open Questions
```

## Keeping the file useful

- Prune or consolidate when the file grows past roughly 200 entries; outdated entries are harmful. Do this as a separate, reviewed change, not during a task.
- Treat entries as high-confidence guidance but verify against the code before acting on an old one.
- Commit the file to the repository so the whole team shares it.
