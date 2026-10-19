# Security

Plugins run with the user's privileges: hooks execute commands, MCP servers run as local processes, and skills steer an agent that can read and write files. Treat every plugin change as code.

## Rules (enforced where noted)

1. **No secrets in the repository.** Tokens, API keys, passwords and private keys never go into any file. Declare them as `userConfig` options with `"sensitive": true` (stored in the OS credential store). *Enforced:* `scripts/validate.sh` scans for common secret patterns (`scripts/secret-patterns.txt`). The scan is a backstop, not a guarantee.
2. **No absolute paths.** `/Users/...`, `/home/...`, `C:\...` or JSON values starting with `/` break on every other machine and leak local usernames. Use relative paths and `${CLAUDE_PLUGIN_ROOT}` (read-only plugin files) or `${CLAUDE_PLUGIN_DATA}` (state). *Enforced:* `validate.sh`.
3. **Reviewable code only.** No obfuscation, no downloading and executing remote code, no `curl | sh`. Executables live in `scripts/`, not a top-level `bin/`.
4. **Declare data flows.** Each plugin README has a "Data and network" section that states what leaves the machine.
5. **Pin external sources.** A plugin entry with a `github`, `url` or `git-subdir` source pins a full 40-character `sha`; `npm` sources use exact versions; `archive` sources use `sha256`.
6. **Least privilege.** Do not widen `allowedTools` beyond what a command needs.
7. **Cross-marketplace dependencies are off by default.** Only marketplace admins add entries to `allowCrossMarketplaceDependenciesOn`.

## Review and repository protection

- The ruleset `.github/rulesets/protect-main.json` requires: pull request, one approval, **review from the code owners of every changed path**, resolved threads, up-to-date branch, passing check `validate`, no force-push, no deletion.
- `CODEOWNERS` assigns each plugin to its responsible team. Hooks, scripts, `.mcp.json` and `settings.json` inside plugins, and everything outside `plugins/`, are owned by the marketplace admins.
- `protect-release-tags.json` makes release tags (`*--v*`) immutable: they cannot be moved or deleted. `protect-stable.json` protects the optional `stable` branch.
- Repository admins can merge a pull request without the normal approvals only through the emergency path described below (the bypass is limited to pull requests).

Apply the rulesets once per repository:

```bash
for f in .github/rulesets/*.json; do
  gh api repos/<owner>/<repo>/rulesets --method POST --input "$f"
done
```

After importing, open Settings > Rules and check that the bypass role (repository admin) and the required check name `validate` match your repository. Teams in `CODEOWNERS` need write access for their approval to count.

## After a dangerous release

A release is dangerous if it ships a secret, a malicious or destructive hook or script, unintended data exfiltration, or a skill that makes the agent act unsafely. Installed copies stay on users' machines until they update, so speed matters. Times below are proposed targets; adjust them.

1. **Declare and contain (target: within 1 hour).** Open a private security advisory (or a private issue) and name an incident lead. Find the affected plugin and versions (`<plugin>--v...` tags).
2. **Stop the spread.** Prepare a rollback on a branch: `scripts/rollback.sh <plugin> <last-good-version>`. Open the pull request with the label `emergency`; a repository admin merges it using the pull-request bypass. CI tags the new patch version, which restores the last good content under a version users will update to.
3. **If rollback is not enough** (the plugin itself must disappear): remove its entry from `marketplace.json`, add it to `renames` with value `null`, and set `"forceRemoveDeletedPlugins": true`. At the next session start after a user's marketplace copy updates, Claude Code uninstalls the plugin. Organization admins can additionally block it through managed settings.
4. **Rotate secrets first.** If a credential was exposed, revoke and replace it immediately. Deleting the file does not remove it from git history, forks or users' caches. Purge history only after rotation.
5. **Do not delete or move the bad tag.** Tags are immutable on purpose; the audit trail matters. Record the bad version range in the advisory.
6. **Tell users.** State affected versions, the fixed version, and the action: `claude plugin marketplace update dev-digest-marketplace`, then `claude plugin update <plugin>@dev-digest-marketplace`, then `/reload-plugins`. Users without auto-update must act themselves.
7. **Review (target: within 5 working days).** Write down the cause, why review and checks missed it, and the prevention (new check, new rule). Update `scripts/secret-patterns.txt` or this document if a check was missing.

## Reporting

Report suspected vulnerabilities privately to the marketplace admins named in `CODEOWNERS` (GitHub private vulnerability reporting). Do not open a public issue.
