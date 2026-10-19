# research-tools

Read-only research agent: finds answers in a repository or on the web and reports them with evidence.

- **Owner:** see `CODEOWNERS`
- **Install:** `/plugin marketplace add AlenkaNahorna/dev-digest-marketplace`, then `/plugin install research-tools@dev-digest-marketplace`

## What you get

| Component | Type | What it does |
| :- | :- | :- |
| `researcher` | agent | Answers one concrete question about a codebase, about external sources (documentation, articles, release notes), or both. Never changes files. |

The agent's tools are `Read`, `Grep`, `Glob`, `Bash` (read-only by prompt convention), `WebSearch` and `WebFetch`. It has no `Write` or `Edit`, and it does not spawn subagents.

## How to use it

Ask Claude to use the agent, or mention it in a request:

```text
Use research-tools:researcher to find where retries are configured and which version introduced them.
Use research-tools:researcher to compare the current docs of two queue libraries for our use case.
```

1. **Clarification first.** If the question is vague ("look at authentication"), the agent asks 2–4 questions (what to determine, repo or external or both, scope, what the result is for) before it searches.
2. **Repository research.** It reads `AGENTS.md`/`CLAUDE.md` and `README.md`, searches with several name variants, checks history with `git log -S`, `git log --follow` and `git blame`, and cross-checks definition, usage, tests and configuration.
3. **External research.** It searches, reads pages with `WebFetch` rather than relying on snippets, records the source or access date for claims about the current state, and flags source reliability and data recency.
4. **Report.** Findings with a confidence level, an evidence table (`file:line` and snippet, or URL), references, a **"Could not find"** section, and assumptions and risks. Nothing is stated without evidence it actually saw.

## Used by other plugins

`sdd-engineering` depends on this plugin. Its `spec-creator` tags questions it cannot answer itself as `[NEEDS CLARIFICATION: ...] (for: researcher)`; the main session can then run `research-tools:researcher` (one per sub-question, in parallel) and feed the findings back.

## Requires

- Claude Code (any version that supports plugins).
- No other plugin.

## Data and network

- Reads the files of the current repository.
- `WebSearch` and `WebFetch` reach public websites; nothing is sent anywhere else. No credentials are used or stored.
