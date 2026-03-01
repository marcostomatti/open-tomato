# PREREQUISITES.md

## Required Tooling

The following tools must be installed and available on `PATH` before executing any task in PLAN.md.

### Node.js

- Version: 20.x LTS or later (20 is the minimum for Electron 30+ compatibility)
- Verify: `node --version`
- Install via: `nvm`, `fnm`, or direct download from nodejs.org

### npm

- Version: 10.x or later (required for workspaces `--include=workspace-root` flag support)
- Verify: `npm --version`
- Bundled with Node.js 20; no separate install needed

### TypeScript

- Installed as a root dev dependency via `npm install` after `package.json` is created
- No global TypeScript installation is required or assumed
- The `tsc` binary is accessed via `npx tsc` or npm scripts

### Git

- Version: 2.x or later
- Verify: `git --version`
- The repository must be initialized (`git init`) before the first commit

## Environment Assumptions

- The working directory is the repository root throughout all tasks
- No environment variables are required for scaffolding tasks
- No external services, credentials, or network access are required at this stage
- Line endings on the host machine should be set to LF or the developer must configure `git` with `core.autocrlf = false` (Windows) to avoid `.editorconfig` and `.gitignore` conflicts

## Recommended Editor Setup

- An EditorConfig-compatible editor (VS Code with EditorConfig extension, or JetBrains IDEs with built-in support) to validate `.editorconfig` behavior on save
- ESLint and Prettier editor extensions for early feedback during file creation

## Notes

- Electron is not installed at this stage. It becomes a dependency in a subsequent task when the main process is wired up.
- No CI secrets or GitHub tokens are required to create the `.github/workflows/` directory stub.
