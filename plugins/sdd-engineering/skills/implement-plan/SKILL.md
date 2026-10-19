---
name: implement-plan
description: "Runs the post-planning Spec-Driven Development execution loop: implementer, then architecture-reviewer with a capped fix loop, then plan-verifier, then a final report. Takes an existing Implementation Plan as input; never creates a spec or a plan itself."
metadata:
  version: "1.0.0"
  scope: "Orchestrates sdd-engineering:implementer, architecture-review:architecture-reviewer and sdd-engineering:plan-verifier for one Implementation Plan"
---

# Implement Plan (SDD execution)

Use this skill once a spec (`spec-creator`) and an Implementation Plan (`implementation-planner`)
already exist. **This skill does not create a spec or a plan.** Give it a plan, and it drives
execution from implementation through review to a verified result.

`spec-creator` and `implementation-planner` are run manually, before invoking this skill, on
purpose: keep those steps separate so the spec and the plan get a human look before any
implementation tokens are spent.

## Agents used

| Step | Agent (plugin-scoped name) | Provided by |
| :- | :- | :- |
| Implement and fix | `sdd-engineering:implementer` | this plugin |
| Architecture gate | `architecture-review:architecture-reviewer` | `architecture-review` (dependency) |
| Verify | `sdd-engineering:plan-verifier` | this plugin |

If the architecture reviewer is not available, say so, skip step 2 and 3, and report that the review gate did not run.

## Inputs

- **`plan`** (required): a path to the Implementation Plan file, or the plan content pasted inline.
  Plans are written by `implementation-planner` to its plan folder (default `docs/plans/`).
- **`requirements`** (optional): extra free-text requirements or clarifications not already captured
  in the plan. Passed to `implementer` as additional context, never as a plan replacement; if it
  contradicts the plan, that is a conflict to report, not silently resolve.
- **`designs`** (optional): design references (links, screenshots, pasted copy). Passed to
  `implementer` and to the reviewer as context only. This skill does not re-derive acceptance
  criteria from them; that is `spec-creator`'s job, run separately if the designs reveal a gap.
- **`max_fix_iterations`** (optional, default: `2`): cap on review-fix loops before escalating to
  the user instead of looping forever.

## Workflow

1. **Implement.** Spawn `sdd-engineering:implementer` with the plan. Append `requirements` and
   `designs`, if given, as clearly labeled extra context ("not part of the plan, additional
   context"), not as new plan steps. Capture the Implementation Report and the git range touched.
2. **Review.** Spawn `architecture-review:architecture-reviewer` on that git range.
3. **Fix loop.** If the reviewer returned any finding with `blocking_candidate: yes`, or
   `severity: high` or `critical`: spawn `implementer` again, passing only those findings
   (`id`, `file:line`, `rule_source`, `remediation_direction`) as what to fix, not the whole plan
   again. Re-run the reviewer on the updated range.
   - Repeat up to `max_fix_iterations` times.
   - If findings of that severity remain after the cap, stop looping. Report them as open
     architecture debt blocking the plan rather than retrying indefinitely or quietly dropping them.
4. **Verify.** Once the fix loop is clean (or capped out), spawn `sdd-engineering:plan-verifier`
   against the plan and the final git range.
5. **Report.** Summarize: what was implemented; what was fixed and in how many iterations; any
   review findings still open; the `plan-verifier` status (`PASS`, `FAIL`, `PARTIAL` or
   `NOT-VERIFIED`, with the items behind it); and a line saying that tests were run only as far as
   the implementer's report says. This skill issues no merge verdict.

## Cost notes

- `implementer`, `architecture-reviewer` and `plan-verifier` pin `model: sonnet` in their own
  frontmatter, so they do not run on a larger model regardless of the orchestrating session.
- The cost levers this skill exposes: capping the fix loop with `max_fix_iterations`, and keeping
  `spec-creator` and `implementation-planner` out of the loop.

## Explicitly out of scope

- Writing or editing a spec: `spec-creator`, run manually before this skill.
- Writing or editing an Implementation Plan: `implementation-planner`, run manually before this skill.
- Security review, test writing, and any merge verdict: not part of this plugin. Run your own
  review process for those after this skill reports.
