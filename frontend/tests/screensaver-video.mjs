import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.setDefaultTimeout(10000);
const base = process.env.KIOSK_URL || "http://localhost:5173";
const assets = new Map();
let ads = [], uploading;
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => localStorage.setItem("user", JSON.stringify({ id: 1, username: "test-admin", name: "Test Admin", role: "admin" })));

async function makeClip(mime) {
  return Buffer.from(await page.evaluate(async (mime) => {
    if (!MediaRecorder.isTypeSupported(mime)) throw new Error(`Test recorder does not support ${mime}`);
    const canvas = document.createElement("canvas"); canvas.width = 90; canvas.height = 160;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#287f9c"; ctx.fillRect(0, 0, 90, 160);
    const stream = canvas.captureStream(12), recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks = []; recorder.ondataavailable = (e) => chunks.push(e.data);
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start();
    const draw = setInterval(() => { ctx.fillStyle = Math.random() > 0.5 ? "#287f9c" : "#d1ad3d"; ctx.fillRect(0, 0, 90, 160); }, 80);
    await new Promise((resolve) => setTimeout(resolve, 600));
    recorder.stop(); await stopped; clearInterval(draw); stream.getTracks().forEach((track) => track.stop());
    return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];
  }, mime));
}

await page.route("**/uploads/**", async (route) => {
  const name = new URL(route.request().url()).pathname.split("/").at(-1);
  const asset = assets.get(name);
  if (asset) return route.fulfill({ contentType: asset.mime, body: asset.buffer });
  return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="100%" height="100%" fill="#287f9c"/></svg>' });
});
await page.route("**/api/**", async (route) => {
  const req = route.request(), path = new URL(req.url()).pathname;
  let data = {};
  if (path === "/api/screensavers/upload") {
    assert.ok(req.postDataBuffer().includes(uploading.buffer), "selected video bytes reach the upload endpoint");
    return route.fulfill({ json: { image: uploading.name, mediaType: "video" } });
  }
  if (path === "/api/screensavers" && req.method() === "POST") {
    const body = req.postDataJSON();
    assert.equal(body.mediaType, "video");
    const ad = { id: ads.length + 1, ...body }; ads.push(ad);
    return route.fulfill({ status: 201, json: ad });
  }
  if (path === "/api/screensavers" || path === "/api/screensavers/active") data = ads;
  else if (path === "/api/screensavers/config") data = { masterEnabled: false, masterDuration: 10, idleTimeoutMinutes: 1, featuredProducts: [], mainImage: "" };
  else if (path.startsWith("/api/cart")) data = { items: [], totalItems: 0, totalPrice: 0 };
  else if (path.startsWith("/api/products")) data = [{ id: 1, name: "สินค้า", price: 25, stock: 10, quantity: 10, status: "In Stock" }];
  else if (path === "/api/categories") data = [];
  return route.fulfill({ json: data });
});

try {
  for (const [extension, mime] of [["webm", "video/webm;codecs=vp8"], ["mp4", "video/mp4;codecs=avc1.42001E"]]) {
    const buffer = await makeClip(mime);
    const name = `uploaded.${extension}`;
    assets.set(name, { buffer, mime: `video/${extension}` });
    uploading = { buffer, name };
    await page.goto(`${base}/dashboard/screensavers`);
    await page.getByRole("button", { name: "เพิ่มสื่อโฆษณา", exact: true }).first().click();
    const dialog = page.getByRole("dialog");
    assert.ok((await dialog.innerText()).includes("9:16"));
    await dialog.locator('input[type="file"]').setInputFiles({ name: `clip.${extension}`, mimeType: `video/${extension}`, buffer });
    await dialog.getByLabel("ชื่อสื่อ").fill(`Video ${extension}`);
    await dialog.getByLabel("ระยะเวลาแสดงผล").fill("3");
    const preview = dialog.locator("video");
    await preview.waitFor();
    await page.waitForFunction(() => document.querySelector('[role="dialog"] video')?.readyState >= 1);
    assert.equal(await preview.evaluate((el) => el.src.startsWith("blob:") && el.controls), true, "local video preview has working controls");
    const saved = page.waitForResponse((res) => res.url().endsWith("/api/screensavers") && res.request().method() === "POST");
    await dialog.getByRole("button", { name: "เพิ่มสื่อโฆษณา", exact: true }).click();
    await saved; await dialog.waitFor({ state: "detached" });
    await page.locator(`video[src$="uploaded.${extension}"]`).first().waitFor();
    assert.equal(await page.locator(`img[src$="uploaded.${extension}"]`).count(), 0, "library and playlist use video previews");
    console.log(`PASS ${extension} file selection, decodable preview, upload payload, library and playlist`);
  }

  await page.clock.install();
  await page.goto(`${base}/?kiosk=true`);
  await page.locator(".kiosk-product-card").first().waitFor();
  await page.clock.fastForward(61000);
  await page.locator('.kiosk-advert video[src$="uploaded.webm"]').waitFor();
  await page.waitForFunction(() => document.querySelector(".kiosk-advert video")?.currentTime > 0);
  assert.equal(await page.locator(".kiosk-advert video").evaluate((el) => el.muted && el.autoplay && el.playsInline && !el.paused), true);
  await page.clock.fastForward(3100);
  await page.locator('.kiosk-advert video[src$="uploaded.mp4"]').waitFor();
  await page.waitForFunction(() => document.querySelector(".kiosk-advert video")?.currentTime > 0);
  const featured = await page.locator(".kiosk-welcome > div").filter({ hasText: "สินค้าแนะนำพิเศษ" }).boundingBox();
  assert.ok(featured.y + featured.height <= 1920);
  console.log("PASS muted inline autoplay and timed WebM-to-MP4 rotation without pushing featured products off-screen");

  ads = [{ id: 3, title: "Broken", mediaUrl: "broken.mp4", mediaType: "video", duration: 3 }];
  assets.set("broken.mp4", { mime: "video/mp4", buffer: Buffer.from("invalid-video") });
  await page.goto(`${base}/?kiosk=true`);
  await page.locator(".kiosk-product-card").first().waitFor(); await page.clock.fastForward(61000);
  await page.locator(".kiosk-advert").getByText("ไม่สามารถแสดงสื่อได้", { exact: true }).waitFor();
  await page.getByRole("button", { name: "START SHOPPING", exact: true }).click();
  await page.locator(".kiosk-screensaver").waitFor({ state: "detached" });
  assert.deepEqual(errors, []);
  console.log("PASS unsupported video fallback remains dismissible");
} finally { await browser.close(); }
