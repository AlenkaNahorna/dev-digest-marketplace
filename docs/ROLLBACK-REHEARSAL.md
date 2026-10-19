# Rollback rehearsal: sdd-engineering 1.1.0 → 1.0.0

Goal: prove that users can return to `1.0.0` through the `stable` channel, without a made-up
`plugin rollback` command, and without losing plugin data. Replace `<TARGET>` with the project
where the plugins are installed. Marketplace name: `dev-digest-marketplace`.

`1.0.0` commit of all four plugins: the tag `sdd-engineering--v1.0.0` (commit `9ca552e`).

## 0. Before (record the state)

```bash
claude plugin list --json > before.json      # versions and any dependency errors
ls ~/.claude/plugins/data 2>/dev/null        # plugin data directories, if any (see "Plugin data")
```

## 1. Release 1.1.0 and upgrade (current channel)

After the 1.1.0 PR is merged and CI created `sdd-engineering--v1.1.0`:

```bash
cd <TARGET>
claude plugin marketplace update dev-digest-marketplace
claude plugin update sdd-engineering@dev-digest-marketplace --scope project
```

Start a new session (or `/reload-plugins`) and run the `spec-creator` scenario from
`plugins/sdd-engineering/evals/spec-creator/fixtures/export-csv-requirement-without-criterion.md`.
Expected: `claude plugin list --json` shows `sdd-engineering` `1.1.0`; the spec stays `draft` and the
report says `NOT ready for planning`.

## 2. Prepare the stable channel at 1.0.0 (repository admin)

```bash
git fetch --tags
git push origin sdd-engineering--v1.0.0^{commit}:refs/heads/stable
```

`stable` moves the whole marketplace to that commit, so all four plugins are at their `1.0.0` state.

## 3. Roll back in the target project

The `latest` and `stable` registrations share one name, so remove the current one first.

```bash
cd <TARGET>
claude plugin uninstall sdd-engineering@dev-digest-marketplace --scope project   # keep data: see below
claude plugin marketplace remove dev-digest-marketplace
claude plugin marketplace add AlenkaNahorna/dev-digest-marketplace#stable
claude plugin install sdd-engineering@dev-digest-marketplace --scope project
```

Start a new session or `/reload-plugins`, then check:

```bash
claude plugin list --json     # sdd-engineering 1.0.0, no dependency-unsatisfied / no-matching-tag
```

Smoke eval: run `export-csv-requirement-without-criterion.md` again. Expected on 1.0.0: the new
`Requirement coverage gate` is absent (no `NOT ready for planning` line). Then run the `since: 1.0.0` cases:
they must still pass.

## 4. Plugin data and external state

- Plugin data lives outside the plugin copy. Uninstalling with data kept (do not use `--prune`/delete-data options)
  must leave it untouched. Compare the data directory listing before and after.
- `sdd-engineering` writes only project files the user asked for (`specs/`, `docs/plans/`,
  `docs/retro/ledger.md`). Rolling back the plugin does **not** remove them: specs written by 1.1.0 remain valid
  because the spec format did not change. Nothing outside the repository is modified (no network calls, no MCP).

## 5. Return to latest

Only after the sequence above is recorded and plugin data was verified intact:

```bash
claude plugin marketplace remove dev-digest-marketplace
claude plugin marketplace add AlenkaNahorna/dev-digest-marketplace
claude plugin update sdd-engineering@dev-digest-marketplace --scope project
```

If `1.1.0` itself turns out to be bad, do not move users back by hand: use `scripts/rollback.sh sdd-engineering 1.0.0`
(restores the 1.0.0 content as `1.1.1`) and move `stable` to a good commit as described in [RELEASES.md](RELEASES.md).

## Result log (fill in)

| Step | Command output / observation | OK? |
| :- | :- | :- |
| 1. upgrade to 1.1.0 | | |
| 3. install from stable, version is 1.0.0 | | |
| smoke eval on 1.0.0 | | |
| data directory unchanged | | |
| 5. back on latest, version is 1.1.0 | | |
