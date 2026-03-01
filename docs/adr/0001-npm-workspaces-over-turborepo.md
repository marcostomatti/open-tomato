# npm workspaces over Turborepo

## Status

Accepted

## Context

The project requires a monorepo structure to host multiple TypeScript packages (`@app/main`, `@app/renderer`, `@app/preload`, `@app/shared`) that represent distinct Electron process boundaries. A build orchestration tool was needed to manage inter-package dependencies and workspace linking.

Two options were evaluated:

**npm workspaces** — built into npm, requires no additional tooling, handles workspace symlinking and cross-package dependency resolution out of the box. TypeScript project references (`tsc --build`) provide incremental compilation without an external task runner.

**Turborepo** — a dedicated build orchestration layer on top of package managers. Provides remote caching, parallelized task graphs, and fine-grained incremental builds across packages. Adds a `turbo.json` configuration file and a `turbo` binary dependency.

At project start there is no demonstrated build performance problem. The package count is small (four packages), the build graph is shallow, and `tsc --build` with TypeScript project references already provides incremental compilation at the compiler level. Turborepo's primary value — remote caching and parallelized task pipelines — does not address any current bottleneck.

## Decision

Use npm workspaces for monorepo package management and TypeScript project references (`tsc --build`) for incremental compilation. Do not introduce Turborepo.

## Consequences

- No additional build tooling dependency. `npm install`, `npm run typecheck`, and `npm run lint` are sufficient for the current workspace.
- TypeScript project references enforce process-boundary correctness at the compiler level without requiring a separate task runner.
- If incremental build times become a measurable problem as the package count or file count grows, Turborepo (or an equivalent tool such as Nx) should be evaluated and introduced as a superseding decision recorded in a new ADR.
- The `.turbo/` directory is already excluded in `.gitignore` in anticipation of a potential future migration.
