import assert from 'node:assert/strict';
import test from 'node:test';
import { computePricing, resolvePromotionStatus } from '../src/services/promotionService.js';
import { isNewProduct } from '../src/services/newArrivalService.js';
import { getOrderStage } from '../src/services/orderStageService.js';

test('promotions preserve original price and apply percentage or amount discounts', () => {
  const percentage = { promotion: true, discount_type: 'percent', discount_value: 20 };
  assert.equal(computePricing(25, percentage).price, 20);
  assert.equal(computePricing(25, percentage).originalPrice, 25);
  assert.equal(computePricing(25, percentage, false).price, 25);
  assert.equal(computePricing(25, { ...percentage, promotion: false }).price, 25);
  assert.equal(computePricing(25, { promotion: true, discount_type: 'amount', discount_value: 30 }).price, 0);
});

test('scheduled and expired promotions do not become active outside their dates', () => {
  const row = { promotion: true, discount_type: 'percent', discount_value: 20,
    discount_start_date: '2026-10-10', discount_end_date: '2026-10-20' };
  assert.equal(resolvePromotionStatus(row, new Date(2026, 9, 9, 12)), 'scheduled');
  assert.equal(resolvePromotionStatus(row, new Date(2026, 9, 15, 12)), 'active');
  assert.equal(resolvePromotionStatus(row, new Date(2026, 9, 21, 12)), 'expired');
});

test('NEW expires after three days and ignores invalid or future dates', () => {
  const now = new Date('2026-10-28T12:00:00Z');
  assert.equal(isNewProduct({ created_at: '2026-10-27T12:00:00Z' }, now), true);
  assert.equal(isNewProduct({ created_at: '2026-10-25T12:00:00Z' }, now), false);
  assert.equal(isNewProduct({ created_at: '2026-10-29T12:00:00Z' }, now), false);
  assert.equal(isNewProduct({ created_at: 'invalid' }, now), false);
});

test('split delivery distinguishes waiting for address, first shipment and preorder', () => {
  const order = { deliveryOption: 'delivery', shippingOption: 'split',
    fulfillmentStatusInstock: 'pending', fulfillmentStatusPreorder: 'pending' };
  assert.equal(getOrderStage(order).key, 'waiting_address');
  assert.equal(getOrderStage({ ...order, customerAddress: 'test address' }).key, 'ready_to_ship');
  assert.equal(getOrderStage({ ...order, customerAddress: 'test address', fulfillmentStatusInstock: 'fulfilled' }).key, 'partially_shipped');
});

test('upgrade existing schema, preserve accumulated sales on restart, and keep shipment rounds separate', {
  skip: !process.env.KIOSK_TEST_DB_URL,
}, async () => {
  const url = new URL(process.env.KIOSK_TEST_DB_URL);
  // Refuse all databases except the explicitly provisioned disposable test database.
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55439');
  assert.equal(url.pathname, '/kiosk_merge_test');
  assert.equal(url.username, 'kiosk_merge');
  Object.assign(process.env, { DOTENV_CONFIG_PATH: '/dev/null', DB_HOST: url.hostname,
    DB_PORT: url.port, DB_NAME: 'kiosk_merge_test', DB_USER: url.username, DB_PASSWORD: '' });
  const { default: pool, initDb } = await import('../src/data/db.js');
  try {
    await pool.query("INSERT INTO categories (id, name) VALUES ('drinks', 'Drinks')");
    const { rows: [product] } = await pool.query("INSERT INTO products (name, price, stock, category_id) VALUES ('Test product', 25, 50, 'drinks') RETURNING id");
    const { rows: [order] } = await pool.query("INSERT INTO orders (order_uuid, total_amount, payment_status) VALUES ('MERGE-TEST', 100, 'paid') RETURNING id");
    await pool.query("INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES ($1, $2, 'Test product', 25, 4)", [order.id, product.id]);
    const migrationErrors = [];
    const originalError = console.error;
    console.error = (...args) => migrationErrors.push(args.map(String).join(' '));
    try { await initDb(); } finally { console.error = originalError; }
    assert.deepEqual(migrationErrors, [], 'startup migration succeeds');
    const { rows: [sales] } = await pool.query('SELECT sold_count, sold_revenue FROM products WHERE id = $1', [product.id]);
    assert.equal(sales.sold_count, 4);
    assert.equal(Number(sales.sold_revenue), 100);
    await pool.query('UPDATE products SET sold_count = 9, sold_revenue = 225 WHERE id = $1', [product.id]);
    await initDb();
    const { rows: [afterRestart] } = await pool.query('SELECT sold_count FROM products WHERE id = $1', [product.id]);
    assert.equal(afterRestart.sold_count, 9, 'restart does not overwrite accumulated totals');

    const { default: repository } = await import('../src/repositories/orderRepository.js');
    await repository.upsertShipment(order.id, 'instock', 'Carrier', 'OLD');
    await repository.upsertShipment(order.id, 'instock', 'Carrier', 'CORRECTED');
    const { rows: shipments } = await pool.query('SELECT * FROM order_shipments WHERE order_id = $1 ORDER BY id', [order.id]);
    assert.equal(shipments.length, 1, 'editing shipment updates the existing row');
    const mapped = repository.mapOrderRow({ id: order.id, order_uuid: 'MERGE-TEST', total_amount: 100 }, [], shipments);
    assert.equal(mapped.trackingNumber1, 'CORRECTED');
    assert.ok(!mapped.trackingNumber2, 'preorder does not reuse the instock tracking number');
  } finally {
    await pool.end();
  }
});
