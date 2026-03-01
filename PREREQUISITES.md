# PREREQUISITES.md

## Required Tooling

All tools listed here must be installed and available on `PATH` before any task in PLAN.md is executed.

### Node.js

- Minimum version: 20.x LTS
- Rationale: Node 20 is the minimum for Electron 30+ compatibility and for npm 10 workspace features
- Verify with: `node --version`
- Recommended installation method: `nvm` or `fnm` for version management

### npm

- Minimum version: 10.x
- Rationale: npm 10 introduced `--include=workspace-root` and workspace query improvements relied on in this setup
- Verify with: `npm --version`
- npm 10 is bundled with Node.js 20; no separate installation is required

### Git

- Minimum version: 2.x
- Verify with: `git --version`
- The repository root must be a git working directory before the first task is executed
- On Windows, configure `git config core.autocrlf false` globally or per-repository to prevent LF-to-CRLF conversion that would conflict with the `.editorconfig` and `.prettierrc` line ending settings

### TypeScript

- Installed as a root workspace dev dependency via `npm install` after `package.json` is authored; no global installation is assumed or required
- All `tsc` invocations use `npx tsc` or npm script delegates

## Environment Configuration

- No environment variables are required for scaffolding tasks
- No external services, APIs, or credentials are required at this stage
- No CI secrets are needed to create the `.github/workflows/` directory stub

## Operating System Notes

### macOS

- No additional setup required beyond the tooling above
- `.DS_Store` exclusion in `.gitignore` is relevant here and is included in the plan

### Windows

- Ensure `core.autocrlf` is set to `false` in git configuration before the first commit to avoid line ending conflicts
- Verify that the shell used to run `npm` commands (PowerShell, Git Bash, or WSL2) resolves `node` and `npm` from the same installation
- WSL2 is a supported development environment and avoids most Windows-specific path and line ending issues

### Linux

- `libsecret` must be installed on the host for `keytar` to function in later development stages; it is not required for scaffolding tasks
- Verify with: `pkg-config --libs libsecret-1` (Debian/Ubuntu: `sudo apt install libsecret-1-dev`)

## Editor Setup (Recommended)

- An EditorConfig-compatible editor is recommended to validate `.editorconfig` behavior during file authoring (VS Code with the EditorConfig extension, or any JetBrains IDE with built-in EditorConfig support)
- ESLint and Prettier editor extensions should be configured to use the workspace-local installations, not globally installed versions, to avoid version mismatch

## Not Required at This Stage

- Electron is not installed during scaffolding; it becomes a dependency when the main process entry point is wired up in a subsequent task
- No signing certificates, notarization credentials, or `electron-builder` configuration is needed until the packaging stage
- No GitHub Actions secrets or tokens are needed to create the workflows directory placeholder
