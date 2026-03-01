# PREREQUISITES.md

## Required before executing the plan

### Node.js and package manager

- Node.js 20 or later must be installed and available on `PATH`
- `npm` version 10 or later (bundled with Node 20) must be available
- The project must already have a `package.json` at the repository root

### Repository state

- The repository must be initialized as a git repository (`git init` must have been run)
- At least one commit must exist in the repository so that Husky can attach hooks correctly; Husky requires a valid git history to install
- The `src/` directory structure (`src/main`, `src/preload`, `src/renderer`, `src/shared`) must exist or be scaffolded before per-directory tsconfig files and ESLint overrides are verified

### Environment

- No special environment variables are required for this toolchain setup
- No external credentials or secrets are required
- The developer machine must have write access to the repository root to create config files

### CI environment

- The CI runner must execute `npm ci` (or `npm install`) before running lint, typecheck, or format check commands so that all dev dependencies are present
- The CI runner must have Node.js 20 or later available in its base image or tool cache
- No additional secrets or service accounts are needed for linting and typechecking

### Optional but recommended

- An editor integration for ESLint and Prettier (e.g. VS Code extensions `dbaeumer.vscode-eslint` and `esbenp.prettier-vscode`) is not required by the plan but improves the developer experience
- A `.editorconfig` file aligned with the Prettier settings (2-space indent, single quotes where applicable) prevents editor-level noise in diffs; this is outside the scope of this plan but is a recommended follow-on
