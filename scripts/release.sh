#!/usr/bin/env bash
# Prepare a release of ONE plugin: bump its version, validate, commit.
# Usage: scripts/release.sh <plugin> <patch|minor|major|X.Y.Z> [--push]
#
# Run it on a branch, not on main (main is protected). Then open a pull request.
# The tag <plugin>--v<version> is created automatically after the PR is merged
# (.github/workflows/release-tags.yml runs scripts/tag-release.sh).
#
# Users only receive an update when the plugin's version string changes.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib.sh
require_tools

[ $# -ge 2 ] || die "usage: scripts/release.sh <plugin> <patch|minor|major|X.Y.Z> [--push]"
plugin="$1"; bump="$2"; push="${3:-}"

branch="$(git branch --show-current)"
[ -n "$branch" ] || die "detached HEAD; switch to a branch first"
if [[ "$branch" =~ ^(main|master)$ ]] && [ "${RELEASE_ON_MAIN:-}" != 1 ]; then
  die "you are on '$branch'. Create a branch first: git switch -c release/$plugin"
fi

require_plugin "$plugin"
require_clean_tree

current="$(read_version "$plugin")"
is_semver "$current" || die "current version '$current' is not X.Y.Z"
case "$bump" in
  patch|minor|major) new="$(bump_version "$current" "$bump")" ;;
  *) is_semver "$bump" || die "'$bump' is not patch|minor|major|X.Y.Z"; new="$bump" ;;
esac
tag="$(tag_for "$plugin" "$new")"
git rev-parse -q --verify "refs/tags/$tag" >/dev/null && die "tag $tag already exists"

write_version "$plugin" "$new"
if ! scripts/validate.sh; then
  git checkout -- "$(plugin_manifest "$plugin")"
  die "validation failed; version change reverted"
fi

git add "$(plugin_manifest "$plugin")"
git commit -q -m "release: $plugin v$new"
echo "Prepared $plugin $current -> $new on branch $branch."

if [ "$push" = "--push" ]; then
  git push -u origin HEAD
  echo "Pushed. Open a pull request titled: release: $plugin v$new"
else
  echo "Next: git push -u origin HEAD, then open a pull request titled: release: $plugin v$new"
fi
echo "After the PR is merged, CI creates the tag $tag."
