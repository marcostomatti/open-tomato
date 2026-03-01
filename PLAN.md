# PLAN.md

## Feature: Initialize Monorepo Directory Structure and Package Scaffolding

### Technical Context

This is the foundational commit for an Electron + React + TypeScript desktop application. The repository uses npm workspaces (not Turborepo) as the simpler option with no demonstrated build performance need for Turbo at this stage. TypeScript project references are used to enforce strict process boundaries between Electron main, renderer, and preload contexts. The `src/shared/types` package must be importable from all three processes without introducing Node.js API leakage into the renderer bundle.

TypeScript `paths` aliasing (`@shared/types`) must be configured in each sub-`tsconfig.json` and the root `tsconfig.json` to resolve correctly across processes without runtime bundling side effects. Shared types are pure TypeScript interfaces and discriminated unions only — no runtime imports from Node or Electron.

Each subdirectory `README.md` in `src/main`, `src/renderer`, `src/preload`, and `src/shared/types` serves as both a human and AI contract defining single responsibility and explicit exclusions for that module.

---

# Stage: Repository Root

- [ ] Create root `.gitignore` excluding: `node_modules`, `dist`, `out`, `.DS_Store`, `*.local`, and common Electron build artifacts (`release/`, `*.dmg`, `*.exe`, `*.AppImage`)
- [ ] Create root `.editorconfig` with: `charset = utf-8`, `end_of_line = lf`, `indent_style = space`, `indent_size = 2`, `trim_trailing_whitespace = true`, `insert_final_newline = true`
- [ ] Create root `.prettierrc` with project formatting defaults consistent with 2-space indent and LF line endings
- [ ] Create root `.eslintrc.json` (or `.eslintrc.cjs`) with TypeScript ESLint parser, strict rules, and separate override blocks for main, preload, and renderer contexts
- [ ] Create root `package.json` declaring `"workspaces": ["src/main", "src/renderer", "src/preload", "src/shared"]`, `"private": true`, and a minimal set of root dev dependencies (TypeScript, ESLint, Prettier)

# Stage: TypeScript Configuration

- [ ] Create root `tsconfig.json` with `"references"` pointing to `src/main`, `src/renderer`, `src/preload`, and `src/shared`; set `"composite": false` at root (composite is set per-package); enable `strict`, `noEmit` at root for type-checking only
- [ ] Create `src/shared/tsconfig.json` with `"composite": true`, `"outDir": "dist"`, targeting ESNext modules, no DOM lib, no Node types — pure type definitions only
- [ ] Create `src/main/tsconfig.json` with `"composite": true`, references to `src/shared`, `"lib": ["ES2022"]`, `"types": ["node"]`, `paths` mapping `@shared/types` to `../../shared/types`
- [ ] Create `src/preload/tsconfig.json` with `"composite": true`, references to `src/shared`, `"lib": ["ES2022", "DOM"]`, restricted `types` (no full node, only what preload needs), `paths` mapping `@shared/types`
- [ ] Create `src/renderer/tsconfig.json` with `"composite": true`, references to `src/shared`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]`, `"types": []` (no Node types), `paths` mapping `@shared/types`
- [ ] Verify that `tsc --build` from root compiles without errors against empty placeholder source files in each package

# Stage: Directory Structure

- [ ] Create `src/main/` directory with placeholder `index.ts` (empty export) and `package.json` declaring package name `@app/main`
- [ ] Create `src/renderer/` directory with placeholder `index.ts` (empty export) and `package.json` declaring package name `@app/renderer`
- [ ] Create `src/preload/` directory with placeholder `index.ts` (empty export) and `package.json` declaring package name `@app/preload`
- [ ] Create `src/shared/` directory with `package.json` declaring package name `@app/shared` and `"main": "types/index.ts"`
- [ ] Create `src/shared/types/` directory with placeholder `index.ts` exporting an empty object or a minimal marker type to confirm resolution
- [ ] Create `src/shared/ipc/` directory stub with a placeholder `index.ts` and a brief inline comment noting this is where IPC channel names and discriminated union types will live
- [ ] Create `docs/adr/` directory with a `.gitkeep` and a brief `README.md` explaining ADR format and naming convention
- [ ] Create `docs/patterns/` directory with a `.gitkeep` and a brief `README.md` explaining what a pattern doc contains
- [ ] Create `scripts/` directory with a `.gitkeep` and a brief `README.md` noting this is for dev and build helper scripts only
- [ ] Create `.github/workflows/` directory with a `.gitkeep` placeholder (CI workflow defined in a subsequent task)

# Stage: Subdirectory README Contracts

- [ ] Write `src/main/README.md` defining: single responsibility (app lifecycle, windows, menus, IPC handlers, OS integration, WebSocket server), explicit exclusions (no React, no DOM APIs, no direct renderer imports), and a note that all IPC channel names come from `@app/shared/ipc`
- [ ] Write `src/renderer/README.md` defining: single responsibility (React UI, client-side state, presentation logic), explicit exclusions (no Electron main-process APIs, no Node.js built-ins, no direct filesystem access), and a note that all external access goes through the preload-exposed `window` API
- [ ] Write `src/preload/README.md` defining: single responsibility (minimal audited bridge via `contextBridge`, typed task-oriented APIs), explicit exclusions (no business logic, no UI code, no broad IPC pass-through), and security constraints (every exposed function must be narrowly typed and validated)
- [ ] Write `src/shared/types/README.md` defining: single responsibility (TypeScript interfaces and discriminated unions shared across processes), explicit exclusions (no runtime code, no Node or Electron imports, no DOM-specific types unless universally applicable), and a note that this package must remain import-safe from the renderer bundle

# Stage: Workspace Verification

- [ ] Run `npm install` from root and confirm all workspace symlinks resolve without errors
- [ ] Confirm `node_modules` at root contains hoisted dependencies and workspace packages are linked correctly
- [ ] Confirm `@shared/types` path alias resolves in a minimal type-check test referencing it from a file in `src/main`, `src/preload`, and `src/renderer`
- [ ] Confirm `.gitignore` patterns correctly exclude `node_modules`, `dist`, `out`, `.DS_Store`, and `*.local` by verifying `git status` does not surface those paths on a clean install
