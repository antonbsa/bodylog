---
name: persistence-review
description: Review a completed or interrupted coding task and decide what, if anything, should be persisted into README.md, AGENTS.md, CLAUDE.md, docs, backlog, or issues. Use when the user says persistence review, persist learnings, update docs, what should be saved, after finishing a task, before clearing context, or after generating a handoff.
---

# Persistence Review Skill

Review the current task and identify which information should become durable project knowledge.

This is not a session summary. Do not preserve temporary implementation noise. Promote only stable, reusable, project-relevant information.

Write the persistence review output to `.agent-state/PERSISTENCE_REVIEW.md` every time this skill is used.

If `.agent-state/` does not exist, create it. If `.agent-state/PERSISTENCE_REVIEW.md` already exists, rewrite the complete file with the latest persistence review output.

## Inputs to inspect

Use any available source that is relevant:

- current user request
- current conversation context
- `.agent-state/HANDOFF.md` or `HANDOFF.md`, if present
- `git status`
- `git diff --stat`
- `git diff`
- existing `README.md`
- existing `AGENTS.md`
- existing `CLAUDE.md`
- existing docs under `docs/`
- existing backlog, task, or issue files

If a handoff exists, use it as supporting context, not as the source of truth.

## Classification rules

Classify each finding into one of these buckets:

### README.md

Use for human-facing project knowledge:

- what the project does
- how to install, run, build, test, or deploy
- important user-facing behavior
- public configuration requirements
- contribution instructions useful to humans

### AGENTS.md / CLAUDE.md

Use for agent-facing operational guidance:

- project-specific commands agents should run
- testing expectations
- code style and naming conventions
- known repo structure
- boundaries and files agents should avoid
- recurring workflow rules
- non-obvious implementation constraints

Prefer `AGENTS.md` for cross-agent instructions.
Use `CLAUDE.md` only for Claude-specific behavior.

### docs/decisions

Use for stable technical decisions:

- architecture choices
- tradeoffs
- rejected alternatives that matter later
- dependency or platform decisions
- conventions that affect future implementation

Write as a short ADR-style entry if needed.

### docs/specs

Use for product or feature behavior:

- accepted requirements
- UX/business rules
- data model expectations
- edge cases that define intended behavior

### backlog / issues

Use for actionable future work:

- missing tests
- follow-up refactors
- known bugs
- incomplete features
- open questions requiring decision

### No persistence needed

Use for temporary or low-value information:

- files touched only because of implementation mechanics
- failed attempts with no future relevance
- obvious details already represented in code or tests
- local environment noise
- speculative ideas not yet accepted
- session-only next steps

## Review process

1. Inspect the repo state and existing documentation.
2. Identify new knowledge produced by the task.
3. Remove anything temporary, obvious, duplicated, or already documented.
4. Classify only the remaining durable information.
5. Recommend exact target files.
6. If documentation should change, propose concise patch-ready text.
7. If nothing should be persisted, say so clearly.

## Output format

Write `.agent-state/PERSISTENCE_REVIEW.md` with:

```md
# Persistence Review

## Verdict

[Nothing to persist / Persist selected items / Documentation update recommended]

## Recommended Changes

### README.md

- [Keep empty if no change]
- Reason:
- Suggested text:

### AGENTS.md / CLAUDE.md

- [Keep empty if no change]
- Reason:
- Suggested text:

### docs/decisions

- [Keep empty if no change]
- Reason:
- Suggested entry:

### docs/specs

- [Keep empty if no change]
- Reason:
- Suggested text:

### backlog / issues

- [Keep empty if no change]
- Reason:
- Suggested item:

## Do Not Persist

- Item:
  Reason:

## Final Recommendation

[Apply docs update / create backlog item / no action]
```

## Constraints

- Be conservative.
- Prefer no update over noisy documentation.
- Do not copy the handoff into permanent docs.
- Do not persist temporary session state.
- Do not persist secrets, credentials, machine-specific paths, or local-only debugging details.
- Keep suggested documentation short and directly useful.

After writing the file, respond with the generated file path and the final recommendation. Do not paste the full persistence review in chat unless the user asks for it.
