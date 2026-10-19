#!/usr/bin/env bash
# Prepare a rollback of ONE plugin to the content of an earlier release.
# Usage: scripts/rollback.sh <plugin> <X.Y.Z|tag> [--push]
#
# Versions never go backwards: users on the bad version only get a new copy when
# the version string changes. The old content is restored under a NEW patch
# version (current + 1). History is preserved; nothing is force-pushed.
# Run on a branch, open a pull request, and after merge CI creates the tag.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh
require_tools

[ $# -ge 2 ] || die "usage: scripts/rollback.sh <plugin> <X.Y.Z|tag> [--push]"
plugin="$1"; target="$2"; push="${3:-}"

branch="$(git branch --show-current)"
[ -n "$branch" ] || die "detached HEAD; switch to a branch first"
if [[ "$branch" =~ ^(main|master)$ ]] && [ "${RELEASE_ON_MAIN:-}" != 1 ]; then
  die "you are on '$branch'. Create a branch first: git switch -c rollback/$plugin"
fi

require_plugin "$plugin"
require_clean_tree
git fetch --tags -q 2>/dev/null || true

if is_semver "$target"; then target_tag="$(tag_for "$plugin" "$target")"; else target_tag="$target"; fi
git rev-parse -q --verify "refs/tags/$target_tag" >/dev/null || die "tag $target_tag does not exist (try: git fetch --tags)"
git cat-file -e "$target_tag:$(plugin_dir "$plugin")" 2>/dev/null \
  || die "tag $target_tag does not contain $(plugin_dir "$plugin")"

bad="$(read_version "$plugin")"
is_semver "$bad" || die "current version '$bad' is not X.Y.Z"
new="$(bump_version "$bad" patch)"
new_tag="$(tag_for "$plugin" "$new")"
git rev-parse -q --verify "refs/tags/$new_tag" >/dev/null && die "tag $new_tag already exists"

git rm -r -q --ignore-unmatch "$(plugin_dir "$plugin")"
rm -rf "$(plugin_dir "$plugin")"
git checkout "$target_tag" -- "$(plugin_dir "$plugin")"
write_version "$plugin" "$new"

if ! scripts/validate.sh; then
  git reset -q --hard HEAD
  die "validation failed; rollback aborted and working tree restored"
fi

git add -A "$(plugin_dir "$plugin")"
git commit -q -m "rollback: $plugin v$bad -> content of $target_tag (released as v$new)"
echo "Prepared rollback of $plugin to the content of $target_tag, as version $new, on branch $branch."

if [ "$push" = "--push" ]; then
  git push -u origin HEAD
  echo "Pushed. Open a pull request titled: rollback: $plugin to $target_tag (v$new)"
else
  echo "Next: git push -u origin HEAD, then open a pull request titled: rollback: $plugin to $target_tag (v$new)"
fi
echo "After the PR is merged, CI creates the tag $new_tag."
