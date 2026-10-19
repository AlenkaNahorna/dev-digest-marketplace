# Releases

## Principle: independent release trains

The DevDigest product and the team harness (the plugins here) have different owners and different release cadences.

- A product UI change must never force a new skill version.
- A skill edit must never require a product release.

So: skills live only in this repository; the product repository never vendors plugin content; every plugin has its own owner, version and tags. If a skill needs a product capability, state the minimum version in the plugin README under "Requires".

## SemVer

Each plugin is versioned `X.Y.Z` on its own, in `plugins/<name>/.claude-plugin/plugin.json` only.

| Bump | When |
| :- | :- |
| major | A skill, command or agent is removed or renamed, or its behavior contract changes incompatibly |
| minor | A new skill, command, agent or hook is added |
| patch | Wording, examples, fixes with no contract change; also every rollback |

Pre-release suffixes are not used. Versions never decrease (`validate.sh` fails if a version is lower than the latest tag).

## Tags

Every release has the annotated tag `<plugin>--v<X.Y.Z>`, for example `research-tools--v1.2.0`. This is the form Claude Code uses to resolve dependency ranges such as `^1.2`.

- Tags are created **by CI after the release pull request is merged** (`.github/workflows/release-tags.yml` runs `scripts/tag-release.sh`). Nobody tags by hand.
- Tags are immutable (ruleset `protect-release-tags`). A wrong release is fixed by a new release, never by moving or deleting a tag.

## Release procedure

Done by the plugin owner, in its own small pull request.

```bash
git switch main && git pull
git switch -c release/<plugin>
scripts/release.sh <plugin> <patch|minor|major|X.Y.Z> --push
# in the same branch, rename "## [Unreleased]" in plugins/<plugin>/CHANGELOG.md to "## [X.Y.Z] - YYYY-MM-DD"
# open the PR titled "release: <plugin> vX.Y.Z" (the version bump and the changelog entry)
```

`release.sh` refuses to run on `main`, bumps `plugin.json`, runs `scripts/validate.sh`, and commits `release: <plugin> vX.Y.Z`. After the code owners approve and the PR merges, CI creates the tag. Releasing one plugin never changes another plugin's version.

## How users receive an update

Claude Code detects an update only when the plugin's version string changes. Merging to `main` without a release changes nothing for users.

- **Auto-update** is off for this marketplace by default. A user turns it on in `/plugin` > Marketplaces > Enable auto-update, or an administrator sets `autoUpdate: true` for the marketplace in managed settings. When on, Claude Code refreshes in the background after the first message of a session and prompts `Run /reload-plugins to apply`.
- **Manually:** `claude plugin marketplace update dev-digest-marketplace`, then `claude plugin update <plugin>@dev-digest-marketplace`, then `/reload-plugins` (or restart the session).
- A marketplace added from a local folder loads current files at each session start, regardless of version. That is for authors testing, not for users.
- Old version folders in the user's cache are removed about 14 days after an update.

## Release channels

Claude Code has no channel setting of its own. Two channels are available with plain git:

| Channel | What it is | How a user joins |
| :- | :- | :- |
| latest | The `main` branch | `/plugin marketplace add AlenkaNahorna/dev-digest-marketplace` |
| stable | The `stable` branch, moved by admins to a commit that has proven itself on latest | `/plugin marketplace add AlenkaNahorna/dev-digest-marketplace#stable` |

Promote a commit to stable (repository admins; the branch is protected from deletion and force-push):

```bash
git fetch origin
git push origin <commit-or-tag-commit>:refs/heads/stable
```

Stable moves the whole marketplace to that commit, so every plugin on it is at its state in that commit. A user can have only one registration of this marketplace, because both channels share the same `name`; to switch, remove and re-add it with or without `#stable`. Administrators can assign a channel to a user group with `extraKnownMarketplaces` in managed settings.

## Rollback

```bash
git switch main && git pull --tags
git switch -c rollback/<plugin>
scripts/rollback.sh <plugin> <X.Y.Z|tag> --push
# open the PR titled "rollback: <plugin> to <version> (vX.Y.Z+1)"
```

Versions never go backwards, because a user on the bad version only receives a new copy when the version string changes. The script restores the plugin folder exactly as at the target tag, sets the next patch version, and commits. After merge CI tags it. History is kept and nothing is force-pushed. Rolling back one plugin does not touch the others.

In an emergency use the `emergency` label and an admin merge (see [SECURITY.md](SECURITY.md#after-a-dangerous-release)). If the stable channel is in use and has the bad commit, also move `stable` back to the last good commit.

## Hotfix

Fix on a branch, get review from the plugin's owner, merge, then release a patch. If the fix is not ready, roll back first and fix forward.
