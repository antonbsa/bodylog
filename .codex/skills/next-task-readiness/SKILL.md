---
name: next-task-readiness
description: Validate the next executable task, tracked as a GitHub sub-issue, before implementation. Use when the user asks to proceed to the next task, check what task is next, prepare a task before coding, verify whether a task can be started, or summarize expected implementation changes before starting work.
---

# Next Task Readiness

Use this skill to perform a pre-implementation readiness check. The output must help the owner decide whether to start implementation, not start implementation itself.

## Core Rule

Do not edit project files, implement code, or write to GitHub (no comments, labels or state changes) while using this skill. Report to the owner only; implementation starts only after the owner confirms it following the readiness summary.

Use read-only commands: `gh issue view`, `gh api` GETs, `git status`, `git branch`, `rg`, `sed`, package metadata reads.

## Workflow

1. Find the active parent issue.
   - If the user names an issue, use it (when it is a sub-issue, use its parent for ordering).
   - Otherwise list open parent issues: `gh api repos/{owner}/{repo}/issues --jq '.[] | select(.sub_issues_summary.total > 0) | "\(.number) \(.title) \(.sub_issues_summary.completed)/\(.sub_issues_summary.total)"'`. One match is the active parent; several matches go to the owner to choose.
   - List its sub-issues in initiative order with `gh api repos/{owner}/{repo}/issues/<parent>/sub_issues --jq '.[] | "\(.number) \(.state) \(.title)"'`; `gh issue view` shows no state or order for them.

2. Select the task.
   - The next task is the first open sub-issue in that order, or the one the user names.
   - Read its `**Depends on:**` line and check with `gh issue view <n> --json state` that every listed issue is closed. An open dependency makes the task `Blocked`, naming the dependency.

3. Load context.
   - Read the sub-issue and its parent with `gh issue view <n>`.
   - Read `AGENTS.md` and every doc it requires before coding, plus the docs and ADRs the issue links. For UI tasks that includes `docs/product/ui-direction.md` and the prototype `docs/product/prototype/mobile-redesign.html`.
   - Report any file or issue that cannot be read as `unreadable` with the error, and mark the task `Blocked`.

4. Surface open points.
   - Collect every item in the issue's "Open points" section, plus any assumption in the issue or docs marked "Confirm before implementing" or "Must be decided before implementing".
   - Each one is a decision the owner makes before coding: list it with the assumed default (if any) and ask. Unanswered open points keep the verdict at `Needs direction`.

5. Check repository state.
   - `git status --short` and `git branch --show-current`. The expected branch is the initiative's single feature branch (named in the parent issue's Workflow section, for example `feat/mobile-redesign`); report a different branch or uncommitted changes that make the expected edits risky.
   - Confirm that files, scripts, migrations and docs the issue names exist.
   - Check that the task does not overlap another sub-issue's scope or the parent's out-of-scope list.

6. Decide the verdict.
   - Ready: dependencies closed, no open points, low-risk assumptions.
   - Needs direction: one or more owner decisions are required.
   - Blocked: an open dependency, unreadable input, or repository state prevents progress.

## Output Shape

Report only findings that affect readiness; omit passing checks.

<!-- prettier-ignore -->
```md
**Task**
#<n> Title (parent #<p>; next in order / named by user)

**Readiness**
Ready / Needs direction / Blocked, with the reason

**Decisions Needed**
Open points to settle before coding, each with its assumed default. Omit when none.

**Findings**
Blockers, branch or working-tree problems, doc conflicts, scope overlaps. Omit when none.

**Expected Changes**
Short bullets with likely files and areas.

**Validation Plan**
Checks from the issue's Validation section (typecheck, lint, tests, migrations). For UI tasks, a screenshot at phone width in light and dark, compared against the prototype, before the issue is closed.

Waiting for confirmation before implementation.
```

For small tasks, a shorter prose version is fine, but it must still stop before implementation.
