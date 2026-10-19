# Contributing

This guide is enough to prepare a pull request without asking anyone where files go or what to run.

Requirements: `git`, `jq`, Node 22 with `npm` (the first `scripts/validate.sh` run installs the site's dependencies with `npm ci`), and optionally the `claude` CLI (`scripts/validate.sh` runs `claude plugin validate` when it is installed).

## Quick start

**Change an existing plugin**

```bash
git switch -c <plugin>/<short-description>
# edit files under plugins/<plugin>/ only
scripts/validate.sh
git add -A && git commit -m "<plugin>: <what changed>"
git push -u origin HEAD     # then open a pull request; the template has the checklist
```

**Add a new plugin**

```bash
git switch -c new-plugin/<name>
scripts/new-plugin.sh <name> --owner @<org>/<team> --description "What it does" [--category engineering]
# edit plugins/<name>/skills/<name>/SKILL.md and plugins/<name>/README.md
scripts/validate.sh
git add -A && git commit -m "<name>: add plugin"
git push -u origin HEAD
```

`new-plugin.sh` creates the plugin folder, `plugin.json` (version `0.1.0`), one skill, a README, the catalog entry in `.claude-plugin/marketplace.json`, and the owner line in `CODEOWNERS`.

**Release or roll back** is a separate pull request, made by the plugin owner; see [docs/RELEASES.md](docs/RELEASES.md).

## Ground rules

- **One plugin per pull request.** Review, ownership and releases stay independent.
- **Skills live only in this repository**, never in the DevDigest product repository.
- **Never edit `version` by hand.** `scripts/release.sh` does it. Merging a change without a release changes nothing for users.
- Title commits and PRs with the plugin name: `research-tools: tighten brief template`.

## Where files go

| What | Where |
| :- | :- |
| Plugin code, skills, hooks | `plugins/<name>/` |
| Catalog entry (name, source, description, category, tags) | `.claude-plugin/marketplace.json` |
| Plugin owner | `CODEOWNERS`, line `/plugins/<name>/ @org/team` |
| Rules, process, security, cost | `docs/` |
| Catalog website | `site/` (the data in `site/public/` is generated, do not commit it) |
| Automation | `scripts/`, `.github/workflows/` (marketplace admins own these) |

## Plugin structure

```text
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json            # the ONLY file that goes in .claude-plugin/
├── skills/<skill>/SKILL.md    # one folder per skill; frontmatter needs name and description
├── commands/                  # optional, flat .md files (prefer skills for new work)
├── agents/                    # optional, one .md per agent
├── hooks/hooks.json           # optional; wrapped in a top-level "hooks" key
├── .mcp.json                  # optional MCP servers
├── scripts/                   # optional helper executables (never a top-level bin/)
└── README.md                  # required: purpose, owner, Requires, Data and network
```

Rules:

- `skills/`, `commands/`, `agents/`, `hooks/` sit at the plugin root, **not** inside `.claude-plugin/`.
- A plugin is copied into a cache on install, so it cannot use files outside its own folder (no `../shared`). Refer to bundled files with `${CLAUDE_PLUGIN_ROOT}`; keep state in `${CLAUDE_PLUGIN_DATA}`, never in the plugin folder.
- No Git LFS; no symlinks that leave the plugin.
- Names are kebab-case. Names starting with `claude-`, `anthropic-` or containing `official` are rejected.
- Skill `description`: say what the skill does and when to use it, briefly. It is loaded into every session (see [docs/COST-BASELINE.md](docs/COST-BASELINE.md)).

## `plugin.json` fields

| Field | Rule |
| :- | :- |
| `name` | Required. Kebab-case, equal to the folder name and to the `name` in `marketplace.json` |
| `description` | Required. One sentence; English |
| `version` | Required. `X.Y.Z`. Set **only here**, changed **only by `scripts/release.sh`** |
| `author.name` | Required |
| `license` | Expected (`MIT` unless told otherwise) |
| `keywords` | Optional discovery tags |
| `dependencies` | Optional; see the next section |
| `userConfig` | Optional values prompted from the user. Anything secret must have `"sensitive": true` |
| `hooks`, `mcpServers`, `skills`, `commands`, `agents` | Optional; only to point outside the default folders. Paths start with `./`, stay inside the plugin, use forward slashes, and must exist |
| `homepage`, `repository` | Optional URLs |

Catalog entry in `marketplace.json`: `name`, `source` (`./plugins/<name>`), `description`, and optionally `category` and `tags`. **Do not add `version` there.**

## Dependency rules

A plugin may depend on another plugin through `dependencies` in `plugin.json`.

1. Depend only on plugins **from this marketplace**, by bare name: `"architecture-review"`. A dependency from another marketplace is rejected by `validate.sh` unless a marketplace admin adds that marketplace to `allowCrossMarketplaceDependenciesOn`.
2. If your plugin relies on the other plugin's behavior, constrain it with a semver range: `{ "name": "research-tools", "version": "^1.2" }`. Without a range you follow every release of the dependency.
3. Ranges resolve against the git tags `<plugin>--v<version>`. CI creates them after a release PR merges, so a dependency that has never been released at the version you need cannot be resolved.
4. No cycles and no self-dependency. (Self-dependency is checked by `validate.sh`; cycles are caught in review.)
5. Removing or renaming a skill, command or agent in a plugin that others depend on is a **major** release; update dependents' ranges first.
6. A plugin that only bundles others (a manifest with just `name`, `version` and `dependencies`) is allowed.

## Checks

Run before opening a pull request:

```bash
scripts/validate.sh
```

It runs the same checks as CI (`.github/workflows/validate.yml`):

| Check | Typical failure and fix |
| :- | :- |
| Catalog JSON, required fields, duplicate names | Fix `marketplace.json` |
| Entry name equals `plugin.json` name; kebab-case; no reserved prefix | Rename one of them |
| `version` present, `X.Y.Z`, not in `marketplace.json`, not lower than the latest release tag | Remove the version from the catalog entry; never lower it |
| `author.name`, `description` present; plugin README exists | Add them |
| Owner line in `CODEOWNERS` for every plugin | Add `/plugins/<name>/ @org/team` between the BEGIN/END markers |
| Components at plugin root, each skill has `SKILL.md` with `description:` | Move folders out of `.claude-plugin/`; add the frontmatter |
| Manifest paths start with `./`, have no `..`, exist | Fix the path |
| Dependencies resolve (see above) | Fix the name or ask an admin about cross-marketplace |
| No absolute paths (`/Users/...`, `/home/...`, `C:\...`, JSON values starting with `/`) | Use relative paths or `${CLAUDE_PLUGIN_ROOT}` |
| No secrets (patterns in `scripts/secret-patterns.txt`) | Remove it, **rotate the credential**, use `userConfig` with `sensitive: true` |
| Catalog index builds (`node site/scripts/build-index.mjs --check`) | Fix the SKILL.md frontmatter it names |
| `claude plugin validate .` (if the CLI is installed) | Read its message; it names the field |

Also test the plugin for real:

```bash
claude plugin marketplace add .
claude plugin install <name>@dev-digest-marketplace
```

Edits to a locally added marketplace load at the next session start or `/reload-plugins`.

## Pull request checklist

The pull request template shows this list; tick every line.

- [ ] Only `plugins/<name>/` changed (plus `marketplace.json` and `CODEOWNERS` for a new plugin)
- [ ] `scripts/validate.sh` passes
- [ ] `version` untouched (not edited by hand, not in `marketplace.json`)
- [ ] No secrets and no absolute paths
- [ ] Skill description says what and when; README "Requires" and "Data and network" are current
- [ ] Hook, script or MCP changes explained (marketplace admins review them)
- [ ] Removal or rename of a skill/command/agent: major release proposed, dependents checked

## Review and what happens after merge

1. CI job `validate` must pass.
2. The owner of every changed path must approve (`CODEOWNERS` + ruleset). Hooks, scripts, `.mcp.json` and `settings.json` inside plugins need a marketplace-admin approval instead.
3. Merging does **not** publish anything to users by itself. The plugin owner then prepares a release (`scripts/release.sh <plugin> <patch|minor|major>`) as its own small pull request; after it merges, CI creates the tag.
