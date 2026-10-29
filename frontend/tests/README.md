# Responsive kiosk browser checks

Start Vite with `npm run dev`, then run from `frontend` using an installed Playwright module and Google Chrome:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/kiosk-responsive.mjs
```

Omit `PLAYWRIGHT_MODULE` if `playwright` is available through normal Node resolution. `KIOSK_URL` overrides `http://localhost:5173`; `KIOSK_SCREENSHOTS` optionally saves screenshots to a directory. All `/api/` requests are mocked: these checks do not create real orders or payments. Tests cover viewport sizing, fluid typography, dialog overflow, recommendation navigation, checkout/QR, long mixed-shipping carts, idle/wakeup, and kiosk style cleanup on login.

For the advertisement-management inactivity setting, run `node tests/screensaver-idle.mjs` with the same environment variables. It checks the four-minute fallback, admin save/reload and validation, configured idle timing, activity reset, and live config refresh. It uses a fake admin session, mocked API responses, and a virtual clock; it does not write to a real database.

`node tests/screensaver-media.mjs` exercises real-size portrait, landscape and tall-poster fixtures across eight viewports, checking that ads, shopping and featured products remain inside the screen. `node tests/screensaver-video.mjs` creates short silent clips in Chrome with MediaRecorder and checks MP4/WebM selection, previews, upload payloads, library/playlist rendering, kiosk autoplay/rotation and failed-video fallback. These use mocked APIs and do not upload real media or access the camera/microphone. The catalog regression also verifies exactly three products per row.
