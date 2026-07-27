import { Router } from "express";
import paymentController from "../controllers/paymentController.js";

const router = Router();

router.post("/payments/webhook", (req, res) => paymentController.handleWebhook(req, res));
router.post("/payments/simulate-webhook", (req, res) => paymentController.simulateWebhook(req, res));

export default router;
