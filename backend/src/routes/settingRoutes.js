import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import settingController from "../controllers/settingController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

const router = Router();

const contactUploadDir = path.join(process.cwd(), "uploads", "contact");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(contactUploadDir, { recursive: true });
    cb(null, contactUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = crypto.randomBytes(16).toString("hex");
    cb(null, `${safeName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files (JPEG, PNG, WebP, SVG) are allowed."));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/settings/contact (Public)
router.get("/settings/contact", (req, res) => settingController.getContactSettings(req, res));

// POST /api/settings/contact (Admin only)
router.post("/settings/contact", authenticateJWT, checkRole(["admin"]), (req, res) => settingController.updateContactSettings(req, res));

// POST /api/settings/contact/upload-qr (Admin only)
router.post(
  "/settings/contact/upload-qr",
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
  (req, res) => settingController.uploadContactQr(req, res)
);

export default router;
