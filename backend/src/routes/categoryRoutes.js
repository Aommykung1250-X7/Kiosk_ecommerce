import { Router } from "express";
import categoryController from "../controllers/categoryController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Public route to fetch categories
router.get("/categories", (req, res) => categoryController.getCategories(req, res));

// Admin/Staff Protected Routes
router.post("/categories", authenticateJWT, checkRole(["admin"]), (req, res) => categoryController.createCategory(req, res));
router.put("/categories/:id", authenticateJWT, checkRole(["admin"]), (req, res) => categoryController.updateCategory(req, res));
router.delete("/categories/:id", authenticateJWT, checkRole(["admin"]), (req, res) => categoryController.deleteCategory(req, res));

export default router;
