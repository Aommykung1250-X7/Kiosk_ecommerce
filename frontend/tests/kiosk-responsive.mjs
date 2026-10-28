// Run against Vite: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/kiosk-responsive.mjs
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const screenshotDir = process.env.KIOSK_SCREENSHOTS;
if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const products = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1, name: `สินค้าเครื่องดื่มทดสอบชื่อยาวภาษาไทย ${i + 1}`, price: 25,
  quantity: 50, status: i === 1 ? 'Pre-Order' : 'In Stock', category: 'drinks',
  description: 'รายละเอียดสินค้าสำหรับทดสอบ '.repeat(20),
}));
let cart = { items: [], totalItems: 0, totalPrice: 0 };
await page.route('**/api/**', async (route) => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith('/sse')) return route.fulfill({ contentType: 'text/event-stream', body: 'retry: 600000\ndata: {"status":"pending"}\n\n' });
  let data = {};
  if (path === '/api/categories') data = [{ id: 'drinks', name: 'เครื่องดื่มและสินค้าอื่นที่มีชื่อยาว' }];
  else if (path.startsWith('/api/products')) data = products;
  else if (path === '/api/cart/clear') {
    cart = { items: [], totalItems: 0, totalPrice: 0 };
    data = cart;
  } else if (path === '/api/cart') {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      cart = { items: [{ product: products.find(p => p.id === body.productId), quantity: body.quantity }], totalItems: body.quantity, totalPrice: body.quantity * 25 };
    }
    data = cart;
  } else if (path === '/api/orders') data = { orderId: 'test-order', totalPrice: 25, qrPayload: 'test-qr' };
  else if (path.endsWith('/status')) data = { status: 'pending' };
  else if (path === '/api/screensavers/active') data = [];
  else if (path === '/api/screensavers/config') data = { featuredProducts: products.slice(0, 4) };
  await route.fulfill({ json: data });
});

async function fits(locator, label) {
  const bounds = await locator.boundingBox();
  const { width, height } = page.viewportSize();
  assert.ok(bounds && bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= height + 1, `${label} fits viewport: ${JSON.stringify(bounds)}`);
  assert.equal(await locator.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `${label} has no horizontal overflow`);
}

try {
  let previousFontSize = 0;
  for (const [width, height] of [[1080, 1920], [2160, 3840], [680, 1200], [1440, 900], [768, 1024], [390, 844], [320, 640], [1080, 700], [390, 450]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${process.env.KIOSK_URL || 'http://localhost:5173'}/?kiosk=true`);
    await page.locator('main h3').first().waitFor();
    const bounds = await page.locator('.kiosk-app-container').boundingBox();
    assert.equal(bounds.width, width, `kiosk fills ${width}px width`);
    assert.equal(bounds.height, height, `kiosk fills ${height}px height`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal document overflow');
    await fits(page.locator('.kiosk-header'), 'header');
    await fits(page.locator('.kiosk-footer'), 'footer');
    if (width >= 1080 && height > width) {
      const fontSize = await page.locator('main h3').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      assert.ok(fontSize > previousFontSize, 'product typography grows on the larger kiosk');
      previousFontSize = fontSize;
    }
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/catalog-${width}.png` });
    await page.locator('main h3').first().click();
    await fits(page.locator('.kiosk-product-dialog'), 'product dialog');
    await page.getByTitle('สินค้าก่อนหน้า', { exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.kiosk-related-track').getAnimations().some(animation => animation.playState === 'running'));
    const relatedWindow = await page.locator('.kiosk-related-window').boundingBox();
    const lastRelated = await page.locator('.kiosk-related-item').last().boundingBox();
    assert.ok(lastRelated.x + lastRelated.width <= relatedWindow.x + relatedWindow.width + 1, 'last related product is fully visible at the final carousel position');
    await page.getByRole('button', { name: 'ADD TO CART' }).click();
    await page.locator('.kiosk-header').getByRole('button', { name: /CART/ }).click();
    await fits(page.locator('.kiosk-cart'), 'cart');
    await page.getByRole('button', { name: 'Proceed with payment' }).click();
    await fits(page.locator('.kiosk-payment-dialog'), 'payment dialog');
    await page.getByPlaceholder('เช่น 0812345678').fill('0812345678');
    await page.getByPlaceholder('example@email.com').fill('test@example.com');
    await page.locator('.kiosk-payment-dialog button[type="submit"]').click();
    await page.locator('.kiosk-payment-qr').waitFor();
    await fits(page.locator('.kiosk-payment-dialog'), 'QR payment dialog');
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/payment-${width}.png` });
    await page.getByRole('button', { name: 'ยกเลิกคำสั่งซื้อ' }).click();
    await page.getByRole('button', { name: 'Continue shopping' }).click();
    await page.locator('.kiosk-footer').getByRole('button', { name: 'ติดต่อเจ้าหน้าที่' }).click();
    await fits(page.locator('.kiosk-support-dialog'), 'support dialog');
    await page.getByRole('button', { name: 'เข้าใจแล้ว / ปิดหน้าต่าง' }).click();
    console.log(`PASS viewport ${width}×${height}`);
  }

  cart = { items: products.map(product => ({ product, quantity: 1 })), totalItems: 24, totalPrice: 600 };
  for (const [width, height] of [[2160, 3840], [1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${process.env.KIOSK_URL || 'http://localhost:5173'}/?kiosk=true`);
    await page.locator('.kiosk-header').getByRole('button', { name: /CART/ }).click();
    await page.getByRole('button', { name: /จัดส่งพัสดุ/ }).click();
    await page.getByLabel('แยกจัดส่งสินค้า (บวกค่าส่งเพิ่ม)').check();
    const checkout = page.getByRole('button', { name: 'Proceed with payment' });
    await checkout.scrollIntoViewIfNeeded();
    await fits(checkout, 'checkout with 24 mixed-shipping items');
    await checkout.click();
    await fits(page.locator('.kiosk-payment-dialog'), 'checkout from long cart');
    console.log(`PASS long cart ${width}×${height}`);
  }

  await page.clock.install();
  for (const [width, height] of [[2160, 3840], [1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${process.env.KIOSK_URL || 'http://localhost:5173'}/?kiosk=true`);
    await page.locator('main h3').first().waitFor();
    await page.clock.fastForward(241000);
    await page.locator('.kiosk-screensaver').waitFor();
    await page.clock.runFor(500);
    await fits(page.locator('.kiosk-screensaver'), 'screensaver');
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/screensaver-${width}.png` });
    await page.locator('.kiosk-screensaver').click({ position: { x: 10, y: 10 } });
    await page.clock.fastForward(1100);
    await page.locator('.kiosk-screensaver').waitFor({ state: 'detached' });
    console.log(`PASS screensaver ${width}×${height}`);
  }
  await page.goto(`${process.env.KIOSK_URL || 'http://localhost:5173'}/ditc-portal-to-manager`);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--kiosk-unit').trim()), '', 'kiosk tokens do not leak to login/admin');
  assert.deepEqual(errors, [], 'no runtime errors');
} finally {
  await browser.close();
}
