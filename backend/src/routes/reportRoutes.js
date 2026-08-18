import express from "express";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";
import { getSummaryStatsController, exportReportController } from "../controllers/reportController.js";

const router = express.Router();

// ดึงข้อมูลภาพรวมสำหรับแสดง Dashboard Widgets
router.get("/summary", authenticateJWT, checkRole(["admin"]), getSummaryStatsController);

// Export รายงานเป็นไฟล์ Excel (.xlsx), CSV (.csv) หรือ PDF (.pdf)
router.get("/export", authenticateJWT, checkRole(["admin"]), exportReportController);

export default router;
