# src/preload

## Single responsibility

This package is the minimal, audited bridge between the Electron main process and the renderer.

All code here is implemented using `contextBridge.exposeInMainWorld`. It exposes:

- **Typed command functions** — task-oriented wrappers around `ipcRenderer.invoke` that map to a single IPC channel and return a typed `Promise`.
- **Typed push-subscription wrappers** — listeners registered with `ipcRenderer.on` that accept a typed callback, return an unsubscribe function, and never expose the underlying `IpcRendererEvent` to the renderer.

Every exported API object is mounted once on `window` under a stable, namespaced key (e.g. `window.electronAPI`).

## Explicit exclusions

- **No business logic.** Preload must not transform, derive, or make decisions about data. It forwards typed, validated inputs and passes typed responses back unchanged.
- **No UI rendering.** No React, no JSX, no DOM manipulation.
- **No broad IPC forwarding.** There must be no generic `invoke(channel, ...args)` or `on(channel, handler)` passthrough. Every channel is named explicitly in a dedicated wrapper function.
- **No exposure of raw Electron internals.** `ipcRenderer`, `shell`, `remote`, `webFrame`, and all other Electron APIs are never exposed on `window`. Only the typed API surface defined here reaches the renderer.

## Security constraints

1. Every function exposed through `contextBridge` must carry a **narrow, explicit TypeScript signature**. No parameter may be typed as `any` or `unknown` without an immediate runtime narrowing step.
2. Every function must **validate its arguments** (type, shape, and range where relevant) before forwarding to main. Reject invalid input with a thrown `TypeError` — do not forward it.
3. Push-subscription wrappers must **never leak `IpcRendererEvent`** to the renderer callback. Strip it before invoking the callback.
4. Channel name strings are imported from `@shared/ipc` and must not be defined inline here.
5. Type definitions for request payloads and response shapes are imported from `@shared/types` or `@shared/ipc` — not redeclared locally.
