# Configurable Screensaver Idle Timeout

**Goal:** Merge the latest frontend design and let admins change kiosk inactivity time from advertisement management, defaulting to four minutes.

**Architecture:** Extend the existing screensaver config API and `system_settings` with `screensaver_idle_timeout_minutes`. The UI edits whole minutes (1-60), and Home reads the saved setting on load, window focus, and once per minute. Updating the setting resets the next inactivity countdown; checkout continues to suspend idle detection.

**Branch decisions from the user:** `main` remains the dev2/Docker release with payments disabled. `pm2` starts at `8fcc80b`, before Docker-specific changes, retaining legacy Omise/PM2 behavior. Both branches receive the frontend merge and this timeout feature. Preserve the user's modified `backend/.env`.

- [x] Merge `origin/frontend` (`871b1c0`) into main; retain fluid screen sizing and replace its temporary one-second timeout with the existing four-minute baseline.
- [x] Write failing config API tests, then add the new setting with range/type validation before any settings writes.
- [x] Add a number field to advertisement management, persist it through the existing Save button, and replace Home's hardcoded timer with the loaded value.
- [x] Verify API defaults/validation/persistence, browser save/reload and idle timing, frontend build/lint, and existing kiosk regressions.
- [ ] Commit the shared feature, create `pm2` from the pre-Docker baseline, merge the same frontend design, and apply the shared feature.
- [ ] Verify the branch separation and push main/pm2 without committing local secrets or deploying either server.

**Compatibility:** An old DB with no new key returns four minutes. Startup adds the default key with `ON CONFLICT DO NOTHING`, preserving saved values. Existing partial config writes leave the timeout untouched. No destructive schema migration is needed for this feature.

**Validation so far:** Main backend tests: 29 passed, one existing opt-in DB upgrade test skipped. Frontend build and TypeScript check passed; lint retains five pre-existing warnings. Both browser scripts passed, covering nine viewports, long carts, merged design idle/wakeup, admin save/reload/validation, five-minute timing, activity reset, refresh without reload, and offline defaults.
