# Canvas App — Product Roadmap
**Electron Desktop Application | AI Agent Output Surface**

---

## Product Vision

A lightweight, secure Electron desktop app that acts as the visual output surface for AI-orchestrated workflows. It sits alongside tools like N8N, Claude, or any agent runtime — receiving structured render commands and displaying them in a sandboxed environment. No god-mode permissions. No arbitrary code execution. A trusted window into what your agents are doing and building.

---

## Architectural Principles

- **Least privilege by design** — the app never requests admin/sudo. All child processes run at user-level permissions only. No privilege escalation paths.
- **Sandboxed renderer** — the canvas WebView runs in an isolated context (Chromium sandbox enabled, nodeIntegration off, contextIsolation on). Extensions, plugins, and external network calls are blocked by default.
- **Agent-agnostic** — the app doesn't care whether instructions come from N8N, OpenClaw, a custom script, or a Claude integration. It exposes a local interface (WebSocket/IPC) that any orchestrator can talk to.
- **No secrets in the renderer** — API keys, tokens, and credentials live only in the main process and settings store. The WebView never sees them.
- **Electron main/renderer separation strictly enforced** — all privileged operations (filesystem, settings, process management) happen in the main process only, exposed to the renderer via a narrow, explicitly defined preload API.

---

## App Layout Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Left Panel        │  Canvas / Output Area                        │
│  ──────────────    │  ────────────────────────────────────────── │
│  • Nav links       │  [Mode tabs: Status | N8N | Terminal | Web] │
│  • Running tasks   │                                              │
│  • Task history    │  [Canvas content renders here]               │
│  • Settings btn    │                                              │
│                    │  [Error toasts / debug notifications]        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Reference Implementations

These are open source, production-quality projects that serve as golden standards for specific subsystems. We study their architecture, borrow their patterns, and in some cases use them directly as dependencies. We don't reinvent what they've already solved well.

| Subsystem                           | Reference Project                                                                             | Why It Matters                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Terminal / STDIO display**        | [Warp](https://github.com/warpdotdev/warp) — Electron-based AI terminal                       | Gold standard for terminal UX, ANSI rendering, and AI-alongside-terminal patterns. Not a dependency — a design reference                         |
| **Terminal rendering library**      | [xterm.js](https://github.com/xtermjs/xterm.js)                                               | The de facto Electron terminal renderer. Used by VS Code, Hyper, and Warp itself. Direct dependency for Mode C                                   |
| **Sandboxed snippet runner**        | [RunJS](https://runjs.app) — Electron JS/TS scratchpad                                        | Blueprint for how to run untrusted code in a sandboxed Electron context with safe output display. Study their IPC and process isolation approach |
| **Sandboxed multi-language runner** | [Sandpack](https://github.com/codesandbox/sandpack) (CodeSandbox)                             | In-browser sandboxed code execution for JS/TS/React. Potential direct dependency for Mode D when rendering agent-generated frontend code         |
| **WebView / browser pane**          | [Browserosaurus](https://github.com/nicholasgillard/browserosaurus) — Electron browser picker | Simple, clean example of `WebContentsView` usage in production Electron. Reference for correct non-deprecated WebView implementation             |
| **App shell & sidebar patterns**    | [Hyper](https://github.com/vercel/hyper) — Electron terminal                                  | Well-structured Electron app with plugin system and sidebar. Reference for main/renderer separation and preload API patterns                     |
| **IPC bridge pattern**              | [VS Code](https://github.com/microsoft/vscode)                                                | The most mature example of strict Electron main/renderer IPC separation at scale. Reference for preload API design, not a dependency             |
| **Settings / config storage**       | [electron-store](https://github.com/sindresorhus/electron-store)                              | Standard for typed, persistent settings in Electron apps. Direct dependency                                                                      |
| **Secure credential storage**       | [keytar](https://github.com/atom/node-keytar)                                                 | OS keychain integration (macOS Keychain, Windows Credential Manager, libsecret on Linux). Direct dependency for token storage                    |
| **Status / workflow display**       | [Inngest Dev Server UI](https://github.com/inngest/inngest)                                   | Open source workflow execution UI with live step status. Reference and potential embed for Mode A status templates                               |
| **Queue / job display**             | [BullMQ Board](https://github.com/felixmosh/bull-board)                                       | Embeddable React component for job queue visualization. Candidate first-class embed for Mode A                                                   |

---

## Epics

---

### Epic 0 — Developer Foundation & Self-Documenting Architecture

**Overview**
Before any product code is written, establish the documentation system, code conventions, and knowledge structure that will govern the entire project. The goal is not just to document for human developers — it's to structure the codebase and its documentation so that an AI assistant working on the project (Claude Code, Cursor, or similar) can understand the full context of any module, make correct decisions about where new code belongs, and extend the app without breaking established patterns.

This is the foundation that makes the app eventually capable of reasoning about and improving itself.

**Scope**

*Repository structure & conventions*
- Define and document the monorepo or package structure upfront. Main process, renderer, preload, shared types, and modes each live in clearly named directories with a `README.md` explaining what belongs there and what doesn't
- ESLint + Prettier config locked in from day one. No exceptions without a documented reason
- TypeScript strict mode enabled. All public interfaces fully typed. No `any` without a suppression comment explaining why

*CLAUDE.md — the AI context file*
- A `CLAUDE.md` file at the root (and per major subdirectory) written specifically for AI coding assistants. It explains: what this module does, what patterns it follows, what it must never do, and what the correct way to extend it is
- This is not a README. It's a machine-readable contract. Written in plain language but structured so an LLM can parse it as authoritative context
- Updated as a required step whenever a new pattern or architectural decision is introduced — not after the fact

*Architecture Decision Records (ADRs)*
- Every significant architectural decision gets an ADR in `/docs/adr/`. Short format: context, decision, consequences, alternatives considered
- ADRs are numbered and immutable once merged. If a decision is reversed, a new ADR supersedes the old one — the history is preserved
- The ADR index is referenced in `CLAUDE.md` so any AI assistant working on the project knows to consult it before proposing architectural changes

*Module contracts*
- Every module (main process service, renderer component, IPC handler) has a brief header comment block defining: its single responsibility, its inputs/outputs, and what it must never depend on
- This is enforced in code review, not just convention — PRs that violate a module's stated contract require an ADR or a contract update

*Pattern library*
- A `/docs/patterns/` directory with short markdown files documenting recurring implementation patterns: how we handle IPC, how we register a new canvas mode, how we add a settings field, how we spawn a child process safely
- Each pattern file includes a minimal working example in TypeScript
- When a new pattern is established in implementation, the pattern doc is written before the PR is merged

*Onboarding document*
- A `ONBOARDING.md` that lets a new developer (or an AI assistant starting a fresh session) get from zero to running in under 30 minutes. Covers: prerequisites, how to run in dev mode, how the process architecture works, where to find things, and what the three things you must never do are

*Self-extension guide*
- A `EXTENDING.md` that documents how to add: a new canvas mode, a new status template, a new IPC command, a new settings field. Each with a checklist of files to touch and tests to write
- This document is the authoritative guide for agents or developers extending the app without deep context. It is kept current as a merge requirement

**Use cases**
- A developer joins the project and reads `ONBOARDING.md` — they can run the app and understand the architecture in under an hour without asking anyone
- Claude Code is pointed at the repo to add a new canvas mode — it reads `CLAUDE.md` and `EXTENDING.md`, follows the established pattern, and produces a PR that doesn't violate any module contracts
- An architectural decision is revisited six months later — the ADR explains why it was made, what was considered, and what the tradeoffs were, saving the team from re-litigating settled ground
- A new IPC command type is needed — a developer follows the pattern doc, writes the command, updates `EXTENDING.md`, and opens a PR. The pattern doc is updated before merge, not after

---

### Epic 1 — Electron Shell & Security Foundation

**Overview**
The host application. Sets up the Electron process architecture, enforces sandboxing rules, and defines the security model everything else builds on. This is not optional MVP scope — the constraints here are foundational and cannot be retrofitted later.

**Reference implementations:** [Hyper](https://github.com/vercel/hyper) (clean Electron app structure and IPC patterns), [VS Code](https://github.com/microsoft/vscode) (main/renderer separation and preload API design at scale — reference only, not a dependency)

**Scope**
- Electron main process bootstrapping with strict CSP headers on all windows
- WebView/BrowserView configured with Chromium sandbox enabled, `nodeIntegration: false`, `contextIsolation: true`, extensions disabled, no external network by default
- Preload script defining the narrow IPC bridge between renderer and main process — the only surface renderers can use to request privileged operations
- App starts and runs entirely at user-level permissions. No sudo prompts, no UAC elevation requests, no capabilities that require elevated access
- Auto-update mechanism (optional for v1, but architecture must not preclude it)
- App packaging and signing for macOS and Windows

**Use cases**
- Developer installs the app, runs it, and it never asks for admin rights
- A sandboxed WebView renders untrusted HTML — if it tries to access the filesystem or make external requests, those are blocked silently and logged

---

### Epic 2 — Left Panel (Navigation & Task Overview)

**Overview**
The persistent left sidebar that gives the user situational awareness — what's running, what ran, and access to settings. Think of it as the app's control tower, not a feature panel.

**Scope**
- Fixed sidebar with icon + label navigation links to main app sections
- **Running tasks list** — live list of active agent tasks/workflows being executed, with status indicators (running, waiting, completed, failed)
- **Task history** — recent completed tasks with timestamp and outcome, clickable to review output
- **Settings button** — opens the settings page (see Epic 6)
- Sidebar state persists across sessions (collapsed/expanded, last active section)
- Tasks are pushed to the sidebar by the orchestration layer via the local IPC/WebSocket interface — the app doesn't poll, it receives

**Use cases**
- User glances at the sidebar and sees 2 workflows running and 1 failed
- User clicks a failed task to jump to its terminal output
- User collapses the sidebar to give more space to the canvas

---

### Epic 3 — Canvas Output Area (3-Mode Panel)

**Overview**
The main content area. A single panel with three switchable display modes. Each mode is purpose-built for a different type of agent output. The agent or orchestrator can request a mode switch programmatically, or the user can switch manually.

---

#### Mode A — Status View (Structured Display)

**Overview**
A React-rendered structured display built from pre-defined templates. Shows what's happening in a human-readable, visually organized way — not raw text, not a webview, but a curated view of agent activity.

**Reference implementations:** [BullMQ Board](https://github.com/felixmosh/bull-board) (embeddable job queue UI, candidate first-class embed), [Inngest Dev Server UI](https://github.com/inngest/inngest) (workflow step display reference)

**Scope**
- Pre-built React component templates for common status displays: step-by-step task progress, action lists, workflow stage indicators
- Explore other standard embeddable status/activity widgets (e.g. Inngest, Temporal UI, BullMQ board) and define which ones are worth supporting as first-class embeds
- Template system: orchestrator sends a template ID + data payload, the panel renders the appropriate React component
- Templates are extensible — new templates can be added without changing the core app

**Use cases**
- Agent is performing a multi-step research task; Status panel shows a checklist ticking off as each step completes
- Orchestrator pushes a structured payload; the panel renders a card layout with action items and their statuses

---

#### Mode B — N8N Workflow View

**Overview**
A dedicated mode for displaying N8N workflow execution. Two implementation strategies are supported — embedded components if N8N exposes them, or a wrapped WebView pointing at the N8N GUI. The app doesn't pick one strategy permanently; this is configurable based on how the user has N8N deployed.

**Scope**
- **Strategy 1 — Embedded:** if N8N exposes embeddable React components or a widget API, integrate them directly. Renders workflow graph, active node highlight, and execution log inline without a full browser context
- **Strategy 2 — WebView wrap:** load the N8N web UI in a BrowserView/WebContentsView pointed at the user's configured N8N instance URL (local or remote). Strips browser chrome. Subject to N8N's own auth
- Strategy is selected in settings based on N8N deployment type — local self-hosted vs. cloud vs. embedded
- Connection status indicator (is N8N reachable at the configured URL/port)
- Read-only intent — the mode is for observation, not for building or editing workflows. If the user needs to edit, they open N8N directly

**Use cases**
- User has N8N running locally; the panel connects and shows the currently executing workflow with live node status
- User has N8N cloud; they configure the URL and token in settings; the WebView wraps it with auth headers
- N8N goes offline mid-session; the panel shows a disconnected state rather than a blank or crashed view

---

#### Mode C — Terminal Output (Read-Only STDIO)

**Overview**
A non-interactive terminal display for log-based and script output. Think of it as `tail -f` rendered nicely — the user watches, but cannot type. UX and rendering patterns are drawn from Warp and Hyper; the rendering library is xterm.js (same library used by VS Code and Hyper).

**Reference implementations:** [xterm.js](https://github.com/xtermjs/xterm.js) (direct dependency), [Warp](https://github.com/warpdotdev/warp) (UX reference), [Hyper](https://github.com/vercel/hyper) (Electron integration pattern)

**Scope**
- Read-only terminal emulator (xterm.js is the obvious candidate) receiving STDIO streams from processes spawned by the main process
- Supports ANSI color codes and basic formatting
- Auto-scrolls to bottom on new output, with a "pause scroll" toggle if the user wants to read
- Copy-to-clipboard on selection
- Clear button to wipe the current output buffer
- Process label shown in the header (what's currently being piped in)
- Multiple processes can queue — tab or dropdown to switch between active streams

**Use cases**
- N8N executes a Python script; its stdout/stderr streams into the terminal panel in real time
- A build or test runner is triggered by an agent; the user watches the output without needing a separate terminal window

---

#### Mode D — WebView (Sandboxed Mini Browser)

**Overview**
A sandboxed WebView that renders whatever the agent produces — HTML apps, dashboards, forms, generated UIs. The most powerful and the most security-sensitive mode. Uses Electron's `WebContentsView` (the current non-deprecated API), not the legacy `<webview>` tag. For rendering agent-generated frontend code, [Sandpack](https://github.com/codesandbox/sandpack) is the candidate library for in-sandbox React/JS execution. Browserosaurus is the reference for correct `WebContentsView` usage patterns.

**Reference implementations:** [Sandpack](https://github.com/codesandbox/sandpack) (candidate dependency for in-sandbox code execution), [Browserosaurus](https://github.com/nicholasgillard/browserosaurus) (WebContentsView pattern reference), [RunJS](https://runjs.app) (sandboxed runner UX reference)

**Scope**
- `WebContentsView`-based renderer with Chromium sandbox enforced, all extensions disabled, no browser chrome, no navigation bar
- Renders content from: local sandbox origin only (no arbitrary external URLs by default), or an explicit allowlist configured in settings
- Debug tooling: toast notification system for runtime errors (JS exceptions, failed network requests, CSP violations). Full console log drawer available in dev mode via settings toggle
- Content is loaded via a local file server or data URI served by the main process — never by navigating to an external URL directly unless explicitly permitted
- DevTools access available via keyboard shortcut, gated behind the dev mode settings toggle (off by default in production builds)

**Use cases**
- Agent generates a React dashboard; it's compiled and served locally; WebView renders it
- Agent builds an HTML form for user input; user fills it in the WebView; submission is captured and sent back to the orchestrator
- Rendered content throws a JS error; a toast notification appears with the error message and line reference

---

### Epic 4 — Agent Communication Interface

**Overview**
The local interface that orchestrators (N8N, scripts, Claude integrations, etc.) use to send commands to the canvas. The app is passive — it doesn't reach out to agents, agents reach into it.

**Scope**
- Local WebSocket server running on a configurable port (default: localhost only, never exposed to network)
- Command schema: structured JSON messages with a `type` field routing to the appropriate handler (e.g. `set_mode`, `render`, `append_log`, `push_task`, `clear`)
- Authentication: optional shared secret token (configured in settings) to prevent other local processes from accidentally or maliciously writing to the canvas
- Bidirectional: the app can emit events back to connected orchestrators (user clicked a button in WebView, task acknowledged, etc.)
- Connection status indicator visible somewhere in the UI (connected / disconnected / N clients)

**Use cases**
- N8N workflow hits a node that sends a WebSocket message to the app; the canvas switches to Terminal mode and starts streaming logs
- Agent finishes building a UI; sends a `render` command with HTML content; WebView loads it
- User clicks a button rendered in the WebView; the app emits a `user_action` event back to the connected orchestrator

---

### Epic 5 — Process & Execution Management

**Overview**
The main process capability to spawn, monitor, and stream child processes — the plumbing behind Terminal mode and any agent-triggered execution.

**Scope**
- Spawn child processes (scripts, binaries, CLI tools) at user-level permissions only — explicit checks to prevent privilege escalation
- Capture stdout/stderr and pipe to the Terminal panel via IPC
- Process lifecycle management: start, kill, status tracking
- Configurable allowed executables — the app only spawns binaries that are on an explicit allowlist defined in settings (security measure)
- Process isolation: each spawned process is its own child, not sharing memory with the renderer

**Use cases**
- Orchestrator sends a command to run a Python script at a given path; main process spawns it, streams output to Terminal panel
- User kills a runaway process from the task list in the left panel
- App refuses to execute a binary not on the allowlist and logs the attempt

---

### Epic 6 — Settings Page

**Overview**
A dedicated settings screen accessible from the left panel. Handles all configuration that varies per user/environment. Not a modal — a full page within the app.

**Reference implementations:** [electron-store](https://github.com/sindresorhus/electron-store) (direct dependency for typed persistent settings), [keytar](https://github.com/atom/node-keytar) (direct dependency for OS keychain credential storage)

**Scope**
- **Paths & binaries** — configurable paths to required executables (Node, Python, any other runtime dependencies). Validated on entry with a live status indicator (found / not found / wrong version)
- **Integration tokens** — secure input fields for API keys and tokens needed by integrations (stored in OS keychain via `keytar` or equivalent, never in plaintext on disk)
- **WebSocket server config** — port number, optional auth token, localhost-only toggle
- **WebView allowlist** — list of domains/origins the WebView is permitted to load content from
- **Allowed executables** — the list of binaries the app is permitted to spawn
- **Dev mode toggle** — enables DevTools access in WebView, more verbose logging
- **Appearance** — light/dark/system theme
- Settings are saved immediately on change (no save button needed for simple fields), with a reset-to-defaults option

**Use cases**
- First-run experience: user opens settings, sets Python path, adds their N8N webhook token, sets the WebSocket port
- User adds a new domain to the WebView allowlist so an agent can render content from a local dev server
- User rotates an API token — they paste the new one in the masked field and it updates in the keychain

---

## Suggested Phasing

| Phase                            | Epics                          | Goal                                                                                         |
| -------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| **Stage 0 — Foundation**         | Epic 0                         | Docs system, CLAUDE.md, ADRs, pattern library, EXTENDING.md in place before any product code |
| **Stage 1 — Shell**              | Epic 1 + Epic 6 (partial)      | Electron shell runs, sandboxing enforced, basic settings page                                |
| **Stage 2 — Core Loop**          | Epic 4 + Epic 3 (Mode C first) | Orchestrator connects, streams logs to Terminal panel (xterm.js)                             |
| **Stage 3 — Visual Output**      | Epic 3 (Mode D) + Epic 5       | WebContentsView renders agent-built content; process spawning works                          |
| **Stage 4 — N8N Integration**    | Epic 3 (Mode B)                | N8N panel — spike embedded vs WebView wrap, implement chosen path                            |
| **Stage 5 — Structured Display** | Epic 3 (Mode A) + Epic 2       | Status panel with templates (BullMQ Board, Inngest embeds); left panel task list             |
| **Stage 6 — Polish**             | Full Epic 6 + hardening        | Settings complete; security audit; packaging and signing                                     |

---

## Architectural Decisions (Resolved)

**WebView implementation:** `WebContentsView` only. The legacy `<webview>` tag is deprecated and will not be used anywhere in the codebase. All sandboxed rendering goes through `WebContentsView`.

**N8N display:** Own dedicated mode (Mode B), separate from the generic Status view. Implementation strategy (embedded components vs. WebView wrap) is determined per-deployment based on how N8N is hosted, and is configurable in settings.

**Multi-window support:** Supported as a runtime/settings flag, marked as **experimental**. Behavior:
- The flag can be toggled in settings or passed at launch (`--experimental-multiwindow`)
- When enabled, additional windows can be opened without crashing
- Direct conflicts are blocked where detectable (e.g. two windows opening the same project file will be rejected with an error)
- Indirect conflicts (two windows whose agent outputs happen to write to the same path) are **not guaranteed to be detected** — this is documented, and the user accepts responsibility when enabling the flag
- The feature receives no active QA or dedicated bug fixing. Issues filed against multi-window behavior while the flag is experimental will be triaged but not prioritized
- The flag defaults to off. It does not appear in the main settings UI — it lives in an "Advanced / Experimental" section with a clear warning label

---

## Open Questions (Remaining)

1. **N8N embed feasibility** — does N8N expose embeddable React components or a widget API, or is iframe-wrapping the only option? Needs a spike before Mode B detailed planning.
2. **Template format for Status mode** — JSON data payload + React component ID, or something more expressive? Decide before Mode A implementation.
3. **Local file server for WebView** — serve content on a random localhost port, or use a custom app:// protocol handler? Custom protocol is cleaner but has more setup overhead.