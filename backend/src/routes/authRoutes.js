// backend/src/routes/authRoutes.js
import { Router } from "express";
import authController from "../controllers/authController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Route การล็อกอิน
router.post("/login", (req, res) => authController.login(req, res));

// Route เรียกดูโปรไฟล์ผู้ใช้ล็อกอินปัจจุบัน
router.get("/me", authenticateJWT, (req, res) => authController.getMe(req, res));

// ส่วนแอดมินบริหารพนักงาน (Admin Only User Management)
router.get("/users", authenticateJWT, checkRole(["admin"]), (req, res) => authController.getUsers(req, res));
router.post("/users", authenticateJWT, checkRole(["admin"]), (req, res) => authController.registerUser(req, res));
router.delete("/users/:id", authenticateJWT, checkRole(["admin"]), (req, res) => authController.deleteUser(req, res));

export default router;
