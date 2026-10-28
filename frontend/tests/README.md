# Responsive kiosk browser checks

Start Vite with `npm run dev`, then run from `frontend` using an installed Playwright module and Google Chrome:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/kiosk-responsive.mjs
```

Omit `PLAYWRIGHT_MODULE` if `playwright` is available through normal Node resolution. `KIOSK_URL` overrides `http://localhost:5173`; `KIOSK_SCREENSHOTS` optionally saves screenshots to a directory. All `/api/` requests are mocked: these checks do not create real orders or payments. Tests cover viewport sizing, fluid typography, dialog overflow, recommendation navigation, checkout/QR, long mixed-shipping carts, idle/wakeup, and kiosk style cleanup on login.
