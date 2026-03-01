# Patterns

This directory contains pattern documents for this project.

## What is a pattern document?

A pattern document records a recurring engineering convention that has proven effective in this codebase. It names the problem the pattern solves, describes the solution the codebase has settled on, points to a concrete example, and states when the pattern should not be applied.

## Required sections

Every pattern document must contain the following sections:

### Problem

A concise description of the recurring problem or decision point this pattern addresses. State the forces at play — what goes wrong without the pattern, and why a naive approach fails.

### Chosen solution

The specific approach this codebase uses to solve the problem. Be concrete: name the mechanism, module boundary, or convention. Avoid describing alternatives as valid — the point of this section is to eliminate ambiguity about what to do.

### Example

A reference to a specific file (and, where useful, a line range or function name) that demonstrates the pattern in practice. Example:

```
src/main/ipc/handlers.ts — see registerHandlers()
```

The example must be a file that exists in the codebase at the time the pattern document is written.

### When not to apply

Explicit conditions under which this pattern does not apply or would be wrong to use. This is as important as the chosen solution: it prevents cargo-culting the pattern into contexts where it causes harm.

## Codebase-first rule

**Pattern documents describe conventions already present in the codebase, not aspirational conventions.**

A pattern document may only be written after the pattern is established across at least two independent locations in the codebase. Do not write a pattern document to propose a convention — write an ADR for that. Once the codebase adopts the convention and it is visible in real files, convert the intent into a pattern document.

This rule keeps pattern documents grounded in evidence rather than speculation, and ensures the example reference in each document points to real, working code.
