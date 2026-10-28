import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { mock } from "node:test";
import express from "express";
import pool, { initDb } from "../src/data/db.js";

// Importing OrderService starts a cleanup timer; DB and payment I/O stay isolated here.
const timer = mock.method(globalThis, "setInterval", () => 0);
process.env.JWT_SECRET = "deployment-tests-only-not-a-production-secret";
const { default: orderService } = await import("../src/services/orderService.js");
const { default: orderController } = await import("../src/controllers/orderController.js");
const previousNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = "production";
const { default: paymentRoutes } = await import("../src/routes/paymentRoutes.js");
if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
else process.env.NODE_ENV = previousNodeEnv;
timer.mock.restore();

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("production refuses missing database credentials before connecting", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "kiosk-deployment-env-"));
  try {
    const child = spawnSync(process.execPath, ["--input-type=module", "-e",
      `await import(${JSON.stringify(new URL("../src/data/db.js", import.meta.url).href)});`], {
      cwd,
      env: { ...process.env, NODE_ENV: "production", DOTENV_CONFIG_PATH: "/dev/null",
        DB_HOST: "db", DB_NAME: "kiosk_db", DB_USER: "kiosk", DB_PASSWORD: "" },
      encoding: "utf8",
    });
    assert.notEqual(child.status, 0, "missing production DB password must stop startup");
    assert.match(child.stderr, /DB_PASSWORD/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("schema initialization rejects instead of starting an API with a broken database", async (t) => {
  t.mock.method(pool, "query", async () => { throw new Error("migration failed"); });
  t.mock.method(console, "error", () => {});
  await assert.rejects(initDb(), /migration failed/);
});

for (const endpoint of ["webhook", "simulate-webhook"]) {
  test(`production does not expose the payment ${endpoint} endpoint`, async (t) => {
    const app = express();
    app.use("/api", paymentRoutes);
    const server = app.listen(0, "127.0.0.1");
    t.after(() => { server.closeAllConnections(); server.close(); });
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/payments/${endpoint}`, { method: "POST" });
    assert.equal(res.status, 404);
  });
}

test("production checkout is closed before creating any order or payment", async (t) => {
  const previous = { NODE_ENV: process.env.NODE_ENV, PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED };
  Object.assign(process.env, { NODE_ENV: "production", PAYMENTS_ENABLED: "false" });
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  t.mock.method(orderService, "createOrder", async () => { assert.fail("closed checkout must not create an order"); });
  const res = response();
  await orderController.createOrder({ body: { items: [{ product: { id: 1 }, quantity: 1 }], totalPrice: 25 } }, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /ชำระเงิน/);
});

for (const healthy of [true, false]) {
  test(`health endpoint returns ${healthy ? "200 when DB responds" : "503 without leaking DB errors"}`, async (t) => {
    const { default: healthRoutes } = await import("../src/routes/healthRoutes.js");
    t.mock.method(pool, "query", async () => {
      if (!healthy) throw new Error("private database connection detail");
      return { rows: [{ ready: 1 }] };
    });
    const app = express();
    app.use("/api", healthRoutes);
    const server = app.listen(0, "127.0.0.1");
    t.after(() => { server.closeAllConnections(); server.close(); });
    await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
    assert.equal(res.status, healthy ? 200 : 503);
    assert.deepEqual(await res.json(), { status: healthy ? "ok" : "unavailable" });
  });
}

test("create-admin refuses an empty password before touching the database", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "kiosk-admin-env-"));
  try {
    const child = spawnSync(process.execPath, [new URL("../scripts/create-admin.js", import.meta.url).pathname], {
      cwd,
      env: { ...process.env, DOTENV_CONFIG_PATH: "/dev/null", ADMIN_USERNAME: "admin", ADMIN_PASSWORD: "" },
      encoding: "utf8",
    });
    assert.notEqual(child.status, 0);
    assert.match(child.stderr, /ADMIN_PASSWORD/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
