---
name: next-task-readiness
description: Validate the next executable project task before implementation. Use when the user asks to proceed to the next task, check what task is next, prepare a task before coding, verify whether a task can be started, or summarize expected implementation changes before starting work.
---

# Next Task Readiness

Use this skill to perform a pre-implementation readiness check. The output must help the user decide whether to start implementation, not start implementation itself.

## Core Rule

Do not edit project files or implement code while using this skill unless the user explicitly confirms implementation after the readiness summary.

Read files and run harmless inspection commands as needed. Prefer `rg`, `rg --files`, `sed`, `git status`, and package metadata reads.

## Workflow

1. Identify the selected task.
   - Rule 1: If the user names a task, use that task and record source='user'.
   - Rule 2: Else if a project task index exists, such as `specs/*/tasks/README.md`, use that index and record source='index'.
   - Rule 3: Else scan task markdown files in numeric order and choose the first task whose `## Status` is not `Done`, recording source='scan'.
   - If multiple sources are available and disagree, report the conflict, list each source, and ask which source to follow.

2. Load required context.
   - Read repository agent instructions such as `AGENTS.md` when present.
   - Read the selected task file. If a required file cannot be read, report it as `unreadable` with the OS error and mark readiness as `Blocked` unless the user supplies the file or permissions.
   - Read the project docs/specs required by repo instructions for starting a task.
   - Read task files in the same directory and in the same spec folder as the selected task. Additionally read any files referenced by the selected task's `Prerequisites` or `Depends on` sections.

3. Validate readiness.
   - Mandatory checks (must run):
     - `git status --short`.
     - Existence of required files, package scripts, configs, migrations, or docs explicitly listed by the task or project docs.
   - Advisory checks (run if quick):
     - Whether previous prerequisite tasks appear complete.
     - Whether unresolved open questions or decisions directly affect the selected task.
     - Whether the requested task overlaps another task's explicit scope.
   - For each check, return PASS/FAIL/UNKNOWN with a one-line reason.
   - Do not treat nice-to-have polish as a blocker.

4. Decide the readiness result.
   - Ready: enough information exists and assumptions are low risk.
   - Needs direction: one or more decisions are required before implementation.
   - Blocked: project state prevents meaningful progress without user input or external changes.

5. Respond with a concise readiness summary.
   - Selected task and how it was identified.
   - Current project state relevant to the task.
   - Whether everything needed is present.
   - Blockers or decisions needed, if any.
   - Intended implementation approach.
   - Expected files or areas likely to change.
   - Validation plan.
   - Explicitly state that implementation is waiting for confirmation.

## When Direction Is Needed

Ask for direction instead of guessing when:

- project docs conflict with the task;
- required technology choices are undecided and materially affect files or dependencies;
- the task scope overlaps another task in a way that could cause rework;
- existing uncommitted changes make the expected edits risky;
- an external secret, account, deployment target, or credential is required.

Group related questions into one reply when they share the same decision context. Limit each group to a single decision with up to 3 clarifying sub-questions.

## Output Shape

Use this structure when useful:

```md
**Selected Task**
T-000 — Task title

**Readiness**
Ready / Needs direction / Blocked

**What I Checked**
Short bullets.

**Decisions Needed**
Only include if needed.

**Intended Changes**
Short bullets with likely files/areas.

**Validation Plan**
Commands or manual checks.

Waiting for confirmation before implementation.
```

For small tasks, a shorter prose version is fine, but it must still stop before implementation.
