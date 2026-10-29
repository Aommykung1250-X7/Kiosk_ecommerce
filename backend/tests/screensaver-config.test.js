import assert from "node:assert/strict";
import test from "node:test";
import pool from "../src/data/db.js";
import controller from "../src/controllers/screensaverController.js";
import productService from "../src/services/productService.js";

const idleKey = "screensaver_idle_timeout_minutes";

function setup(t, initial = {}) {
  const settings = new Map(Object.entries(initial));
  const writes = [];
  t.mock.method(productService, "getBestSellers", async () => []);
  t.mock.method(pool, "query", async (sql, values) => {
    const selected = sql.match(/WHERE key = '([^']+)'/);
    if (selected) return { rows: settings.has(selected[1]) ? [{ value: settings.get(selected[1]) }] : [] };
    const inserted = sql.match(/VALUES \('([^']+)', \$1\)/);
    assert.ok(inserted, "settings writes stay parameterized");
    settings.set(inserted[1], values[0]);
    writes.push(inserted[1]);
    return { rows: [] };
  });
  return { settings, writes };
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("existing databases with no idle setting default to four minutes", async (t) => {
  setup(t);
  const res = response();
  await controller.getScreensaverConfig({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.idleTimeoutMinutes, 4);
});

for (const minutes of [1, 7, 60]) {
  test(`save and read back ${minutes} whole minutes`, async (t) => {
    const { settings } = setup(t);
    const saved = response();
    await controller.updateScreensaverConfig({ body: { idleTimeoutMinutes: minutes } }, saved);
    assert.equal(saved.statusCode, 200);
    assert.equal(settings.get(idleKey), String(minutes));
    const loaded = response();
    await controller.getScreensaverConfig({}, loaded);
    assert.equal(loaded.body.idleTimeoutMinutes, minutes);
  });
}

for (const invalid of [0, -1, 61, 1.5, "4", "", null, true]) {
  test(`reject invalid timeout ${JSON.stringify(invalid)} before changing other settings`, async (t) => {
    const { settings, writes } = setup(t, { [idleKey]: "7", screensaver_master_enabled: "true" });
    const res = response();
    await controller.updateScreensaverConfig({ body: { idleTimeoutMinutes: invalid, masterEnabled: false } }, res);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(writes, []);
    assert.equal(settings.get(idleKey), "7");
  });
}

test("editing existing screen settings does not overwrite the idle timeout", async (t) => {
  const { settings } = setup(t, { [idleKey]: "7" });
  const res = response();
  await controller.updateScreensaverConfig({ body: { masterDuration: 20 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(settings.get(idleKey), "7");
  assert.equal(settings.get("screensaver_master_duration"), "20");
});

for (const invalidStored of ["0", "1.5", "61", "broken"]) {
  test(`invalid stored value ${invalidStored} falls back to four minutes`, async (t) => {
    setup(t, { [idleKey]: invalidStored });
    const res = response();
    await controller.getScreensaverConfig({}, res);
    assert.equal(res.body.idleTimeoutMinutes, 4);
  });
}
