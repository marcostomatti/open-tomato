# src/shared/types

## Single responsibility

This package contains TypeScript `interface`, `type`, and `enum` declarations that are
referenced by more than one process context (main, preload, renderer).

Examples of what belongs here:

- Domain model interfaces shared across IPC boundaries (e.g. `CanvasMode`, `AppSettings`)
- Discriminated union variants used in both main-process logic and renderer state
- Enums whose members are meaningful identifiers in all three execution contexts

## Explicit exclusions

- **No executable code of any kind.** No function bodies, class implementations, `const`
  assignments, or default values beyond what TypeScript allows in a `type` or `enum`
  declaration itself.
- **No imports from Node.js built-in modules.** No `fs`, `path`, `child_process`, `os`,
  `net`, or any other Node.js built-in. These APIs do not exist in the renderer context.
- **No imports from Electron.** No `electron`, `electron/main`, `electron/renderer`, or
  any Electron sub-path. Electron API surfaces differ per context and importing them here
  would couple the shared package to a specific execution environment.
- **No DOM-specific types** unless the type is semantically meaningful and correct in all
  three execution contexts (main, preload, and renderer). When in doubt, keep DOM types in
  the renderer package instead.
- **No re-exports from external packages.** Type aliases that wrap third-party library
  types must be declared here as standalone types, not via `export { Foo } from 'some-lib'`.

## Why zero runtime imports matter

The renderer bundle is processed by a bundler that statically analyzes all imports. If
`src/shared/types` imported from a Node.js built-in or from Electron, the bundler would
either fail to resolve the import or include a Node.js shim in the renderer bundle,
exposing Node.js API surface in a context where `contextIsolation` is enabled and
`nodeIntegration` is disabled.

By keeping this package free of any runtime imports, it is safe to reference from the
renderer bundle without any Node.js API surface leaking in. The TypeScript compiler
enforces this at build time through the `src/renderer/tsconfig.json` configuration, which
sets `"types": []` (no implicit Node.js globals) and references this shared package.

## Path alias

Import from this package using the `@shared/types` path alias, which is configured in
each sub-tsconfig:

```ts
import type { CanvasMode } from '@shared/types';
```
