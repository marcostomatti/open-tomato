# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for this project.

## What is an ADR?

An ADR documents a significant architectural decision: the context that prompted it, the decision made, and its consequences. ADRs create a durable record of *why* the codebase is the way it is.

## File naming convention

```
NNNN-short-title.md
```

- `NNNN` is a zero-padded four-digit sequence number (e.g. `0001`, `0042`).
- `short-title` is a lowercase, hyphen-separated description of the decision (e.g. `npm-workspaces-over-turborepo`).
- Numbers are assigned sequentially and never reused.

## Required sections

Every ADR must contain the following sections in this order:

### Title

A single line identifying the decision. Matches the file name's short title in human-readable form.

### Status

One of:

- `Proposed` — under discussion, not yet adopted
- `Accepted` — adopted and in effect
- `Deprecated` — no longer recommended; a newer ADR supersedes it
- `Superseded by ADR-NNNN` — replaced by a specific later decision

### Context

The situation, constraints, or forces that made this decision necessary. Include relevant trade-offs considered and alternatives evaluated.

### Decision

The choice made and the rationale for it. Be specific.

### Consequences

What changes as a result of this decision — positive outcomes, trade-offs accepted, and any follow-up actions required.

## Immutability rule

**Accepted ADRs are not edited.**

Once an ADR reaches `Accepted` status, its content is frozen. If a decision changes:

1. Create a new ADR with the next available sequence number.
2. In the new ADR, reference the ADR it replaces (e.g. "This supersedes ADR-0003.").
3. Update the old ADR's `Status` field to `Superseded by ADR-NNNN` — this is the only permitted edit to an accepted ADR.

This rule preserves the historical record of *why* decisions were made and when they changed.
