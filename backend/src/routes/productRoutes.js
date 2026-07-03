// backend/src/routes/productRoutes.js
import { Router } from "express";
import productController from "../controllers/productController.js";

const router = Router();

// Route: GET /api/products
router.get("/products", (req, res) => productController.getProducts(req, res));

export default router;
