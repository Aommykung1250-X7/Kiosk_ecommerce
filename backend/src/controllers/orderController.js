// backend/src/controllers/orderController.js
import orderService from "../services/orderService.js";

class OrderController {
  /**
   * Handle POST /api/orders
   */
  createOrder(req, res) {
    try {
      const { items, totalPrice } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid order items." });
      }

      if (typeof totalPrice !== "number" || totalPrice < 0) {
        return res.status(400).json({ error: "Invalid total price." });
      }

      const order = orderService.createOrder(items, totalPrice);
      return res.status(201).json({
        orderId: order.id,
        totalPrice: order.totalPrice,
        status: order.status
      });
    } catch (error) {
      console.error("Error in OrderController.createOrder:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle GET /api/orders/:orderId/status
   */
  getOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const order = orderService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      return res.json({ status: order.status });
    } catch (error) {
      console.error("Error in OrderController.getOrderStatus:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle GET /api/orders/:orderId
   */
  getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const order = orderService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      return res.json(order);
    } catch (error) {
      console.error("Error in OrderController.getOrderDetails:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle GET /api/orders/:orderId/sse
   */
  sseOrder(req, res) {
    const { orderId } = req.params;
    const order = orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Set headers for Server-Sent Events (SSE)
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    // Send initial status immediately
    res.write(`data: ${JSON.stringify({ status: order.status })}\n\n`);

    // Register this connection to be notified of future updates
    orderService.registerSseListener(orderId, res);

    // If client closes connection, clean up
    req.on("close", () => {
      orderService.removeSseListener(orderId, res);
    });
  }
}

export default new OrderController();
