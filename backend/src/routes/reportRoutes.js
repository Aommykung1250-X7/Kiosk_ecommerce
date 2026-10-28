import express from "express";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";
import {
    getSummaryStatsController,
    exportReportController,
    getDailyDigestController,
    getDailyDigestSettingsController,
    updateDailyDigestSettingsController,
    sendDailyDigestController
} from "../controllers/reportController.js";

const router = express.Router();

// ดึงข้อมูลภาพรวมสำหรับแสดง Dashboard Widgets
router.get("/summary", authenticateJWT, checkRole(["admin"]), getSummaryStatsController);

// Export รายงานเป็นไฟล์ Excel (.xlsx), CSV (.csv) หรือ PDF (.pdf)
router.get("/export", authenticateJWT, checkRole(["admin"]), exportReportController);

// สรุปออเดอร์ค้างรายวัน — พรีวิวบนหน้าจอ ตั้งค่าการส่ง และกดส่งเอง
router.get("/daily-digest", authenticateJWT, checkRole(["admin"]), getDailyDigestController);
router.get("/daily-digest/settings", authenticateJWT, checkRole(["admin"]), getDailyDigestSettingsController);
router.post("/daily-digest/settings", authenticateJWT, checkRole(["admin"]), updateDailyDigestSettingsController);
router.post("/daily-digest/send", authenticateJWT, checkRole(["admin"]), sendDailyDigestController);

export default router;
