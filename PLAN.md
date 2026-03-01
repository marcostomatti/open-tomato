# PLAN.md

## Feature: Initialize Monorepo Directory Structure and Package Scaffolding

### Technical Context

This is the foundational commit for an Electron + React + TypeScript desktop application. npm workspaces is selected over Turborepo as the simpler option with no demonstrated build performance requirement at this stage. TypeScript project references enforce strict process boundaries between Electron main, renderer, and preload contexts at the compiler level, preventing accidental cross-context imports.

The `src/shared/types` package must contain only pure TypeScript interfaces and discriminated unions — no runtime imports from Node.js or Electron — so that it is safe to import from the renderer bundle without leaking Node.js APIs into the browser context. The `@shared/types` path alias must be configured in each sub-`tsconfig.json` so the TypeScript compiler resolves it correctly in all three process contexts.

The `src/shared/ipc/` stub is included at this stage because AGENTS.md designates it as the sole sanctioned location for cross-process contracts, and establishing that boundary now prevents ad hoc IPC type placement in early feature work.

Each subdirectory `README.md` acts as both a human and AI contract, defining the module's single responsibility and explicit exclusions. This directly supports the AGENTS.md principle of clear module boundaries.

---

# Stage: Repository Root Files

- [ ] Initialize git repository at project root if not already initialized
- [ ] Create root `.gitignore` excluding: `node_modules/`, `dist/`, `out/`, `.DS_Store`, `*.local`, `release/`, `*.dmg`, `*.exe`, `*.AppImage`, `.turbo/`, `*.tsbuildinfo`
- [ ] Create root `.editorconfig` with: `charset = utf-8`, `end_of_line = lf`, `indent_style = space`, `indent_size = 2`, `trim_trailing_whitespace = true`, `insert_final_newline = true` applied globally with no per-extension overrides at this stage
- [ ] Create root `.prettierrc` specifying: `printWidth: 100`, `singleQuote: true`, `trailingComma: "all"`, `semi: true`, `endOfLine: "lf"`, `tabWidth: 2`
- [ ] Create root `.eslintrc.json` with `@typescript-eslint/parser`, `plugin:@typescript-eslint/recommended-type-checked` rules, and separate `overrides` blocks scoped by glob to `src/main/**`, `src/renderer/**`, and `src/preload/**` so environment-specific globals (Node, browser) are applied only where correct
- [ ] Create root `package.json` with `"private": true`, `"workspaces": ["src/main", "src/renderer", "src/preload", "src/shared"]`, a `scripts` block containing at minimum `"typecheck": "tsc --build"`, and root-level `devDependencies` for TypeScript, ESLint, Prettier, and their plugins (no runtime dependencies at root)

# Stage: TypeScript Configuration

- [ ] Create root `tsconfig.json` with `"files": []`, `"references"` pointing to `src/main`, `src/renderer`, `src/preload`, and `src/shared`; root config is for `--build` orchestration only and does not compile files directly
- [ ] Create `src/shared/tsconfig.json` with `"composite": true`, `"declaration": true`, `"outDir": "dist"`, `"rootDir": "."`, `"strict": true`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, no `lib` entries that include DOM or Node types — this package must be context-neutral
- [ ] Create `src/main/tsconfig.json` with `"composite": true`, `"strict": true`, `"module": "CommonJS"`, `"lib": ["ES2022"]`, `"types": ["node"]`, `"references": [{"path": "../shared"}]`, and `"paths": {"@shared/types": ["../shared/types/index.ts"], "@shared/ipc": ["../shared/ipc/index.ts"]}`
- [ ] Create `src/preload/tsconfig.json` with `"composite": true`, `"strict": true`, `"module": "CommonJS"`, `"lib": ["ES2022", "DOM"]`, `"types": []` (no implicit Node or Electron globals; preload accesses Node via explicit Electron preload sandbox), `"references": [{"path": "../shared"}]`, and matching `paths` aliases for `@shared/types` and `@shared/ipc`
- [ ] Create `src/renderer/tsconfig.json` with `"composite": true`, `"strict": true`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]`, `"types": []` (explicitly no Node types), `"references": [{"path": "../shared"}]`, and matching `paths` aliases for `@shared/types` and `@shared/ipc`
- [ ] Verify `tsc --build` from root exits without errors against placeholder source files in each package

# Stage: Package Manifests

- [ ] Create `src/main/package.json` with `"name": "@app/main"`, `"private": true`, `"version": "0.0.0"`, and an empty `dependencies` block; no runtime dependencies declared at this stage
- [ ] Create `src/renderer/package.json` with `"name": "@app/renderer"`, `"private": true`, `"version": "0.0.0"`, and an empty `dependencies` block
- [ ] Create `src/preload/package.json` with `"name": "@app/preload"`, `"private": true`, `"version": "0.0.0"`, and an empty `dependencies` block
- [ ] Create `src/shared/package.json` with `"name": "@app/shared"`, `"private": true`, `"version": "0.0.0"`, `"main": "./types/index.ts"`, `"exports"` map covering `./types` and `./ipc` entry points pointing to their respective `index.ts` files

# Stage: Source Directory Stubs

- [ ] Create `src/main/index.ts` as an empty module (`export {}`) to satisfy TypeScript project reference compilation
- [ ] Create `src/renderer/index.ts` as an empty module (`export {}`) to satisfy TypeScript project reference compilation
- [ ] Create `src/preload/index.ts` as an empty module (`export {}`) to satisfy TypeScript project reference compilation
- [ ] Create `src/shared/types/index.ts` exporting a single marker type (`export type SharedTypesMarker = true`) to confirm path alias resolution is functional across all three process tsconfigs
- [ ] Create `src/shared/ipc/index.ts` with a comment block noting this file will hold IPC channel name constants and discriminated union types for all cross-process contracts, and an empty `export {}` statement

# Stage: Documentation Directories

- [ ] Create `docs/adr/README.md` describing the ADR format in use (title, status, context, decision, consequences), the file naming convention (`NNNN-short-title.md`), and that ADRs are immutable once accepted — superseding decisions create a new ADR referencing the old one
- [ ] Create `docs/patterns/README.md` describing what a pattern document contains (problem statement, solution, example file references, when not to use it) and that patterns document stabilized conventions already present in the codebase
- [ ] Create `scripts/README.md` noting this directory holds dev and build helper scripts only, that scripts are plain Node.js or shell, and that no application logic belongs here
- [ ] Create `.github/workflows/.gitkeep` as a placeholder so the workflows directory is tracked before any CI definition is added

# Stage: Subdirectory README Contracts

- [ ] Write `src/main/README.md` covering: single responsibility (Electron app lifecycle, `BrowserWindow` management, menus, `ipcMain` handlers, OS integration, WebSocket server, child process spawning); explicit exclusions (no React imports, no DOM APIs, no direct renderer-layer imports, no business logic that belongs in a feature); note that all IPC channel names and payload types are imported from `@app/shared/ipc` and nowhere else
- [ ] Write `src/renderer/README.md` covering: single responsibility (React UI tree, client-side Zustand state, presentation logic, routing); explicit exclusions (no Electron main-process API imports, no Node.js built-in imports, no direct filesystem or OS access, no WebSocket client — all external access is mediated through the `window.api` surface exposed by the preload script); note that `contextIsolation` is enabled and `nodeIntegration` is disabled
- [ ] Write `src/preload/README.md` covering: single responsibility (minimal audited bridge using `contextBridge.exposeInMainWorld`, typed task-oriented API surfaces, typed push-subscription wrappers over `ipcRenderer.on`); explicit exclusions (no business logic, no UI rendering, no broad IPC pass-through, no exposure of raw `ipcRenderer` to renderer); security note that every function exposed through `contextBridge` must have a narrow type signature and validate its inputs before forwarding to main
- [ ] Write `src/shared/types/README.md` covering: single responsibility (TypeScript interfaces, type aliases, and discriminated unions that are referenced by more than one process context); explicit exclusions (no runtime code of any kind, no imports from Node.js built-ins, no imports from Electron, no DOM-specific types unless universally applicable across all three contexts); note that this package is the reason `@app/renderer` tsconfig carries no Node types — any type that requires Node must not live here

# Stage: Workspace Verification

- [ ] Run `npm install` from repository root and confirm all workspace symlinks resolve and no errors are reported
- [ ] Confirm that `node_modules/@app/main`, `node_modules/@app/renderer`, `node_modules/@app/preload`, and `node_modules/@app/shared` are present as workspace symlinks after install
- [ ] Run `tsc --build` from root and confirm zero type errors against the placeholder source files
- [ ] Confirm the `@shared/types` path alias resolves correctly by adding a temporary import of `SharedTypesMarker` in `src/main/index.ts`, `src/preload/index.ts`, and `src/renderer/index.ts`, running `tsc --build`, then removing the temporary imports
- [ ] Confirm `git status` does not surface `node_modules`, `dist`, `out`, or `.DS_Store` entries, validating the `.gitignore` patterns are effective
- [ ] Confirm `.editorconfig` settings are applied by opening one file in each of `src/main`, `src/renderer`, `src/preload`, and `src/shared` in an EditorConfig-aware editor and verifying indent and line ending settings match the specification
