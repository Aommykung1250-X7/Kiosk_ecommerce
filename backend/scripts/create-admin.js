import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../src/data/db.js";

try {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || username;
  if (!username || username.length > 100) throw new Error("Set ADMIN_USERNAME (1-100 characters).");
  if (!password || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Set ADMIN_PASSWORD (at least 12 characters, at most 72 UTF-8 bytes).");
  }
  if (name.length > 100) throw new Error("ADMIN_NAME must be at most 100 characters.");

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    "INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, 'admin', $3)",
    [username, passwordHash, name],
  );
  console.log("Admin account created. Existing accounts were not changed.");
} catch (error) {
  console.error(error.code === "23505" ? "Username already exists; no account was changed." : error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
