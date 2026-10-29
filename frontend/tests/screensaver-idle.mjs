import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(10000);
const base = process.env.KIOSK_URL || "http://localhost:5173";
const label = "พักหน้าจอเมื่อไม่มีการใช้งาน";
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => {
  localStorage.setItem("user", JSON.stringify({ id: 1, username: "test-admin", role: "admin", name: "Test Admin" }));
});

let config = { masterEnabled: true, masterDuration: 10, mainImage: "", featuredProductIds: [], featuredProducts: [] };
let writes = [];
let configUnavailable = false;
const emptyCart = { items: [], totalItems: 0, totalPrice: 0 };
await page.route("**/uploads/**", (route) => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" />' }));
await page.route("**/api/**", async (route) => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  let data = {};
  if (path === "/api/screensavers/config") {
    if (request.method() === "PUT") {
      const body = request.postDataJSON();
      writes.push(body);
      config = { ...config, ...body };
      return route.fulfill({ json: { success: true } });
    }
    if (configUnavailable) return route.fulfill({ status: 503, json: { error: "unavailable" } });
    data = config;
  } else if (path === "/api/screensavers" || path === "/api/screensavers/active" || path === "/api/categories") data = [];
  else if (path.startsWith("/api/cart")) data = emptyCart;
  else if (path === "/api/products" || path === "/api/products/bestsellers") data = [{ id: 1, name: "สินค้าทดสอบ", price: 25, quantity: 10, stock: 10, status: "In Stock" }];
  else if (path === "/api/settings/search-tags") data = { popularSearchTags: [] };
  await route.fulfill({ json: data });
});

const screenshots = process.env.KIOSK_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });

try {
  await page.goto(`${base}/dashboard/screensavers`);
  const input = page.getByLabel(label, { exact: true });
  await input.waitFor();
  assert.equal(await input.inputValue(), "4", "old/missing config defaults to four minutes in admin");
  await input.fill("7");
  const saved = page.waitForResponse((res) => res.url().endsWith("/api/screensavers/config") && res.request().method() === "PUT");
  await page.getByRole("button", { name: "บันทึกการตั้งค่าหน้าจอหลัก", exact: true }).click();
  await saved;
  assert.equal(writes.at(-1).idleTimeoutMinutes, 7);
  assert.equal(writes.at(-1).masterDuration, 10, "slide duration stays separate from inactivity time");
  const reloaded = page.waitForResponse((res) => res.url().endsWith("/api/screensavers/config"));
  await page.reload();
  await reloaded;
  await input.waitFor();
  assert.equal(await input.inputValue(), "7", "saved setting survives reloading admin");

  for (const invalid of ["0", "61", "1.5", ""]) {
    const before = writes.length;
    await input.fill(invalid);
    await page.getByRole("button", { name: "บันทึกการตั้งค่าหน้าจอหลัก", exact: true }).click();
    await page.getByText("กรุณากำหนดเวลาพักหน้าจอเป็นจำนวนเต็มตั้งแต่ 1 ถึง 60 นาที", { exact: true }).first().waitFor();
    assert.equal(writes.length, before, "invalid values are not submitted");
  }
  await input.fill("7");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await input.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "settings fit the viewport");
    if (screenshots) await page.screenshot({ path: `${screenshots}/idle-settings-${width}.png` });
  }
  console.log("PASS admin default, save/reload, validation, and responsive settings");

  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.clock.install({ time: new Date("2026-10-29T10:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-29T10:00:01Z"));
  const enterKiosk = async () => {
    const loaded = page.waitForResponse((res) => res.url().endsWith("/api/screensavers/config"));
    await page.goto(`${base}/?kiosk=true`);
    await loaded;
    await page.locator(".kiosk-product-card").first().waitFor();
  };
  config.idleTimeoutMinutes = 5;
  await enterKiosk();
  await page.clock.runFor(299000);
  assert.equal(await page.locator(".kiosk-screensaver").count(), 0, "five-minute setting does not sleep at four minutes");
  await page.clock.runFor(2000);
  await page.locator(".kiosk-screensaver").waitFor();
  console.log("PASS kiosk enters screensaver after configured five minutes");

  config.idleTimeoutMinutes = 2;
  await enterKiosk();
  await page.clock.runFor(119000);
  await page.mouse.move(100, 100);
  await page.clock.runFor(119000);
  assert.equal(await page.locator(".kiosk-screensaver").count(), 0, "activity resets the countdown");
  await page.clock.runFor(2000);
  await page.locator(".kiosk-screensaver").waitFor();
  console.log("PASS user activity restarts the configured idle countdown");

  config.idleTimeoutMinutes = 4;
  await enterKiosk();
  config.idleTimeoutMinutes = 1;
  const polled = page.waitForResponse((res) => res.url().endsWith("/api/screensavers/config"));
  await page.clock.runFor(61000);
  await polled;
  await page.clock.runFor(61000);
  await page.locator(".kiosk-screensaver").waitFor();
  console.log("PASS running kiosk picks up an admin change without reloading");

  configUnavailable = true;
  await enterKiosk();
  await page.clock.runFor(239000);
  assert.equal(await page.locator(".kiosk-screensaver").count(), 0);
  await page.clock.runFor(2000);
  await page.locator(".kiosk-screensaver").waitFor();
  console.log("PASS unavailable config uses the four-minute fallback");
  assert.deepEqual(errors, [], "no browser runtime errors");
} finally {
  await browser.close();
}
