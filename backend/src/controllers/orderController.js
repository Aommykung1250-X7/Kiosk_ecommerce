// backend/src/controllers/orderController.js
import orderService from "../services/orderService.js";

class OrderController {
  /**
   * Handle POST /api/orders
   */
  async createOrder(req, res) {
    try {
      const { items, totalPrice } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid order items." });
      }

      if (typeof totalPrice !== "number" || totalPrice < 0) {
        return res.status(400).json({ error: "Invalid total price." });
      }

      const order = await orderService.createOrder(items, totalPrice);
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
  async getOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(orderId);

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
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(orderId);

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
  async sseOrder(req, res) {
    const { orderId } = req.params;
    const order = await orderService.getOrder(orderId);

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

  /**
   * Get all paid and unfulfilled orders (GET /api/orders/queue)
   */
  async getOrderQueue(req, res) {
    try {
      const queue = await orderService.getOrderQueue();
      return res.json(queue);
    } catch (error) {
      console.error("Error in OrderController.getOrderQueue:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Get all paid and fulfilled orders (GET /api/orders/history)
   */
  async getOrderHistory(req, res) {
    try {
      const history = await orderService.getOrderHistory();
      return res.json(history);
    } catch (error) {
      console.error("Error in OrderController.getOrderHistory:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Fulfill an order (POST /api/orders/:orderId/fulfill)
   */
  async fulfillOrder(req, res) {
    try {
      const { orderId } = req.params;
      const handlerId = req.user.id; // พนักงานที่ล็อกอินอยู่

      const order = await orderService.fulfillOrder(orderId, handlerId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      return res.json({ message: "Order fulfilled successfully.", order });
    } catch (error) {
      console.error("Error in OrderController.fulfillOrder:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Fulfill the In Stock portion of an order (POST /api/orders/:orderId/fulfill/instock)
   */
  async fulfillOrderInStock(req, res) {
    try {
      const { orderId } = req.params;
      const handlerId = req.user.id;

      const order = await orderService.fulfillOrderInStock(orderId, handlerId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      return res.json({ message: "In-stock items fulfilled successfully.", order });
    } catch (error) {
      console.error("Error in OrderController.fulfillOrderInStock:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Fulfill the Pre-Order portion of an order (POST /api/orders/:orderId/fulfill/preorder)
   */
  async fulfillOrderPreOrder(req, res) {
    try {
      const { orderId } = req.params;
      const handlerId = req.user.id;

      const order = await orderService.fulfillOrderPreOrder(orderId, handlerId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      return res.json({ message: "Pre-order items fulfilled successfully.", order });
    } catch (error) {
      console.error("Error in OrderController.fulfillOrderPreOrder:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
}

export default new OrderController();
