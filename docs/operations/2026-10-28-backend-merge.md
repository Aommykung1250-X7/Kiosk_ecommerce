# Backend/frontend integration into main

This merge brings `origin/Backend` at `c9741aa` into the responsive kiosk branch at `97c1ac6`. `origin/frontend` points to the same commit and already contains `origin/Test`; no additional merge of those branches is needed.

Conflict resolution retains Backend's NEW/promotion/sales ranking, sold-out handling, same-category recommendations, configured screensaver slides and four product slots, and QR/support styling. Responsive viewport sizing, typography, dialog scrolling, QR sizing, and carousel geometry remain in place. The local modified `backend/.env` is excluded from this merge.

## Server update

1. Check `git status --short --branch` and preserve any server-only commits or uncommitted files. Once on the intended deployment branch, use `git pull --ff-only origin main`. A refusal means the server still has additional history: inspect it rather than resetting or forcing the update.
2. Before restarting the backend, take a database backup using the server's existing backup procedure. Startup adds promotion and cumulative-sales columns, backfills sales from paid orders on first creation, clears inactive discount settings, and migrates/drops the legacy `discount_percent` column. Code rollback alone does not undo database changes.
3. Install dependencies using the existing package manager (`npm ci` in both `backend` and `frontend` was verified), run `npm run build` in `frontend`, and restart the existing backend process using the server's process manager. No production process manager is assumed here.
4. Inspect startup logs for `Database tables initialized successfully` and no initialization error. Verify catalog, a discounted product, contact form/QR, and split-shipping tracking on the actual deployment. Check kiosk fullscreen/orientation/zoom on hardware.

**Do not execute `schema.sql`, `seed.sql`, or `schema_v2.sql` against the existing production database as part of this merge.** `schema.sql` contains DROP TABLE statements; seed files reset sample data; `schema_v2.sql` is an incompatible future design draft. The application uses its existing `initDb()` migration path.

## Validation

- Frontend production build and lint pass (existing warnings remain).
- Browser checks: nine viewport/purchase-flow cases, three 24-item mixed-shipping carts, three idle/screensaver/wakeup cases; NEW/promotion/sales ranking and final carousel item are covered.
- Backend JavaScript syntax checked across 45 source files.
- `node --test backend/tests/merge-regression.test.js` covers pricing, promotion schedules, NEW expiry and order stages. Four pure tests run by default.
- Optional fifth integration test was run against a disposable PostgreSQL database with the pre-merge schema. It validates first-boot sales backfill, restart preservation, shipment updates without duplicate rows, and separate preorder tracking. Set `KIOSK_TEST_DB_URL=postgres://kiosk_merge@127.0.0.1:55439/kiosk_merge_test` only after provisioning that disposable database with the pre-merge schema; the test refuses any other host/port/name/user and disables dotenv loading.
- Independent review found no conflict-resolution regressions.

## Existing operational limitations

Startup migration does not run in a single transaction, and `initDb()` logs initialization errors rather than failing startup. An interrupted first sales backfill can leave columns present without completed totals, so verify migration logs and totals before serving traffic. The imported daily-email scheduler claims a date before sending and does not automatically retry a failed email that day; multiple application processes can race. These imported behaviors were not redesigned during this merge.
