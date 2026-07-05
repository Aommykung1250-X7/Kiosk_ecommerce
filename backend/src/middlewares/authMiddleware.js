// backend/src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "camt-secret-key-for-toy-kiosk";

/**
 * Middleware สำหรับดักตรวจสอบ JWT Token ใน HTTP Headers
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (err) {
        return res.status(403).json({ error: "Token is invalid or expired" });
      }
      
      // บันทึกข้อมูล user จาก token ลงใน request object
      req.user = decodedUser; // { id, username, role, name }
      next();
    });
  } else {
    res.status(401).json({ error: "Authorization header (Bearer token) is missing" });
  }
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
