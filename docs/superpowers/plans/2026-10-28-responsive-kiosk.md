# Responsive kiosk implementation plan

**Goal:** Implement the user's selected responsive approach for the 55-inch portrait kiosk, retaining the existing branding and purchase flow.

**Design:** Fill the browser viewport without a fixed canvas, transform, or zoom. Use kiosk-scoped fluid typography and spacing, an adaptive product grid, a horizontal category rail on narrow screens, and scrollable viewport-bounded dialogs. Keep admin and mobile delivery styles unchanged. Physical display resolution is not assumed to equal CSS viewport resolution.

**Files:** `frontend/src/index.css`, `frontend/src/pages/Home.jsx`, and the kiosk components Header, Sidebar, FooterBar, ProductCard, ProductDetailModal, CartDrawer, KioskPayment, SupportModal, and Screensaver. Browser regression coverage lives in `frontend/tests/kiosk-responsive.mjs`.

## Tasks

- [x] Reproduce the fixed-width/fixed-height problem with browser assertions at 1080×1920 and 2160×3840.
- [x] Replace the fixed kiosk frame with viewport sizing; add fluid tokens and responsive header/sidebar/catalog/footer rules.
- [x] Make dialogs, cart, QR codes, and screensaver responsive with reachable actions and internal scrolling.
- [x] Verify portrait kiosk, landscape desktop, narrow mobile and reduced-height keyboard viewports; check purchase flow using mocked APIs. Run build and lint and inspect screenshots.

## Review focus

- Long Thai product/category labels must not create horizontal document scrolling.
- Resizing between portrait and landscape must not retain a fixed frame.
- Large cart contents and mixed shipping must leave checkout reachable.
- Dialogs must fit short viewports and allow scrolling to their actions.
- Kiosk-specific typography and spacing must not affect admin or mobile delivery routes.

## Execution notes

The user explicitly selected approach 2 and requested implementation in this chat. Existing dependency lockfiles are out of sync with package.json; install locally without rewriting lockfiles for verification.

## Verification

- Browser regression first failed at 1080px: actual kiosk width was 680px. After implementation, all nine viewport/purchase-flow checks pass (1080×1920, 2160×3840, 680×1200, 1440×900, 768×1024, 390×844, 320×640, 1080×700, 390×450).
- Three 24-item mixed-shipping cart checks and three idle/screensaver/wakeup checks pass (portrait 4K, desktop landscape, narrow mobile). Runtime error list is empty; login does not retain kiosk tokens.
- Independent code review found narrow related-carousel clipping. A regression assertion failed before fixing thumbnail sizes and passes afterward, including the last recommendation.
- `npm run build` passes; Vite reports a bundle size warning (~607kB). `git diff --check` passes.
- Full lint still reports the same 30 diagnostics (27 warnings, 3 pre-existing conditional-hook errors). Running the same lint configuration against HEAD sources and changed sources produces identical diagnostic descriptions.
- Screenshots inspected for portrait catalog/payment and mobile/4K screensaver. Physical kiosk touch calibration, OS rotation/scaling, and payment-provider integration remain hardware/deployment checks.
