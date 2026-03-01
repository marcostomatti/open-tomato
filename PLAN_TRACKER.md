# PLAN.md

## Feature: Initialize Monorepo Directory Structure and Package Scaffolding

### Technical Context

This is the foundational commit for an Electron + React + TypeScript desktop application. All future work depends on the boundaries and conventions established here.

npm workspaces is selected over Turborepo. There is no demonstrated build performance requirement at this stage that would justify Turborepo's additional complexity. This decision should be recorded as an ADR.

TypeScript project references are used to enforce process boundaries at the compiler level. Each of `src/main`, `src/renderer`, `src/preload`, and `src/shared` is a separate composite TypeScript project. The compiler will reject imports that cross process boundaries incorrectly because each sub-tsconfig carries only the `lib` and `types` entries appropriate to its execution context.

`src/shared/types` must contain only pure TypeScript interface and type alias declarations with zero runtime imports. This is the structural guarantee that prevents Node.js API surface from leaking into the renderer bundle when the shared package is imported. The `@shared/types` and `@shared/ipc` path aliases are configured in each sub-tsconfig so the TypeScript language server and compiler resolve them correctly without requiring runtime module resolution changes.

`src/shared/ipc` is stubbed at this stage because AGENTS.md designates it as the sole location for cross-process IPC contracts. Establishing the directory and placeholder now prevents ad hoc channel name placement in early feature work.

The AGENTS.md change discipline rule applies here: do not scaffold subdirectories inside `src/main`, `src/renderer`, `src/preload`, or `src/renderer` (such as `features/`, `stores/`, `components/`) that have no files yet. Those directories are created when the first file that belongs in them is added.

Each subdirectory `README.md` in `src/main`, `src/renderer`, `src/preload`, and `src/shared/types` is a human and AI contract. It defines the module's single responsibility and lists explicit exclusions. Future agents use these to determine where a new file belongs.

---

# Stage: Repository Root

- [x] Initialize a git repository at the project root
- [x] Create root `.gitignore` excluding: `node_modules/`, `dist/`, `out/`, `.DS_Store`, `*.local`, `release/`, `*.dmg`, `*.exe`, `*.AppImage`, `*.tsbuildinfo`, `.turbo/`
- [x] Create root `.editorconfig` with: `charset = utf-8`, `end_of_line = lf`, `indent_style = space`, `indent_size = 2`, `trim_trailing_whitespace = true`, `insert_final_newline = true` applied as global defaults with no per-extension overrides at this stage
- [x] Create root `.prettierrc` with: `printWidth: 100`, `singleQuote: true`, `trailingComma: "all"`, `semi: true`, `endOfLine: "lf"`, `tabWidth: 2`
- [x] Create root `.eslintrc.json` referencing `@typescript-eslint/parser` and `plugin:@typescript-eslint/recommended-type-checked`, with `overrides` blocks scoped by glob pattern to `src/main/**`, `src/renderer/**`, and `src/preload/**` so that environment-specific globals (Node.js, browser) are applied only within the correct process directory
- [x] Create root `package.json` with `"private": true`, `"workspaces": ["src/main", "src/renderer", "src/preload", "src/shared"]`, a `scripts` block containing `"typecheck": "tsc --build"` and `"lint": "eslint src --ext .ts,.tsx"`, and `devDependencies` for TypeScript, ESLint, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, and Prettier; no runtime dependencies at root

# Stage: TypeScript Configuration

- [x] Create root `tsconfig.json` with `"files": []` and `"references"` entries pointing to `src/main`, `src/renderer`, `src/preload`, and `src/shared`; this file is a build orchestration entry point only and does not compile files directly
- [x] Create `src/shared/tsconfig.json` with `"composite": true`, `"declaration": true`, `"outDir": "dist"`, `"rootDir": "."`, `"strict": true`, `"module": "ESNext"`, `"moduleResolution": "bundler"`; omit `lib` entries that include DOM or Node types so this package remains context-neutral and safe to import from any process
- [x] Create `src/main/tsconfig.json` with `"composite": true`, `"strict": true`, `"module": "CommonJS"`, `"moduleResolution": "node"`, `"lib": ["ES2022"]`, `"types": ["node"]`, `"references": [{"path": "../shared"}]`, and `"paths": {"@shared/types": ["../shared/types/index.ts"], "@shared/ipc": ["../shared/ipc/index.ts"]}`
- [x] Create `src/preload/tsconfig.json` with `"composite": true`, `"strict": true`, `"module": "CommonJS"`, `"moduleResolution": "node"`, `"lib": ["ES2022", "DOM"]`, `"types": []` (no implicit Node or Electron globals; preload accesses the Node context through Electron's sandbox, not through ambient type declarations), `"references": [{"path": "../shared"}]`, and the same `paths` aliases as `src/main/tsconfig.json`
- [x] Create `src/renderer/tsconfig.json` with `"composite": true`, `"strict": true`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]`, `"types": []` (explicitly no Node.js types; any Node type appearing in renderer code is an error), `"references": [{"path": "../shared"}]`, and the same `paths` aliases
- [x] Confirm `tsc --build` from root exits with zero errors against the placeholder source files created in the Source Stubs stage

# Stage: Package Manifests

- [x] Create `src/main/package.json` with `"name": "@app/main"`, `"private": true`, `"version": "0.0.0"`, `"main": "index.ts"`; no dependencies declared at this stage
- [x] Create `src/renderer/package.json` with `"name": "@app/renderer"`, `"private": true`, `"version": "0.0.0"`; no dependencies declared at this stage
- [x] Create `src/preload/package.json` with `"name": "@app/preload"`, `"private": true`, `"version": "0.0.0"`; no dependencies declared at this stage
- [x] Create `src/shared/package.json` with `"name": "@app/shared"`, `"private": true`, `"version": "0.0.0"`, and an `"exports"` map with `"./types": "./types/index.ts"` and `"./ipc": "./ipc/index.ts"` so each entry point is addressable independently

# Stage: Source Stubs

- [x] Create `src/main/index.ts` containing only `export {}` to satisfy the TypeScript composite project requirement of at least one source file
- [x] Create `src/renderer/index.ts` containing only `export {}` for the same reason
- [x] Create `src/preload/index.ts` containing only `export {}` for the same reason
- [x] Create `src/shared/types/index.ts` exporting a single marker type (`export type SharedTypesPlaceholder = true`) to confirm that path alias resolution works across all three process tsconfigs before any real types are added
- [x] Create `src/shared/ipc/index.ts` with `export {}` and an inline comment stating this file will hold IPC channel name constants and the discriminated union of all cross-process command and event types; no implementation at this stage

# Stage: Documentation Directories

- [x] Create `docs/adr/README.md` specifying: ADR file naming convention (`NNNN-short-title.md`), required sections (title, status, context, decision, consequences), and the rule that accepted ADRs are not edited — a superseding decision creates a new numbered ADR that references the one it replaces
- [x] Create `docs/adr/0001-npm-workspaces-over-turborepo.md` recording the decision to use npm workspaces, the context (no build performance requirement at project start), the decision, and the consequence (revisit if incremental build times become a measurable problem)
- [x] Create `docs/patterns/README.md` specifying: what a pattern document contains (problem statement, chosen solution, example file reference, when not to apply it), and the rule that pattern docs describe conventions already present in the codebase rather than aspirational patterns
- [x] Create `scripts/README.md` stating that this directory holds development and build helper scripts only, that scripts are plain Node.js or POSIX shell, and that no application logic belongs here
- [x] Create `.github/workflows/.gitkeep` so the workflows directory is tracked by git before any CI workflow file is authored

# Stage: Subdirectory README Contracts

- [x] Write `src/main/README.md` defining: single responsibility (Electron app lifecycle, `BrowserWindow` creation and management, native menus, `ipcMain.handle` request handlers, OS integration, WebSocket server binding to localhost, child process spawning subject to the binary allowlist); explicit exclusions (no React or JSX, no DOM API usage, no imports from `src/renderer`, no business logic that belongs inside a renderer feature); note that all IPC channel name strings and payload type definitions are imported from `@app/shared/ipc` and must not be defined inline
- [x] Write `src/renderer/README.md` defining: single responsibility (React component tree, client-side Zustand state, presentation logic, in-window routing); explicit exclusions (no Electron main-process API imports, no Node.js built-in imports such as `fs`, `path`, or `child_process`, no direct WebSocket client, no filesystem access — all cross-process capability is accessed through the typed API surface that the preload script exposes on `window`); security note that `contextIsolation` is enabled and `nodeIntegration` is disabled for all renderer windows
- [x] Write `src/preload/README.md` defining: single responsibility (minimal audited bridge implemented with `contextBridge.exposeInMainWorld`, typed task-oriented command functions using `ipcRenderer.invoke`, typed push-subscription wrappers using `ipcRenderer.on`); explicit exclusions (no business logic, no UI rendering, no broad IPC forwarding, no exposure of raw `ipcRenderer` or any other Electron internal to the renderer); security constraint that every function exposed through `contextBridge` must have a narrow explicit TypeScript signature and must validate its arguments before forwarding to main
- [x] Write `src/shared/types/README.md` defining: single responsibility (TypeScript `interface`, `type`, and `enum` declarations that are referenced by more than one process context); explicit exclusions (no executable code of any kind, no imports from Node.js built-in modules, no imports from Electron, no DOM-specific types unless they are meaningful in all three contexts); explanation that this package being free of runtime imports is what makes it safe to reference from the renderer bundle without Node.js API surface leaking in

# Stage: Workspace Verification

- [x] Run `npm install` from the repository root and confirm all workspace symlinks are created without errors
- [x] Confirm that `node_modules/@app/main`, `node_modules/@app/renderer`, `node_modules/@app/preload`, and `node_modules/@app/shared` exist as workspace symlinks after install completes
- [x] Run `tsc --build` from root and confirm zero type errors
- [x] Add a temporary import of `SharedTypesPlaceholder` from `@shared/types` in `src/main/index.ts`, `src/preload/index.ts`, and `src/renderer/index.ts`; run `tsc --build` and confirm zero errors; remove the temporary imports and run `tsc --build` again to confirm the baseline is clean
- [x] Confirm `git status` does not surface `node_modules`, `dist`, `out`, `.DS_Store`, or any `*.tsbuildinfo` file, validating that `.gitignore` patterns are effective across all generated paths
