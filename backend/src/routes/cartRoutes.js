// backend/src/routes/cartRoutes.js
import { Router } from "express";
import cartController from "../controllers/cartController.js";

const router = Router();

// Routes for cart operations
router.get("/cart", (req, res) => cartController.getCart(req, res));
router.post("/cart", (req, res) => cartController.addItem(req, res));
router.put("/cart", (req, res) => cartController.updateQuantity(req, res));
router.delete("/cart/:productId", (req, res) => cartController.removeItem(req, res));
router.post("/cart/clear", (req, res) => cartController.clear(req, res));

export default router;
