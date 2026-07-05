// backend/src/routes/orderRoutes.js
import { Router } from "express";
import orderController from "../controllers/orderController.js";
import checkoutController, { upload } from "../controllers/checkoutController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Order creation & status endpoints (Public Kiosk)
router.post("/orders", (req, res) => orderController.createOrder(req, res));
router.get("/orders/:orderId/status", (req, res) => orderController.getOrderStatus(req, res));

// Protected Staff/Admin Order Management endpoints (placed above dynamic parameters to prevent conflicts)
router.get("/orders/queue", authenticateJWT, checkRole(["staff", "admin"]), (req, res) => 
  orderController.getOrderQueue(req, res)
);

router.get("/orders/:orderId", (req, res) => orderController.getOrderDetails(req, res));
router.get("/orders/:orderId/sse", (req, res) => orderController.sseOrder(req, res));

// Checkout submit endpoint (accepts personal details + slip file upload)
router.post("/checkout/submit", upload.single("slip"), (req, res) => 
  checkoutController.submitCheckout(req, res)
);

router.post("/orders/:orderId/fulfill", authenticateJWT, checkRole(["staff", "admin"]), (req, res) => 
  orderController.fulfillOrder(req, res)
);

export default router;
