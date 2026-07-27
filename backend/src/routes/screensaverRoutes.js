import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import screensaverController from "../controllers/screensaverController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

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
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files (JPEG, PNG, WebP) are allowed."));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Public Route
router.get("/screensavers/active", (req, res) => screensaverController.getActiveScreensavers(req, res));

// Admin/Staff Protected Routes
router.get("/screensavers", authenticateJWT, checkRole(["staff", "admin"]), (req, res) => screensaverController.getScreensavers(req, res));
router.post("/screensavers", authenticateJWT, checkRole(["admin"]), (req, res) => screensaverController.createScreensaver(req, res));
router.put("/screensavers/:id", authenticateJWT, checkRole(["admin"]), (req, res) => screensaverController.updateScreensaver(req, res));
router.delete("/screensavers/:id", authenticateJWT, checkRole(["admin"]), (req, res) => screensaverController.deleteScreensaver(req, res));

// Image Upload Endpoint (restricted to Admin/Staff)
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
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }
    return res.json({ image: req.file.filename });
  }
);

export default router;
