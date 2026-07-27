// backend/src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/security.js";

const JWT_SECRET = getJwtSecret();

/**
 * Middleware สำหรับดักตรวจสอบ JWT Token ใน HTTP Headers
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenFromCookie = req.cookies?.authToken;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : tokenFromCookie;

  if (!token) {
    return res.status(401).json({ error: "Authorization header (Bearer token) is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: "Token is invalid or expired" });
    }

    req.user = decodedUser;
    next();
  });
};

/**
 * Middleware สำหรับตรวจสอบ Role ของผู้ใช้งาน
 * @param {Array<string>} allowedRoles - รายชื่อ Role ที่อนุญาต เช่น ['admin', 'staff']
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "User is not authenticated" });
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Access denied: Insufficient permissions" });
    }

    next();
  };
};
