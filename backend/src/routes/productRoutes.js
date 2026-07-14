// backend/src/routes/productRoutes.js
import { Router } from "express";
import productController from "../controllers/productController.js";
import statsController from "../controllers/statsController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Route: GET /api/products
router.get("/products", (req, res) => productController.getProducts(req, res));
router.get("/products/bestsellers", (req, res) => productController.getBestSellers(req, res));

// Admin-only CRUD routes
router.post("/products", authenticateJWT, checkRole(["admin"]), (req, res) => productController.createProduct(req, res));
router.put("/products/:id", authenticateJWT, checkRole(["admin"]), (req, res) => productController.updateProduct(req, res));
router.delete("/products/:id", authenticateJWT, checkRole(["admin"]), (req, res) => productController.deleteProduct(req, res));

// Public tracking routes
router.post("/products/:id/view", (req, res) => productController.viewProduct(req, res));
router.post("/kiosk/wakeup", (req, res) => statsController.incrementWakeups(req, res));

// Admin-only statistics route
router.get("/kiosk/stats", authenticateJWT, checkRole(["admin"]), (req, res) => statsController.getKioskStats(req, res));

export default router;
