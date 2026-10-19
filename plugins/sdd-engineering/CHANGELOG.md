# Changelog

All notable changes to this plugin are documented here. Format: [Keep a Changelog](https://keepachangelog.com/), versions follow [SemVer](https://semver.org/).

## [1.1.0] - 2026-10-19

### Changed
- `spec-creator` no longer finishes a spec until every mandatory requirement (goals, non-functional requirements, and anything stated as "must"/"required") has a verifiable acceptance criterion. A requirement that cannot be made verifiable is recorded as `[NEEDS CLARIFICATION: acceptance criterion for ...]`, the spec stays `draft`, and the report says "NOT ready for planning". Backward compatible: spec format and file locations are unchanged; the report gains a `Requirement → AC coverage` line.

### Added
- `evals/`: behavior cases for `spec-creator` (old and new) and a model-free `check-static.sh`.

## [1.0.0] - 2026-10-19

### Added
- spec-creator, implementation-planner, implementer, plan-verifier agents; implement-plan, workflow-retro, engineering-insights skills. Depends on `engineering-paved-path`, `research-tools`, `architecture-review`.

## [0.1.0] - 2026-10-19

### Added
- Initial skeleton release.
