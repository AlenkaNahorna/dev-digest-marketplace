#!/usr/bin/env bash
# Shared helpers for the marketplace scripts. Source this file, do not run it.

die() { echo "error: $*" >&2; exit 1; }

repo_root() { git rev-parse --show-toplevel; }

require_tools() {
  for t in git jq; do
    command -v "$t" >/dev/null 2>&1 || die "'$t' is required but not installed"
  done
}

require_clean_tree() {
  if [ -n "$(git status --porcelain)" ]; then
    die "working tree is not clean; commit or stash your changes first"
  fi
}

is_semver() { [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; }

# bump_version <current> <patch|minor|major>
bump_version() {
  local cur="$1" kind="$2" major minor patch
  IFS=. read -r major minor patch <<<"$cur"
  case "$kind" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "${major}.$((minor + 1)).0" ;;
    patch) echo "${major}.${minor}.$((patch + 1))" ;;
    *) die "unknown bump kind '$kind'" ;;
  esac
}

plugin_dir() { echo "plugins/$1"; }

# plugin_manifest <plugin>  -> path to plugin.json
plugin_manifest() { echo "plugins/$1/.claude-plugin/plugin.json"; }

# read_version <plugin>  -> current version, or 0.0.0 when unset
read_version() {
  jq -r '.version // "0.0.0"' "$(plugin_manifest "$1")"
}

# write_version <plugin> <version>
write_version() {
  local f tmp
  f="$(plugin_manifest "$1")"
  tmp="$(mktemp)"
  jq --arg v "$2" '.version = $v' "$f" >"$tmp" && cat "$tmp" >"$f"
  rm -f "$tmp"
}

# tag_for <plugin> <version>  -> <plugin>--v<version> (convention used by Claude Code plugin dependencies)
tag_for() { echo "$1--v$2"; }

require_plugin() {
  [ -f "$(plugin_manifest "$1")" ] || die "plugin '$1' not found (expected $(plugin_manifest "$1"))"
}
