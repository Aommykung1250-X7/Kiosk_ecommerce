// backend/src/routes/orderRoutes.js
import { Router } from "express";
import orderController from "../controllers/orderController.js";
import checkoutController, { upload } from "../controllers/checkoutController.js";

const router = Router();

// Order creation & status endpoints
router.post("/orders", (req, res) => orderController.createOrder(req, res));
router.get("/orders/:orderId/status", (req, res) => orderController.getOrderStatus(req, res));
router.get("/orders/:orderId", (req, res) => orderController.getOrderDetails(req, res));
router.get("/orders/:orderId/sse", (req, res) => orderController.sseOrder(req, res));

// Checkout submit endpoint (accepts personal details + slip file upload)
router.post("/checkout/submit", upload.single("slip"), (req, res) => 
  checkoutController.submitCheckout(req, res)
);

export default router;
