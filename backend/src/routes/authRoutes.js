// backend/src/routes/authRoutes.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import authController from "../controllers/authController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";
import { validateLoginPayload } from "../middlewares/validationMiddleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." }
});

// Route การล็อกอิน
router.post("/login", loginLimiter, validateLoginPayload, (req, res) => authController.login(req, res));

// Route เรียกดูโปรไฟล์ผู้ใช้ล็อกอินปัจจุบัน
router.get("/me", authenticateJWT, (req, res) => authController.getMe(req, res));

// ส่วนแอดมินบริหารพนักงาน (Admin Only User Management)
router.get("/users", authenticateJWT, checkRole(["admin"]), (req, res) => authController.getUsers(req, res));
router.post("/users", authenticateJWT, checkRole(["admin"]), (req, res) => authController.registerUser(req, res));
router.delete("/users/:id", authenticateJWT, checkRole(["admin"]), (req, res) => authController.deleteUser(req, res));

export default router;
