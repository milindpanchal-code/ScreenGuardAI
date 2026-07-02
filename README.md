# ScreenGuard AI

ScreenGuard AI is a Manifest V3 Chrome extension that performs camera-based posture monitoring locally in the browser. Camera frames are processed by a bundled MediaPipe face-landmarker model and are never uploaded.

## Architecture

- `apps/extension/src/popup`: compact extension controls and status.
- `apps/extension/src/options`: settings and local statistics views.
- `apps/extension/src/content`: the singleton floating-preview controller injected into one active tab.
- `apps/extension/src/preview-frame`: extension-owned camera and inference runtime.
- `apps/extension/src/background`: lightweight notification and tab-lifecycle service worker.
- `apps/extension/src/features`: domain storage, schemas, monitoring policy, and React hooks.
- `packages/vision`: posture classification and the MediaPipe engine adapter.

The website-facing content script never receives camera frames. The extension-owned preview frame sends only posture estimates to the content controller. Aggregated scores and warning events are sent to the service worker and stored with `chrome.storage.local`.

## Development

```bash
npm install
npm run build
```

Load `apps/extension/dist` as an unpacked extension from `chrome://extensions`.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run format:check
npm run build
```

The build copies the local model and MediaPipe WASM runtime into the extension package. No runtime network access is required.
