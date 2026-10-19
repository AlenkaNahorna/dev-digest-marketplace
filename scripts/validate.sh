#!/usr/bin/env bash
# Validate the marketplace. Run this before every pull request.
# Usage: scripts/validate.sh [--no-cli]   (or VALIDATE_NO_CLI=1; also honoured by release/rollback)
#
# Checks: catalog structure, plugin manifests, names, versions, owners (CODEOWNERS),
# dependencies, plugin READMEs, secrets, absolute paths, version monotonicity vs tags,
# the catalog index build, and `claude plugin validate` when the CLI is installed.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh
require_tools

run_cli=1
{ [ "${1:-}" = "--no-cli" ] || [ "${VALIDATE_NO_CLI:-}" = 1 ]; } && run_cli=0

mkt=".claude-plugin/marketplace.json"
errors=0
fail() { echo "FAIL: $*" >&2; errors=$((errors + 1)); }
warn() { echo "warn: $*" >&2; }

[ -f "$mkt" ] || die "$mkt not found"
jq empty "$mkt" 2>/dev/null || die "$mkt is not valid JSON"

jq -e '.name and .owner.name and (.plugins | type == "array")' "$mkt" >/dev/null \
  || fail "$mkt must have name, owner.name and a plugins array"
mkt_name="$(jq -r '.name' "$mkt")"

dups="$(jq -r '[.plugins[].name] | group_by(.)[] | select(length > 1) | .[0]' "$mkt")"
[ -z "$dups" ] || fail "duplicate plugin names: $dups"

[ -f CODEOWNERS ] || fail "CODEOWNERS file is missing"
grep -q 'TODO-' CODEOWNERS 2>/dev/null && warn "CODEOWNERS still contains TODO placeholder owners"

# Names of plugins in this marketplace (for dependency checks).
all_names="$(jq -r '.plugins[].name' "$mkt")"
allow_cross="$(jq -r '.allowCrossMarketplaceDependenciesOn // [] | .[]' "$mkt")"

while IFS=$'\t' read -r name source; do
  case "$source" in
    ./*) ;;
    *) echo "skip: '$name' uses a non-relative source"; continue ;;
  esac
  [[ "$source" != *..* ]] || fail "'$name': source must not contain '..'"
  [[ "$source" != *\\* ]] || fail "'$name': use forward slashes in source"
  [ -d "$source" ] || { fail "'$name': directory $source does not exist"; continue; }

  manifest="$source/.claude-plugin/plugin.json"
  [ -f "$manifest" ] || { fail "'$name': missing $manifest"; continue; }
  jq empty "$manifest" 2>/dev/null || { fail "'$name': $manifest is not valid JSON"; continue; }

  # Names
  mname="$(jq -r '.name // empty' "$manifest")"
  [ "$mname" = "$name" ] || fail "'$name': entry name differs from plugin.json name '$mname'"
  [[ "$name" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] || fail "'$name': name must be kebab-case"
  [[ "$name" =~ ^(claude|anthropic|anthropics|cc-plugin)(-|$) ]] && fail "'$name': reserved name prefix"

  # Required manifest fields
  for f in description version; do
    [ -n "$(jq -r ".$f // empty" "$manifest")" ] || fail "'$name': plugin.json is missing '$f'"
  done
  [ -n "$(jq -r '.author.name // empty' "$manifest")" ] || fail "'$name': plugin.json is missing author.name"
  [ -n "$(jq -r '.license // empty' "$manifest")" ] || warn "'$name': plugin.json has no license"

  # Owner
  if [ -f CODEOWNERS ]; then
    grep -qE "^/?plugins/${name}/?[[:space:]]+@" CODEOWNERS || fail "'$name': no owner line for /plugins/$name/ in CODEOWNERS"
  fi

  # Version lives in plugin.json only, and is X.Y.Z
  entry_v="$(jq -r --arg n "$name" '.plugins[] | select(.name == $n) | .version // empty' "$mkt")"
  [ -z "$entry_v" ] || fail "'$name': set version in plugin.json only, not in marketplace.json"
  v="$(jq -r '.version // empty' "$manifest")"
  if [ -n "$v" ]; then
    if ! is_semver "$v"; then
      fail "'$name': version '$v' is not X.Y.Z"
    else
      # Must not be lower than the latest released tag.
      latest="$(git tag -l "${name}--v*" 2>/dev/null | sed "s/^${name}--v//" | sort -V | tail -1)"
      if [ -n "$latest" ] && [ "$v" != "$latest" ]; then
        higher="$(printf '%s\n%s\n' "$latest" "$v" | sort -V | tail -1)"
        [ "$higher" = "$v" ] || fail "'$name': version $v is lower than the latest release $latest"
      fi
    fi
  fi

  # README
  [ -f "$source/README.md" ] || fail "'$name': missing $source/README.md (purpose, owner, Requires)"

  # Component layout
  for d in skills commands agents hooks; do
    [ ! -d "$source/.claude-plugin/$d" ] || fail "'$name': $d/ must be at the plugin root, not in .claude-plugin/"
  done
  [ ! -d "$source/bin" ] || warn "'$name' has a top-level bin/ (claude.ai org sync rejects it; use scripts/)"
  [ -d "$source/skills" ] || [ -d "$source/commands" ] || [ -d "$source/agents" ] || [ -d "$source/hooks" ] || [ -f "$source/.mcp.json" ] \
    || fail "'$name': plugin has no components (skills/, commands/, agents/, hooks/ or .mcp.json)"
  if [ -d "$source/skills" ]; then
    for sd in "$source"/skills/*/; do
      [ -f "${sd}SKILL.md" ] || { fail "'$name': ${sd}SKILL.md is missing"; continue; }
      grep -q '^description:' "${sd}SKILL.md" || fail "'$name': ${sd}SKILL.md has no 'description:' in its frontmatter"
    done
  fi

  # Manifest component paths: start with ./, no .., exist
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    [[ "$p" == ./* ]] || fail "'$name': manifest path '$p' must start with ./"
    [[ "$p" != *..* ]] || fail "'$name': manifest path '$p' must not contain '..'"
    [ -e "$source/$p" ] || fail "'$name': manifest path '$p' does not exist"
  done < <(jq -r '[.skills, .commands, .agents, .outputStyles] | map(select(type == "string" or type == "array")) | flatten | map(select(type == "string")) | .[] | select(. != ".")' "$manifest")

  # Dependencies: must resolve inside this marketplace unless explicitly allowed
  while IFS=$'\t' read -r dep dmkt; do
    [ -n "$dep" ] || continue
    if [ -z "$dmkt" ] || [ "$dmkt" = "$mkt_name" ]; then
      echo "$all_names" | grep -qx "$dep" || fail "'$name': dependency '$dep' is not a plugin in this marketplace"
      [ "$dep" != "$name" ] || fail "'$name': a plugin cannot depend on itself"
    else
      echo "$allow_cross" | grep -qx "$dmkt" || fail "'$name': dependency '$dep@$dmkt' needs '$dmkt' in allowCrossMarketplaceDependenciesOn"
    fi
  done < <(jq -r '(.dependencies // [])[] | if type == "string" then (split("@") | [.[0], (.[1] // "")]) else [.name, (.marketplace // "")] end | @tsv' "$manifest")

  # Absolute paths (break when the plugin is copied to another machine's cache)
  if hits="$(grep -rIn -E --exclude-dir=.git '(/Users/[A-Za-z0-9._-]+|/home/[A-Za-z0-9._-]+|[A-Za-z]:\\[A-Za-z])' "$source" 2>/dev/null)"; then
    fail "'$name': absolute paths found (use relative paths or \${CLAUDE_PLUGIN_ROOT}):"; echo "$hits" | head -5 >&2
  fi
  while IFS= read -r jf; do
    if hits="$(grep -nE '"/[A-Za-z]' "$jf" 2>/dev/null)"; then
      fail "'$name': JSON value starting with an absolute path in $jf:"; echo "$hits" | head -3 >&2
    fi
  done < <(find "$source" -name '*.json' -type f)
done < <(jq -r '.plugins[] | [.name, (.source | if type == "string" then . else "remote" end)] | @tsv' "$mkt")

# Secrets anywhere in the repository
if hits="$(grep -rIn -E -f scripts/secret-patterns.txt --exclude-dir=.git --exclude-dir=node_modules --exclude=secret-patterns.txt . 2>/dev/null)"; then
  fail "possible secrets found (never commit secrets; use userConfig with sensitive:true):"; echo "$hits" | head -5 >&2
fi
if [ -f .gitattributes ] && grep -q 'filter=lfs' .gitattributes; then
  fail "Git LFS is enabled in .gitattributes; plugin files must not use LFS"
fi

# Catalog index (also checks SKILL.md and agent frontmatter) when Node is available.
# The builder needs the site dependencies; install them once if they are missing.
if command -v node >/dev/null 2>&1; then
  if [ ! -d site/node_modules/yaml ] && command -v npm >/dev/null 2>&1; then
    npm ci --prefix site --ignore-scripts --silent >/dev/null 2>&1 || true
  fi
  if [ -d site/node_modules/yaml ]; then
    node site/scripts/build-index.mjs --check >/dev/null || fail "site/scripts/build-index.mjs --check failed (run it to see the problems)"
  else
    warn "site dependencies are not installed (run: npm ci --prefix site); skipped the catalog index check"
  fi
else
  warn "node not found; skipped the catalog index check"
fi

if [ "$run_cli" = 1 ]; then
  if command -v claude >/dev/null 2>&1; then
    claude plugin validate . || fail "claude plugin validate failed"
  else
    warn "'claude' CLI not found, skipped 'claude plugin validate'"
  fi
fi

if [ "$errors" -gt 0 ]; then
  echo "Validation failed with $errors error(s)." >&2
  exit 1
fi
echo "OK: marketplace is valid."
