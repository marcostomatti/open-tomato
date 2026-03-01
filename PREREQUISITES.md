# PREREQUISITES.md

## Required Tools

All tools listed here must be installed and available on `PATH` before executing any task in PLAN.md.

### Node.js

- Minimum version: 20.x LTS
- Rationale: Node.js 20 is the minimum runtime for Electron 30+ compatibility and provides npm 10 which is required for full workspace support
- Verify: `node --version`
- Recommended installation: `nvm` or `fnm` to allow per-project version pinning; a `.nvmrc` or `.node-version` file set to `20` should be added to the repository root as a follow-up

### npm

- Minimum version: 10.x
- Rationale: npm 10 introduced stable workspace query support and the `--include=workspace-root` flag; earlier versions have workspace bugs that affect hoisting behavior
- Verify: `npm --version`
- npm 10 is bundled with Node.js 20 and does not require a separate installation

### Git

- Minimum version: 2.x
- Verify: `git --version`
- The project root must be a git working directory before any task is executed; run `git init` if it is not already initialized

### TypeScript

- Installed as a root devDependency via `npm install` after `package.json` is authored; no global installation is assumed
- All `tsc` invocations use `npx tsc` or npm script delegates defined in the root `package.json`

## Environment Configuration

- No environment variables are required for scaffolding tasks
- No external services are required at this stage
- No CI secrets or GitHub tokens are required to create the `.github/workflows/` directory placeholder

## Operating System Notes

### Windows

- Set `git config core.autocrlf false` globally or per-repository before the first commit to prevent git from converting LF to CRLF, which would conflict with the `.editorconfig` and `.prettierrc` line ending configuration
- Verify that the shell used to run `npm` commands (PowerShell, Git Bash, or WSL2) resolves `node` and `npm` from the same Node.js installation
- WSL2 is a supported development environment and avoids most Windows-specific path and line ending issues

### macOS

- No additional configuration is required beyond the tooling listed above
- The `.DS_Store` entry in `.gitignore` is specifically relevant on macOS

### Linux

- No additional configuration is required for scaffolding tasks
- Note for later development stages: `keytar` requires `libsecret` at the native module compilation step; on Debian or Ubuntu this is `sudo apt install libsecret-1-dev`; this is not needed for scaffolding

## Not Required at This Stage

- Electron: not installed during scaffolding; added as a dependency when the main process entry point is implemented
- `electron-builder`: not needed until the packaging and signing stage
- Code signing certificates or notarization credentials: not needed until distribution is configured
- Any cloud service credentials or API tokens
