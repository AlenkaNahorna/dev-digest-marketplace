#!/usr/bin/env bash
# Model-free guard: the spec-creator instruction contains the rules the eval cases rely on.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
f=agents/spec-creator.md
fail=0
need() { grep -qF -- "$1" "$f" || { echo "FAIL: missing in $f: $1"; fail=1; }; }
need "AC-N"
need "[NEEDS CLARIFICATION"
need "Requirement coverage gate"
need "Requirement → AC coverage"
need "NOT ready for planning"
need "keep \`Status: draft\`"
[ "$fail" = 0 ] && echo "OK: spec-creator static checks passed"
exit "$fail"
