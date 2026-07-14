// backend/src/routes/orderRoutes.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import orderController from "../controllers/orderController.js";
import checkoutController, { upload } from "../controllers/checkoutController.js";
import { authenticateJWT, checkRole } from "../middlewares/authMiddleware.js";
import { validateCreateOrder, validateCheckoutSubmit } from "../middlewares/validationMiddleware.js";
import { auditSensitiveAction } from "../middlewares/auditMiddleware.js";
import { authorizeOrderMutation } from "../middlewares/authorizationMiddleware.js";

const router = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout submissions. Please try again later." }
});

// Order creation & status endpoints (Public Kiosk)
router.post("/orders", validateCreateOrder, (req, res) => orderController.createOrder(req, res));
router.get("/orders/:orderId/status", (req, res) => orderController.getOrderStatus(req, res));

// Protected Staff/Admin Order Management endpoints (placed above dynamic parameters to prevent conflicts)
router.get("/orders/queue", authenticateJWT, checkRole(["staff", "admin"]), (req, res) =>
  orderController.getOrderQueue(req, res)
);

router.get("/orders/history", authenticateJWT, checkRole(["staff", "admin"]), (req, res) =>
  orderController.getOrderHistory(req, res)
);

router.get("/orders/:orderId", (req, res) => orderController.getOrderDetails(req, res));
router.get("/orders/:orderId/sse", (req, res) => orderController.sseOrder(req, res));

// Checkout submit endpoint (accepts personal details + slip file upload)
router.post("/checkout/submit", checkoutLimiter, (req, res, next) => {
  upload.single("slip")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Invalid upload." });
    }
    validateCheckoutSubmit(req, res, () => {
      checkoutController.submitCheckout(req, res);
    });
  });
});

router.post("/orders/:orderId/fulfill", authenticateJWT, checkRole(["staff", "admin"]), authorizeOrderMutation, auditSensitiveAction, (req, res) =>
  orderController.fulfillOrder(req, res)
);

router.post("/orders/:orderId/fulfill/instock", authenticateJWT, checkRole(["staff", "admin"]), authorizeOrderMutation, auditSensitiveAction, (req, res) =>
  orderController.fulfillOrderInStock(req, res)
);

router.post("/orders/:orderId/fulfill/preorder", authenticateJWT, checkRole(["staff", "admin"]), authorizeOrderMutation, auditSensitiveAction, (req, res) =>
  orderController.fulfillOrderPreOrder(req, res)
);

export default router;
