## What changed

Plugin: `<plugin-name>` (one plugin per pull request)

<!-- One or two sentences: what and why. -->

## Checklist

- [ ] Changes are inside `plugins/<plugin-name>/` (plus `marketplace.json` / `CODEOWNERS` only for a new plugin)
- [ ] I ran `scripts/validate.sh` and it passed
- [ ] I did **not** edit `version` by hand (releases use `scripts/release.sh`), and did not set it in `marketplace.json`
- [ ] No secrets, tokens, internal URLs with credentials, or absolute paths (`/Users/...`, `C:\...`)
- [ ] Skill `description` says what it does and when to use it; the plugin README "Requires" and "Data and network" sections are up to date
- [ ] If hooks, scripts or MCP servers changed: I described what they run and why (marketplace admins will review)
- [ ] If this removes or renames a skill/command/agent: I proposed a **major** release and checked dependents
- [ ] If this is a release PR: title is `release: <plugin> vX.Y.Z` and it contains only the version bump
