import orderService from "../services/orderService.js";

class PaymentController {
  /**
   * Handle payment webhook from Omise
   * POST /api/payments/webhook
   */
  async handleWebhook(req, res) {
    try {
      const event = req.body;
      
      // Look for Omise charge.complete event
      if (event.key === "charge.complete" || (event.object === "event" && event.key === "charge.complete")) {
        const charge = event.data;
        const orderId = charge.metadata?.orderId || charge.metadata?.order_id;
        const status = charge.status;
        const transactionId = charge.id;

        if (orderId && status === "successful") {
          console.log(`[Webhook] Omise payment successful for order: ${orderId}`);
          await orderService.markOrderAsPaid(orderId, transactionId);
          return res.json({ success: true, message: "Order payment marked as paid." });
        }
      }

      // Return 200 to acknowledge receipt anyway
      return res.json({ received: true });
    } catch (err) {
      console.error("Error in PaymentController.handleWebhook:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Simulate payment webhook (For Dev Testing)
   * POST /api/payments/simulate-webhook
   */
  async simulateWebhook(req, res) {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required." });
      }

      const order = await orderService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      const mockTxId = `sim_tx_${Math.random().toString(36).substr(2, 9)}`;
      const updatedOrder = await orderService.markOrderAsPaid(orderId, mockTxId);

      return res.json({
        success: true,
        message: "Payment webhook simulated successfully.",
        order: updatedOrder
      });
    } catch (err) {
      console.error("Error in PaymentController.simulateWebhook:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new PaymentController();
