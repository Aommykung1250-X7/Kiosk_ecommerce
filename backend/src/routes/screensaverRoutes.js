import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import screensaverController from "../controllers/screensaverController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";
import { unlink } from "node:fs/promises";
import { getScreensaverMediaType, isAllowedScreensaverUpload, hasScreensaverSignature } from "../config/screensaverMedia.js";

const router = Router();

const screensaverUploadDir = path.join(process.cwd(), "uploads", "screensavers");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(screensaverUploadDir, { recursive: true });
    cb(null, screensaverUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = crypto.randomBytes(16).toString("hex");
    cb(null, `${safeName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!isAllowedScreensaverUpload(file)) {
    return cb(new Error("รองรับ JPEG, PNG, WebP, MP4 และ WebM โดยนามสกุลต้องตรงกับชนิดไฟล์"));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Public Route
router.get("/screensavers/active", (req, res) => screensaverController.getActiveScreensavers(req, res));
router.get("/screensavers/config", (req, res) => screensaverController.getScreensaverConfig(req, res));

// Admin/Staff Protected Routes
router.get("/screensavers", authenticateJWT, checkRole(["staff", "admin"]), (req, res) => screensaverController.getScreensavers(req, res));
router.post("/screensavers", authenticateJWT, checkRole(["admin"]), (req, res) => screensaverController.createScreensaver(req, res));
router.put("/screensavers/config", authenticateJWT, checkRole(["admin"]), (req, res) => screensaverController.updateScreensaverConfig(req, res));
router.put("/screensavers/:id", authenticateJWT, checkRole(["admin"]), (req, res) => screensaverController.updateScreensaver(req, res));
router.delete("/screensavers/:id", authenticateJWT, checkRole(["admin"]), (req, res) => screensaverController.deleteScreensaver(req, res));

// Media upload remains admin-only; keep the legacy image field compatible.
router.post(
  "/screensavers/upload",
  authenticateJWT,
  checkRole(["admin"]),
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Invalid image upload." });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No media file provided." });
    }
    try {
      if (!await hasScreensaverSignature(req.file)) {
        await unlink(req.file.path);
        return res.status(400).json({ error: "เนื้อหาไฟล์ไม่ตรงกับชนิดสื่อที่ระบุ" });
      }
      return res.json({ image: req.file.filename, mediaType: getScreensaverMediaType(req.file.filename) });
    } catch (error) {
      await unlink(req.file.path).catch(() => {});
      console.error("Screensaver upload failed:", error);
      return res.status(500).json({ error: "Unable to save media upload." });
    }
  }
);

export default router;
