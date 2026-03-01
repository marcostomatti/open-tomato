# src/renderer

## Single Responsibility

This package owns the renderer process — the browser-like environment that displays the application UI. It is responsible for:

- **React component tree** — all JSX and UI component rendering; components are built from Radix UI primitives styled with Tailwind CSS
- **Client-side Zustand state** — cross-feature and cross-screen application state managed through focused domain stores in `renderer/stores/`
- **Presentation logic** — event handlers, derived display values, and component-level state that does not need to cross a process boundary
- **In-window routing** — navigation between screens and views within the renderer window; the routing shell is a standalone concern separate from individual screen implementations

## Explicit Exclusions

The following must never appear in this package:

- **No Electron main-process API imports** — `BrowserWindow`, `app`, `ipcMain`, `Menu`, `shell`, and all other Electron main-process APIs are not available in the renderer and must not be imported
- **No Node.js built-in imports** — `fs`, `path`, `child_process`, `os`, `net`, `crypto`, and any other Node.js core module must not be imported; the renderer is a browser context, not a Node.js context
- **No direct WebSocket client** — the renderer must not open a WebSocket connection directly; WebSocket communication with external orchestrators is the main process's responsibility, surfaced to the renderer through typed IPC subscriptions
- **No filesystem access** — reading or writing files must not happen in renderer code; all filesystem operations are delegated to the main process via the preload API

All cross-process capability — IPC invocations, filesystem operations, OS integration, credential access, child process management — is accessed exclusively through the typed API surface that the preload script exposes on `window` (e.g. `window.api`).

## Security Context

All renderer windows run with:

- **`contextIsolation: true`** — the renderer JavaScript context and the preload script context are isolated; preload globals are not directly accessible from renderer code unless explicitly exposed through `contextBridge`
- **`nodeIntegration: false`** — Node.js APIs are not available in the renderer; any attempt to use `require()` or Node built-ins will fail at runtime

These settings are not optional. They are active for every renderer window and must not be changed.

## IPC Contracts

The renderer interacts with the main process only through the `window` object properties exposed by the preload script. Type definitions for those APIs live in `src/shared/ipc/` and are imported via the `@shared/ipc` path alias.

```ts
// Correct — use the typed API surface exposed by the preload script
const result = await window.api.openFile({ path: '...' });

// Wrong — never import Electron or Node.js modules directly
import { ipcRenderer } from 'electron';
import fs from 'fs';
```
