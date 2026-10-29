import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const base = process.env.KIOSK_URL || "http://localhost:5173";
const screenshots = process.env.KIOSK_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const products = Array.from({ length: 4 }, (_, i) => ({ id: i + 1, name: `สินค้า ${i + 1}`, image: "product.png", price: 25, quantity: 10, status: "In Stock" }));
let dimensions = [1080, 1920];
await page.route("**/uploads/**", (route) => route.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions[0]}" height="${dimensions[1]}"><rect width="100%" height="100%" fill="#237a94"/><text x="10%" y="50%" fill="white" font-size="80">Portrait ad</text></svg>` }));
await page.route("**/api/**", (route) => {
  const path = new URL(route.request().url()).pathname;
  let data = {};
  if (path === "/api/screensavers/config") data = { masterEnabled: false, idleTimeoutMinutes: 1, featuredProducts: products };
  else if (path === "/api/screensavers/active") data = [{ id: 1, title: "Portrait ad", mediaUrl: "poster.png", mediaType: "image", duration: 10 }];
  else if (path.startsWith("/api/products")) data = products;
  else if (path === "/api/categories") data = [];
  else if (path.startsWith("/api/cart")) data = { items: [], totalItems: 0, totalPrice: 0 };
  return route.fulfill({ json: data });
});

async function inside(locator, width, height, name) {
  const r = await locator.boundingBox();
  assert.ok(r && r.x >= -1 && r.y >= -1 && r.x + r.width <= width + 1 && r.y + r.height <= height + 1, `${name} remains inside ${width}x${height}: ${JSON.stringify(r)}`);
}

try {
  await page.clock.install();
  for (const [width, height] of [[1080, 1920], [2160, 3840], [680, 1200], [1440, 900], [1080, 700], [390, 844], [320, 640], [390, 450]]) {
    await page.setViewportSize({ width, height });
    for (const size of [[1080, 1920], [1920, 1080], [1080, 3000]]) {
      dimensions = size;
      const configReady = page.waitForResponse((res) => new URL(res.url()).pathname === "/api/screensavers/config");
      await page.goto(`${base}/?kiosk=true`);
      await configReady;
      await page.locator(".kiosk-product-card").first().waitFor();
      await page.waitForTimeout(50);
      await page.clock.fastForward(61000);
      await page.locator(".kiosk-advert img:not([aria-hidden=true])").waitFor();
      await page.waitForFunction(() => document.querySelector(".kiosk-advert img:not([aria-hidden=true])")?.naturalWidth > 0);
      if (screenshots) await page.screenshot({ path: `${screenshots}/ad-${width}x${height}-${size[0]}x${size[1]}.png` });
      assert.ok((await page.locator(".kiosk-advert").boundingBox()).height >= 60, "advertisement keeps usable space");
      await inside(page.locator(".kiosk-advert"), width, height, "advertisement frame");
      await inside(page.getByRole("button", { name: "START SHOPPING", exact: true }), width, height, "shopping button");
      await inside(page.locator(".kiosk-welcome > div").filter({ hasText: "สินค้าแนะนำพิเศษ" }), width, height, "featured products");
      assert.equal(await page.locator(".kiosk-screensaver").evaluate((el) => el.scrollHeight <= el.clientHeight + 1), true, "poster dimensions do not extend the screen");
    }
    console.log(`PASS fixed ad frame and featured products at ${width}x${height}`);
  }
} catch (error) {
  if (screenshots) await page.screenshot({ path: `${screenshots}/failure.png`, timeout: 3000 }).catch(() => {});
  console.error(await page.locator(".kiosk-screensaver").evaluateAll((els) => els.map((el) => ({ text: el.textContent, images: [...el.querySelectorAll("img")].map((img) => ({ src: img.src, naturalWidth: img.naturalWidth })) }))));
  throw error;
} finally { await browser.close(); }
