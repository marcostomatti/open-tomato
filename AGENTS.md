# AGENTS.md

This file defines the project-wide engineering guidance for agents working in this repository.

## Stack assumptions

Treat this project as a modern desktop app built with:

- TypeScript
- Electron
- React 19
- Radix UI
- Tailwind CSS
- Zustand

Confirmed direct dependencies (do not substitute alternatives):

- `electron-store` — typed persistent settings storage
- `keytar` — OS keychain credential storage (macOS Keychain, Windows Credential Manager, libsecret on Linux)
- `xterm.js` — terminal rendering for the Terminal canvas mode
- `electron-builder` — app packaging and signing

Candidate dependency (evaluate before committing — see `docs/ROADMAP-OVERVIEW.md`):

- `sandpack` (CodeSandbox) — in-sandbox React/JS execution for WebView mode

Related libraries that may appear in the codebase:

- `@dagrejs/dagre`
- `@xyflow/react`
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `tailwind-merge`

## Core principles

- Prefer clear module boundaries over convenience imports.
- Keep business logic outside React components.
- Keep Electron main-process code, preload code, and renderer code strictly separated.
- Default to small, composable modules with explicit inputs and outputs.
- Prefer predictable state transitions over ad hoc mutable state.
- Build UI from reusable primitives, not one-off page-local abstractions unless the scope is truly local.
- Optimize for maintainability first, then performance where measured or clearly necessary.

## TypeScript practices

- Use strict TypeScript and preserve soundness. Avoid `any` unless there is a hard external constraint.
- Prefer explicit domain types for app concepts instead of passing untyped objects through the app.
- Export types close to the module that owns the concept.
- Use discriminated unions for variant states and events.
- Prefer `unknown` over `any` for untrusted input, then validate and narrow.
- Keep function signatures narrow and explicit.
- Avoid boolean argument soup. Prefer named option objects when a function needs multiple flags.
- Prefer readonly data where mutation is not required.

## Module design

- Each module should have one clear responsibility.
- Keep side effects at the edge of the system.
- Separate these concerns when possible:
  - pure logic
  - IO/integration code
  - UI rendering
  - state orchestration
- Avoid cyclic dependencies. If two modules depend on each other, the boundary is wrong.
- Prefer feature-oriented modules over large shared utility buckets.
- Shared helpers should only exist when they serve multiple callers and have stable semantics.

## Electron architecture

Organize Electron code into three layers:

- `main`: app lifecycle, windows, menus, IPC handlers, filesystem or OS integration
- `preload`: minimal, audited bridge between main and renderer
- `renderer`: React UI, client-side state, presentation logic

Rules:

- Never import Electron main-process APIs directly into renderer code.
- Expose renderer capabilities through preload APIs, not through unrestricted `ipcRenderer`.
- Keep preload APIs small, typed, and task-oriented.
- Validate every IPC request in the main process, even if the renderer is trusted in normal usage.
- For commands (request-response): use `ipcMain.handle` in main and `ipcRenderer.invoke` in preload. Do not use `ipcMain.on` with manual `event.reply()` for new code.
- For push updates (main → renderer): use `webContents.send` in main and `ipcRenderer.on` in preload, exposed as a typed subscription function.
- Centralize IPC channel names and request/response types in `src/shared/ipc/`.

WebView implementation:

- Use `WebContentsView` exclusively for all sandboxed rendering panes. This is a resolved architectural decision.
- The `<webview>` tag is deprecated and must never be used anywhere in the codebase.

Canvas modes:

- The app has four switchable canvas modes: **Status** (React templates), **N8N** (embedded or WebContentsView wrap), **Terminal** (xterm.js, read-only), **WebView** (WebContentsView, sandboxed).
- Each mode is a self-contained feature unit. Adding a new mode means: registering it in the mode router, providing its tab label, and connecting its IPC surface.
- Do not implement mode-switching logic inside individual mode components. The canvas tab-switching shell is a standalone concern built before any mode.

## Agent communication interface

The app is passive. External orchestrators (N8N, scripts, Claude integrations) push commands to it. The app never reaches out to external services unprompted.

- A local WebSocket server runs in the main process. It must bind to `localhost` only by default and must never be exposed to a network interface accessible outside the machine.
- All incoming messages are structured JSON with a `type` field. Define all valid command types as a discriminated union in `src/shared/ipc/`. Route by `type` in a single dispatch function — do not scatter switch logic across handlers.
- Bidirectional: the app can emit structured events back to connected orchestrators (e.g. user interaction events from WebView content). Outbound events follow the same discriminated union convention.
- Optional auth: a shared secret token (configured in settings) may be required on connection. Validate it in the main process before processing any command.
- The WebSocket server is a main-process concern. Surface its state (connected / disconnected / client count) to the renderer as a typed IPC push subscription. Do not expose WebSocket access to the renderer directly.

## Security requirements

Assume Electron security matters by default.

- Enable `contextIsolation`.
- Disable `nodeIntegration` in renderer windows.
- Use a preload script with `contextBridge` to expose a minimal API surface.
- Do not expose raw filesystem, shell, or arbitrary IPC access to the renderer.
- Validate and sanitize all data crossing:
  - renderer to preload
  - preload to main
  - external input to app internals
- Treat file paths, URLs, and shell-like input as untrusted.
- Avoid `eval`, `new Function`, and unsafe HTML injection.
- Prefer React rendering over `dangerouslySetInnerHTML`. If HTML rendering is unavoidable, sanitize first.
- Restrict external navigation and new window behavior explicitly.
- Be deliberate about permissions for clipboard, notifications, file access, and deep links.
- Never store secrets in renderer state or expose them to the browser context unless strictly required.
- No privilege escalation, ever. The app runs entirely at user-level permissions. Do not add sudo prompts, UAC elevation requests, or any OS capability that requires elevated access. There is no exception path for this.
- Process spawning is allowlist-gated. The main process may only spawn binaries that appear on an explicit allowlist stored in settings. Reject and log any attempt to spawn a binary not on the list. This is enforced in the main process — it is a security requirement, not a runtime option.
- Apply strict Content Security Policy headers to all Electron windows explicitly. Do not rely on Electron defaults.
- Credentials and tokens are stored via `keytar` (OS keychain). Never write them to `electron-store`, to disk in plaintext, or pass them to the renderer process.
- WebView content is served from a local file server or data URI produced by the main process. Do not call `loadURL()` with an external URL unless that origin is on the user-configured allowlist. Validate allowlist membership in the main process before instructing any `WebContentsView` to load a URL.

## File and folder structure

Prefer a feature-oriented layout. A typical structure should look like:

```txt
src/
  shared/
    ipc/
  main/
    app/
    ipc/
    windows/
    ws/
    processes/
  preload/
    api/
    index.ts
  renderer/
    app/
    routes/
    screens/
    features/
    components/
    hooks/
    stores/
    lib/
    styles/
    types/
```

Guidelines:

- `shared/ipc/`: IPC channel names and request/response types shared between `main` and `preload`. This is the only location where cross-process contracts live.
- `main/ws/`: WebSocket server, command dispatch, and outbound event emitters
- `main/processes/`: child process spawning, lifecycle management, allowlist enforcement, and stdout/stderr streaming
- `screens/`: top-level route or window content containers
- `features/`: self-contained product areas with UI, hooks, logic, and tests together
- `components/`: shared presentation components and design-system wrappers
- `hooks/`: shared custom hooks used by more than one feature; feature-local hooks stay inside `features/`
- `stores/`: Zustand stores and selectors
- `lib/`: stable cross-feature helpers, adapters, and utilities
- `types/`: shared renderer-facing types only when ownership is genuinely cross-cutting
- Keep `main` and `renderer` types separate; the only sanctioned bridge is `shared/ipc/`

## Screen organization

- A screen should compose features and layout, not hold deep business logic.
- Keep data loading, mutations, and orchestration in feature hooks or controller modules.
- Screens should answer:
  - what data is needed
  - what major regions are displayed
  - what actions are available
- Avoid deeply nesting unrelated UI logic inside a single screen file.
- If a screen handles more than one major data concern or more than two distinct UI regions, split by region or feature boundary rather than by arbitrary helpers.

## Component organization

Prefer this layering:

- design-system primitives
- shared composed UI components
- feature-specific components
- screen composition

Guidelines:

- Keep components focused and single-purpose.
- Prefer controlled components for reusable UI primitives.
- Do not let presentational components reach into global state directly unless they are explicitly app-shell components.
- Co-locate feature-specific subcomponents with the feature.
- Promote a component to shared `components/` only after it proves reusable.
- Use Radix primitives for accessibility and interaction behavior, then wrap them with local styling and API conventions.
- Keep wrapper components thin; do not bury feature logic inside generic UI primitives.

## Styling practices

- Use Tailwind for styling and keep tokens consistent.
- Prefer utility composition over large bespoke CSS files.
- Extract repeated variant logic with `class-variance-authority` when a component has stable variants.
- Use `clsx` and `tailwind-merge` to build class names predictably.
- Avoid magic values; prefer Tailwind's built-in scale or values defined in `tailwind.config.ts`.
- Keep responsive behavior intentional; do not patch layouts with excessive breakpoint overrides.

## Radix UI practices

- Prefer Radix primitives for dialogs, tabs, tooltips, and other interactive building blocks.
- Preserve accessibility attributes and keyboard behavior provided by Radix.
- Wrap Radix components in local app components when styling or API normalization is repeated.
- Keep app-specific defaults in wrappers rather than repeating them at each call site.

## React 19 practices

- Prefer functional components and hooks.
- Keep render logic pure.
- Avoid unnecessary derived state. Compute from props or store state when possible.
- Use effects only for real side effects, not for ordinary data derivation.
- Keep state as local as possible before promoting it to a shared store.
- Prefer explicit event handlers and transitions over hidden side effects.
- Be careful with stale closures in async flows and subscriptions.
- Prefer suspense-compatible and concurrent-safe patterns by default.

## Zustand practices

- Use Zustand for cross-screen or cross-feature client state, not for every local UI toggle.
- Keep stores focused by domain.
- Prefer selectors to avoid broad rerenders.
- Keep actions in the store explicit and typed.
- Avoid putting non-serializable or unstable values in stores unless they are clearly lifecycle-bound and intentional.
- Do not mix server-derived data cache concerns into Zustand unless that is an explicit project decision.

## Graph and flow libraries

For libraries like `@xyflow/react` and `@dagrejs/dagre`:

- Keep layout algorithms and graph transformations outside components.
- Separate graph model building from graph rendering.
- Memoize expensive derived graph data only when measurement or clear render churn justifies it.
- Keep node and edge types explicit and versionable.

## Naming and file conventions

- Use clear, stable names based on domain meaning.
- Name files after the primary export or feature concept.
- Prefer one main export per file for feature modules.
- Use `index.ts` only for intentional public module boundaries, not as a default everywhere.
- Avoid vague names like `utils`, `helpers`, `misc`, or `manager` unless the scope is genuinely narrow and obvious.

## Testing expectations

- Test pure logic and state transitions directly.
- Test feature behavior at the boundary where users interact with it.
- Cover IPC contracts and preload APIs with focused tests where feasible.
- Add regression tests for bug fixes.
- Prefer a small number of meaningful tests over many brittle implementation-detail tests.

## Performance expectations

- Do not optimize blindly.
- Watch for unnecessary rerenders in large React trees and graph-heavy views.
- Use selectors, memoization, and virtualization where they solve a demonstrated problem.
- Keep expensive parsing, layout, and transformation work out of render paths.

## Experimental features

- Multi-window support is an experimental flag, off by default, with no dedicated QA or bug-fix prioritization. Do not design core architectural patterns around multi-window behavior.
- The multi-window flag is toggled via a settings entry or launch argument (`--experimental-multiwindow`). It must not appear in the main settings UI — it belongs in an explicitly labeled "Advanced / Experimental" section with a warning label.
- Do not write conflict-detection logic for indirect multi-window conflicts (e.g. two windows whose agent outputs write to the same path). The user accepts responsibility when enabling the flag.
- When any experimental flag is introduced, document it here and in the relevant feature module before the PR is merged.

## Change discipline

- Introduce patterns deliberately. Once a pattern exists, keep it consistent across the codebase.
- Document new patterns here in AGENTS.md as they stabilize, so future agents can follow them.
- Avoid partial migrations that leave multiple conflicting approaches in the same area.
- Keep diffs focused. Refactors should support a concrete outcome, not expand scope casually.
- Do not scaffold the full folder structure speculatively. Add directories as real features require them.
