#!/usr/bin/env bash
# Create missing release tags on the default branch.
# For every plugin, tag <plugin>--v<version> at HEAD if that tag does not exist yet.
# Idempotent: running it twice creates nothing the second time.
# Usage: scripts/tag-release.sh [--push] [--dry-run] [--any-branch]
# Normally run by .github/workflows/release-tags.yml after a merge to main.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh
require_tools

push=0; dry=0; anybranch=0
for a in "$@"; do
  case "$a" in
    --push) push=1 ;; --dry-run) dry=1 ;; --any-branch) anybranch=1 ;;
    *) die "unknown option '$a'" ;;
  esac
done

branch="$(git branch --show-current)"
if [ "$anybranch" = 0 ] && ! [[ "$branch" =~ ^(main|master)$ ]]; then
  die "refusing to tag on '$branch': tags are made only on main after a merge (use --any-branch to override)"
fi

created=()
for manifest in plugins/*/.claude-plugin/plugin.json; do
  [ -f "$manifest" ] || continue
  name="$(basename "$(dirname "$(dirname "$manifest")")")"
  v="$(jq -r '.version // empty' "$manifest")"
  [ -n "$v" ] || { echo "skip $name: no version"; continue; }
  is_semver "$v" || { echo "skip $name: version '$v' is not X.Y.Z"; continue; }
  tag="$(tag_for "$name" "$v")"
  git rev-parse -q --verify "refs/tags/$tag" >/dev/null && continue
  if [ "$push" = 1 ] && [ -n "$(git ls-remote --tags origin "refs/tags/$tag" 2>/dev/null)" ]; then continue; fi
  if [ "$dry" = 1 ]; then echo "would create $tag"; continue; fi
  git tag -a "$tag" -m "$name v$v"
  created+=("$tag")
  echo "created $tag"
done

if [ "$push" = 1 ] && [ "${#created[@]}" -gt 0 ]; then
  git push origin "${created[@]}"
fi
[ "$dry" = 1 ] || [ "${#created[@]}" -gt 0 ] || echo "No new tags needed."
