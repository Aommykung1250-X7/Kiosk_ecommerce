import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../src/data/db.js";
import controller from "../src/controllers/screensaverController.js";

const root = await mkdtemp(path.join(tmpdir(), "kiosk-media-upload-"));
const originalCwd = process.cwd();
process.chdir(root);
process.env.JWT_SECRET = "screensaver-media-tests-only";
const { default: router } = await import("../src/routes/screensaverRoutes.js");
process.chdir(originalCwd);
const token = jwt.sign({ id: 1, role: "admin" }, process.env.JWT_SECRET);
let server, base;
before(async () => {
  const app = express();
  app.use("/api", router);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
  await rm(root, { recursive: true, force: true });
});

const files = async () => readdir(path.join(root, "uploads", "screensavers")).catch(() => []);
async function upload(name, mime, bytes, authorized = true) {
  const body = new FormData();
  body.append("image", new Blob([bytes], { type: mime }), name);
  return fetch(`${base}/api/screensavers/upload`, { method: "POST", body, headers: authorized ? { Authorization: `Bearer ${token}` } : {} });
}
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypisom0000")]);
const webm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from("webm-header")]);

test("unauthenticated media upload writes no file", async () => {
  const before = await files();
  assert.equal((await upload("ad.mp4", "video/mp4", mp4, false)).status, 401);
  assert.deepEqual(await files(), before);
});

for (const [name, mime, bytes, type] of [["poster.png", "image/png", png, "image"], ["ad.MP4", "video/mp4", mp4, "video"], ["ad.webm", "video/webm", webm, "video"]]) {
  test(`accept ${name} and report its media kind`, async () => {
    const res = await upload(name, mime, bytes);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.mediaType, type);
    assert.match(data.image, /^[a-f0-9]{32}\.(png|mp4|webm)$/);
    assert.ok((await files()).includes(data.image));
  });
}

for (const [name, mime, bytes] of [["fake.mp4", "video/mp4", Buffer.from("<html>not video</html>")], ["fake.mp4", "image/png", png], ["ad.mov", "video/quicktime", mp4], ["poster.svg", "image/svg+xml", Buffer.from("<svg/>")]]) {
  test(`reject mismatched or unsupported upload ${name} (${mime}) without remnants`, async () => {
    const before = await files();
    assert.equal((await upload(name, mime, bytes)).status, 400);
    assert.deepEqual(await files(), before);
  });
}

test("reject files over 50 MiB without leaving a partial upload", async () => {
  const before = await files();
  assert.equal((await upload("large.mp4", "video/mp4", Buffer.alloc(50 * 1024 * 1024 + 1))).status, 400);
  assert.deepEqual(await files(), before);
});

function response() { return { code: 200, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } }; }
for (const [url, type] of [["poster.jpeg", "image"], ["clip.mp4", "video"], ["clip.webm", "video"]]) {
  test(`creating ${url} persists ${type} as a bound parameter`, async (t) => {
    let saved;
    t.mock.method(pool, "query", async (sql, values) => { saved = values; return { rows: [{ mediaType: values[1] }] }; });
    const res = response();
    await controller.createScreensaver({ body: { title: "Ad", mediaUrl: url, duration: 10 } }, res);
    assert.equal(res.code, 201);
    assert.equal(saved[1], type);
    assert.equal(res.body.mediaType, type);
  });
}

test("replacing an image with WebM updates its stored media type", async (t) => {
  let saved;
  t.mock.method(pool, "query", async (sql, values) => {
    if (sql.startsWith("SELECT")) return { rows: [{ type: "image", file_url: "old.png" }] };
    saved = values;
    return { rows: [{ mediaType: values[6] }] };
  });
  const res = response();
  await controller.updateScreensaver({ params: { id: "1" }, body: { mediaUrl: "new.webm" } }, res);
  assert.equal(res.code, 200);
  assert.equal(saved[6], "video");
});
