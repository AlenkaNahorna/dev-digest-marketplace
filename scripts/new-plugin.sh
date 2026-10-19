#!/usr/bin/env bash
# Scaffold a new plugin and register it everywhere it must be listed.
# Usage: scripts/new-plugin.sh <name> --owner @org/team --description "What it does" [--category engineering]
# Creates plugins/<name>/ (plugin.json, one skill, README), adds the catalog entry
# to .claude-plugin/marketplace.json and the owner line to CODEOWNERS.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh
require_tools

[ $# -ge 1 ] || die 'usage: scripts/new-plugin.sh <name> --owner @org/team --description "..." [--category c]'
name="$1"; shift
owner=""; desc=""; category=""
while [ $# -gt 0 ]; do
  case "$1" in
    --owner) owner="${2:-}"; shift 2 ;;
    --description) desc="${2:-}"; shift 2 ;;
    --category) category="${2:-}"; shift 2 ;;
    *) die "unknown option '$1'" ;;
  esac
done

[[ "$name" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] || die "name must be kebab-case (a-z, 0-9, '-'), got '$name'"
[[ "$name" =~ ^(claude|anthropic|anthropics|cc-plugin)(-|$) ]] && die "names starting with claude-/anthropic- are reserved"
[[ "$name" =~ official ]] && die "names containing 'official' are rejected by Claude Code validation"
[ -n "$desc" ] || die "--description is required"
[[ "$owner" =~ ^@[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)?$ ]] || die "--owner must be a GitHub user or team like @org/team"
[ ! -e "plugins/$name" ] || die "plugins/$name already exists"
jq -e --arg n "$name" '.plugins[] | select(.name == $n)' .claude-plugin/marketplace.json >/dev/null && die "'$name' is already in marketplace.json"

d="plugins/$name"
mkdir -p "$d/.claude-plugin" "$d/skills/$name"

jq -n --arg n "$name" --arg d "$desc" \
  '{name:$n, description:$d, version:"0.1.0", author:{name:"DevDigest AI Team"}, license:"MIT", keywords:[]}' \
  > "$d/.claude-plugin/plugin.json"

cat > "$d/skills/$name/SKILL.md" <<EOT
---
name: $name
description: $desc. TODO: add a sentence saying when this skill should be used.
---

# $name

TODO: replace with the skill's instructions.

1. Step one.
2. Step two.
EOT

cat > "$d/README.md" <<EOT
# $name

$desc

- **Owner:** $owner
- **Install:** \`/plugin install $name@dev-digest-marketplace\`

## Skills

- \`$name\`: TODO describe

## Requires

List minimum versions of tools or DevDigest capabilities this plugin relies on, or write "nothing".

## Data and network

State what leaves the machine (network calls, files read outside the project), or write "none".
EOT

tmp="$(mktemp)"
if [ -n "$category" ]; then
  jq --arg n "$name" --arg d "$desc" --arg c "$category" \
    '.plugins += [{name:$n, source:("./plugins/"+$n), description:$d, category:$c}]' .claude-plugin/marketplace.json > "$tmp"
else
  jq --arg n "$name" --arg d "$desc" \
    '.plugins += [{name:$n, source:("./plugins/"+$n), description:$d}]' .claude-plugin/marketplace.json > "$tmp"
fi
cat "$tmp" > .claude-plugin/marketplace.json; rm -f "$tmp"

if grep -q '^# END plugin owners' CODEOWNERS; then
  tmp="$(mktemp)"
  awk -v line="/plugins/$name/ $owner" '/^# END plugin owners/ { print line } { print }' CODEOWNERS > "$tmp"
  cat "$tmp" > CODEOWNERS; rm -f "$tmp"
else
  die "CODEOWNERS has no '# END plugin owners' marker"
fi

echo "Created plugins/$name, added it to marketplace.json and CODEOWNERS."
echo "Next: edit the skill and README, then run scripts/validate.sh"
