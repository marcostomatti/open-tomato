# src/main

## Single Responsibility

This package owns the Electron main process. It is responsible for:

- **App lifecycle** — responding to `app.ready`, `app.before-quit`, and related Electron app events
- **`BrowserWindow` creation and management** — constructing windows with correct `webPreferences`, attaching the preload script, and controlling window state
- **Native menus** — building and registering application menus and context menus via Electron's `Menu` API
- **`ipcMain.handle` request handlers** — receiving typed invocations from the renderer via preload and returning typed responses; all handlers are registered in the `main/ipc/` subdirectory
- **OS integration** — deep link handling, dock/taskbar badges, system notifications, and any other native OS surface
- **WebSocket server** — a local command server that binds exclusively to `localhost`; it receives structured JSON commands from external orchestrators and emits structured events back; binding, dispatch, and outbound emission live in `main/ws/`
- **Child process spawning** — launching external binaries through the allowlist enforced in `main/processes/`; any spawn request for a binary not on the allowlist is rejected and logged

## Explicit Exclusions

The following must never appear in this package:

- **No React or JSX** — zero `.tsx` files, zero `import React` statements, no JSX syntax
- **No DOM API usage** — `document`, `window`, `navigator`, and any browser global are not available and must not be referenced
- **No imports from `src/renderer`** — the main process must not depend on renderer code; the dependency is one-way (renderer → preload → main)
- **No business logic that belongs inside a renderer feature** — view-layer concerns such as routing, component state, or presentation logic must not live here

## IPC Contracts

All IPC channel name strings and all request/response payload type definitions are imported from `@app/shared/ipc`.

```ts
// Correct
import { CHANNEL_OPEN_FILE, type OpenFileRequest } from '@app/shared/ipc';

// Wrong — never define channel names or payload types inline
ipcMain.handle('open-file', ...);
```

Inline channel name literals and inline payload interfaces are forbidden. The `@app/shared/ipc` module is the single source of truth for cross-process contracts.
