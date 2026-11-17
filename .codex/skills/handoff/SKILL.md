---
name: handoff
description: Create or update a concise session handoff document so a fresh AI coding agent can continue the current task without prior conversation context. Use when the user says handoff, session summary, wrap up, save context, continue later, next agent, or before clearing context.
---

# Session Handoff Skill

Create or update `.agents/HANDOFF.md` in the project root.

If `.agents/` does not exist, create it. If `.agents/HANDOFF.md` already exists, rewrite the complete file with the latest handoff output.

## Steps

1. Check for existing handoff/progress files:

- `HANDOFF.md`
- `.agents/HANDOFF.md`
- `RESUME.md`
- `PROGRESS.md`
- `.ai-sync/HANDOFF.md`
- `.agent/**/implementation-notes.*`

2. Inspect the current work state:

- current branch
- git status
- git diff summary
- relevant changed files
- recent test/build/lint output if available

3. Write a handoff with this structure:

```md
# Handoff: [Task Name]

## Goal

[What the task is trying to accomplish]

## Current Status

[Done / partially done / blocked / needs review]

## Completed Work

- [x] ...

## Not Yet Done

- [ ] ...

## Files Changed / Relevant Files

- `path/to/file`: why it matters

## Key Decisions

- Decision: ...
  Rationale: ...

## Failed Attempts / Do Not Repeat

- Tried: ...
  Failed because: ...

## Validation

- Command: ...
  Result: ...

## Open Issues / Risks

- ...

## Next Exact Action

[The next concrete step]

## Resume Prompt

Read `.agents/HANDOFF.md`, verify the current git state, then continue from the "Next Exact Action" section. Do not repeat failed attempts. Before editing, summarize your understanding in 5 bullets.
```

4. Keep the handoff factual. Do not include vague encouragement or speculative plans unless labeled as assumptions.

5. After writing the file, respond with:

- handoff path
- current status
- next exact action
