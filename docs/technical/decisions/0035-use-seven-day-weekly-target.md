# 0035 — Use Seven-day Weekly Target

## Status

Accepted

## Context

The registration reliability rule (low up to 2 records, medium 3–4, high 5 or more) assumed a five-day target and showed a Baixa/Média/Alta label. The owner wants to record every day, and a reliability label reads as a judgment on the data.

## Decision

The weekly registration target is 7 days. The UI shows the count as `registered/7` and the actual recorded days as dots (filled recorded, hollow missing, dimmed future). The Baixa/Média/Alta reliability label is removed.

The comparison week shows its own count ("vs 3–9 nov · 6/7"). Weeks still run Monday to Sunday, and the partial current week is still compared with the previous full week (`0010-use-monday-week-start.md`, `0011-compare-partial-current-week-to-previous-full-week.md`).

## Consequences

The weekly summary API returns the recorded dates of each week so the UI can draw the real day dots. The reliability rules in `docs/product/requirements.md`, `docs/product/scope.md` and the previous UI direction are removed.
