---
name: suggest-pr
description: Suggest a pull request title and description from the current repository changes. Use when the user asks for a PR title, PR description/body, draft pull request summary, or ready-to-copy PR text based on local commits, staged changes, or unstaged changes; must follow the repository PR template and warn if local main has unpushed commits.
---

# Suggest PR

Use this skill to draft PR text from the current worktree and branch history. Do not create commits, push branches, or open PRs.

Write the suggested PR output to `PR_DESCRIPTION.md` at the repository root every time this skill is used. Overwrite the file when it already exists.

## Workflow

1. Inspect repository state.
   - Run `git status --short --branch`.
   - Run `git branch --show-current`.
   - If `origin/main` is available, find the PR base with:
     - `git merge-base --fork-point origin/main HEAD`, falling back to `git merge-base origin/main HEAD`.
   - If `origin/main` is not available, use the current `HEAD` as the base for uncommitted changes and state that remote comparison was unavailable.

2. Check for unintended local main commits.
   - Run `git fetch --quiet origin main` when network access is available. If it fails, continue using the existing local `origin/main` ref and mention that the remote check could not be refreshed.
   - If both `main` and `origin/main` exist, run `git rev-list --count origin/main..main`.
   - If the count is greater than zero, include a prominent warning before the PR suggestion:
     `Warning: local main is ahead of origin/main by N commit(s). This may mean commits were made on main and not pushed.`
   - Include the unpushed main commit subjects with `git log --oneline origin/main..main` when available.
   - Do not treat this warning as a blocker unless the user asked for a clean PR-ready state.

3. Gather change context.
   - Read `.github/pull_request_template.md`; the PR description must use this template's headings and structure.
   - Collect committed changes since the base:
     - `git log --oneline <base>..HEAD`
     - `git diff --name-status <base>...HEAD`
     - `git diff --stat <base>...HEAD`
   - Collect staged and unstaged changes:
     - `git diff --cached --name-status`
     - `git diff --name-status`
     - `git diff --cached --stat`
     - `git diff --stat`
   - Inspect relevant diffs as needed, keeping the final output concise.

4. Draft the title.
   - Use the format `type(scope): subject`.
   - Choose `type` according to Conventional Commits used by the repository, such as `feat`, `fix`, `docs`, `test`, `chore`, or `refactor`.
   - Use a short lowercase `scope` that names the main affected area, such as `auth`, `api`, `docs`, `tasks`, `ci`, or `ui`.
   - Write `subject` in imperative or concise present tense, without a trailing period.
   - Prefer one title that describes the full accumulated change set, not just the latest edit.

5. Draft the description.
   - Follow `.github/pull_request_template.md` exactly for section order and headings.
   - Replace placeholder bullets with concrete bullets derived from the current changes.
   - If a template section is not applicable, keep the heading and write `- N/A`.
   - For spec references, include changed or relevant docs/spec/task files when present; otherwise write `- N/A`.
   - Do not add extra sections unless the user asks.

6. Write the output file.
   - Create or replace `PR_DESCRIPTION.md` in the repository root.
   - The file must contain the warning when present, then the title and description in the same format shown below.
   - Do not write the PR suggestion anywhere outside the repository root unless the user explicitly asks.

## Output

Write `PR_DESCRIPTION.md` with:

```md
Warning: ... (only when local main is ahead of origin/main)

Title:
type(scope): subject

Description:
<PR body following .github/pull_request_template.md>
```

Then respond with the generated file path and the title. Do not paste the full PR description in chat unless the user asks for it.

If the worktree has no commits or file changes to describe, say that no PR suggestion can be made from the current repository state.
