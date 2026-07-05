// backend/src/routes/productRoutes.js
import { Router } from "express";
import productController from "../controllers/productController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Route: GET /api/products
router.get("/products", (req, res) => productController.getProducts(req, res));

// Admin-only CRUD routes
router.post("/products", authenticateJWT, checkRole(["admin"]), (req, res) => productController.createProduct(req, res));
router.put("/products/:id", authenticateJWT, checkRole(["admin"]), (req, res) => productController.updateProduct(req, res));
router.delete("/products/:id", authenticateJWT, checkRole(["admin"]), (req, res) => productController.deleteProduct(req, res));

export default router;
