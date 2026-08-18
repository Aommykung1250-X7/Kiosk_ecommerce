// backend/src/routes/productRoutes.js
import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import productController from "../controllers/productController.js";
import statsController from "../controllers/statsController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Multer storage setup for product images
const productUploadDir = path.join(process.cwd(), "uploads", "products");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(productUploadDir, { recursive: true });
    cb(null, productUploadDir);
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
    return cb(new Error("Only image files are allowed for products."));
  }
  cb(null, true);
};

const productUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Route: GET /api/products & Settings
router.get("/products", (req, res) => productController.getProducts(req, res));
router.get("/products/bestsellers", (req, res) => productController.getBestSellers(req, res));
router.get("/settings/search-tags", (req, res) => productController.getPopularSearchTags(req, res));
router.post("/settings/search-tags", authenticateJWT, checkRole(["admin"]), (req, res) => productController.updatePopularSearchTags(req, res));

// Admin-only CRUD routes
router.post("/products/upload", authenticateJWT, checkRole(["admin"]), (req, res, next) => {
  productUpload.array("images", 5)(req, res, (err) => {
    if (err) {
      // Fallback if field name 'image' was used
      return productUpload.single("image")(req, res, (err2) => {
        if (err2) return res.status(400).json({ error: err2.message || "Invalid upload." });
        next();
      });
    }
    next();
  });
}, (req, res) => productController.uploadProductImage(req, res));

router.post("/products", authenticateJWT, checkRole(["admin"]), (req, res) => productController.createProduct(req, res));
router.put("/products/:id", authenticateJWT, checkRole(["admin"]), (req, res) => productController.updateProduct(req, res));
router.delete("/products/:id", authenticateJWT, checkRole(["admin"]), (req, res) => productController.deleteProduct(req, res));

// Public tracking routes
router.post("/products/:id/view", (req, res) => productController.viewProduct(req, res));
router.post("/kiosk/wakeup", (req, res) => statsController.incrementWakeups(req, res));

// Admin-only statistics route
router.get("/kiosk/stats", authenticateJWT, checkRole(["admin"]), (req, res) => statsController.getKioskStats(req, res));

export default router;
