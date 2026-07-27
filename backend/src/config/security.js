import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const parseOrigins = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  const fallbackSecret = crypto.randomBytes(32).toString("hex");
  console.warn("[Security] JWT_SECRET not set. Using a temporary development secret.");
  return fallbackSecret;
};

export const getAllowedOrigins = () => {
  const configuredOrigins = parseOrigins(process.env.CORS_ORIGIN || process.env.FRONTEND_URL);

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];
};
