# PLAN.md

## Feature: Configure TypeScript strict mode, ESLint, and Prettier with pre-commit enforcement

### Technical Context

This plan locks in the code quality toolchain for a TypeScript + Electron + React 19 monolithic desktop application. The codebase has three distinct process boundaries — `main`, `preload`, and `renderer` — each of which requires its own `tsconfig.json` with strict settings. ESLint must be configured using the flat config format (`eslint.config.mjs`) and must apply per-directory rule overrides to relax `no-console` in `src/main`. Husky and lint-staged enforce the same rules at commit time without requiring developers to remember manual steps.

All configuration must live in committed files, not inlined into `package.json` scripts.

---

# Stage: TypeScript Configuration

- [ ] Pin TypeScript in `package.json` using `~` (e.g. `"typescript": "~5.4.5"`) — do not use `^`
- [ ] Add or update the root `tsconfig.json` with `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, and `noUncheckedIndexedAccess: true`
- [ ] Create `tsconfig.main.json` extending the root config, scoped to `src/main`
- [ ] Create `tsconfig.preload.json` extending the root config, scoped to `src/preload`
- [ ] Create `tsconfig.renderer.json` extending the root config, scoped to `src/renderer`
- [ ] Verify each process-level tsconfig sets the correct `module`, `target`, and `lib` values for its runtime environment (Node for main/preload, DOM for renderer)
- [ ] Add `npm run typecheck` script that runs `tsc --noEmit` against all tsconfig files
- [ ] Confirm `npm run typecheck` exits 0 on the empty initial codebase

# Stage: ESLint Configuration

- [ ] Install `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, and `typescript-eslint` as dev dependencies with pinned minor versions
- [ ] Install `eslint-plugin-import` for cycle detection
- [ ] Install `eslint-config-prettier` to disable conflicting formatting rules
- [ ] Create `eslint.config.mjs` using the flat config format
- [ ] Configure the base ruleset with `@typescript-eslint/recommended-type-checked` applied to all TypeScript source files
- [ ] Set `@typescript-eslint/no-explicit-any: error` in the base config
- [ ] Set `@typescript-eslint/no-floating-promises: error` in the base config
- [ ] Set `@typescript-eslint/explicit-function-return-type: warn` scoped to exported functions in the base config
- [ ] Set `import/no-cycle: error` in the base config
- [ ] Set `no-console: warn` in the base config
- [ ] Add a per-directory override in `eslint.config.mjs` that sets `no-console: off` for files under `src/main`
- [ ] Wire `parserOptions.project` in the ESLint config to point to the per-process tsconfig files so type-aware rules function correctly
- [ ] Apply `eslint-config-prettier` as the final entry in the flat config to disable all formatting rules
- [ ] Add `npm run lint` script that runs `eslint src/` with `--max-warnings 0` for CI strictness
- [ ] Confirm `npm run lint` exits 0 on the empty initial codebase

# Stage: Prettier Configuration

- [ ] Install `prettier` as a dev dependency with a pinned minor version
- [ ] Create `.prettierrc` (JSON format) with: `singleQuote: true`, `tabWidth: 2`, `printWidth: 100`, `trailingComma: "all"`
- [ ] Create `.prettierignore` excluding `dist/`, `out/`, `node_modules/`, and any generated asset directories
- [ ] Add `npm run format:check` script: `prettier --check "src/**/*.{ts,tsx,mts,js,mjs,json}"`
- [ ] Add `npm run format:write` script: `prettier --write "src/**/*.{ts,tsx,mts,js,mjs,json}"`
- [ ] Confirm `npm run format:check` exits 0 on the empty initial codebase

# Stage: Pre-commit Hooks

- [ ] Install `husky` as a dev dependency
- [ ] Install `lint-staged` as a dev dependency
- [ ] Run `husky init` to scaffold the `.husky/` directory and add the `prepare` script to `package.json`
- [ ] Create `.husky/pre-commit` hook that executes `npx lint-staged`
- [ ] Create `lint-staged.config.mjs` (or add `lint-staged` key to `package.json` only if no standalone file is feasible — prefer standalone file per acceptance criteria)
- [ ] Configure lint-staged to run `eslint --fix` then `prettier --write` on staged `*.ts` and `*.tsx` files
- [ ] Configure lint-staged to run `prettier --write` on staged `*.json`, `*.mjs`, and `*.js` files
- [ ] Confirm that a staged file with an unfixable ESLint error (e.g. explicit `any` without a suppression comment) blocks the commit and prints a clear error message
- [ ] Confirm that a staged file with a Prettier formatting violation is auto-corrected and re-staged automatically before the commit completes

# Stage: CI Integration

- [ ] Add a CI job step (or document the required commands) that runs `npm run typecheck`, `npm run lint`, and `npm run format:check` in sequence
- [ ] Ensure the CI step fails fast on the first failing command
- [ ] Verify the CI commands use the same installed versions as local development (no global tool installs in CI)

# Stage: Validation and Documentation

- [ ] Manually test the blocked-commit scenario: add a file containing an explicit `any` without a suppression comment, stage it, and confirm the commit is rejected
- [ ] Manually test the auto-fix scenario: add a file with a formatting violation, stage it, commit, and confirm the violation is corrected and the corrected file appears in the commit
- [ ] Confirm all config files are tracked by git: `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `tsconfig.json`, `tsconfig.main.json`, `tsconfig.preload.json`, `tsconfig.renderer.json`, `.husky/pre-commit`, `lint-staged.config.mjs`
- [ ] Add a brief `docs/toolchain.md` entry describing the ESLint suppression comment convention (`// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>`) so the documented exception path is committed
- [ ] Update `AGENTS.md` if any new stable patterns were introduced that differ from or extend what is already documented
