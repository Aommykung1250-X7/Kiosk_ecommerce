# Screensaver Media

User approved fixing portrait-poster overflow and adding MP4/WebM upload/playback in both main and pm2. Preserve their deployment/payment differences and the local modified backend/.env.

User subsequently requested exactly three catalog products per row. Apply three columns consistently to the home catalog at all supported viewports, without changing the four featured slots on the screensaver.

- Bound the screensaver to the viewport. Reserve space for shopping, featured products and contacts, and keep image/video intrinsic dimensions out of flex sizing. Use contain to preserve the complete poster without cropping. Recommend portrait 9:16 (1080x1920) in admin.
- Reuse the existing screensavers.type field (image/video); infer it from supported file extensions when creating/replacing media. Keep existing images working and preserve type during metadata-only edits. No new DB/table required.
- Accept JPEG/PNG/WebP and MP4/WebM uploads up to 50 MiB. Validate declared MIME, extension and file signature; remove rejected files. Keep the existing image upload field/response compatible with the main-image setting.
- Use one shared media renderer for the kiosk, form preview, media cards and playlist thumbnails. Kiosk videos autoplay muted/inline, loop during the configured 3-60 second slide slot, and reset when the source changes. Admin previews have controls, not automatic playback across the library.
- Verify real portrait/landscape/long-poster fixtures at multiple viewports, upload authorization/validation/cleanup, persisted type transitions, video preview/playback and existing idle behavior.
- Apply shared changes to both branches. Increase the dev2 Nginx body limit to 60 MiB in a main-only commit to allow a 50 MiB multipart file. Document the equivalent VPS proxy setting; do not deploy either server automatically.
