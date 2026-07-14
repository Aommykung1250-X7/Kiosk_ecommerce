// backend/src/services/orderService.js
import orderRepository from "../repositories/orderRepository.js";
import productRepository from "../repositories/productRepository.js";
import shippingService from "./shippingService.js";

class OrderService {
  constructor() {
    this.sseListeners = new Map(); // Map of orderId -> Set of Express Response objects

    // Start background routine to clean up expired pending orders every 5 minutes
    setInterval(async () => {
      try {
        const count = await orderRepository.deleteExpiredPending();
        if (count > 0) {
          console.log(`[Order Cleanup] Removed ${count} expired pending orders older than 30 minutes.`);
        }
      } catch (error) {
        console.error("[Order Cleanup] Failed to run expired pending orders cleanup:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Create a new order
   * @param {Array} items 
   * @param {number} totalPrice 
   * @returns {object}
   */
  async createOrder(items, totalPrice) {
    if (!items || items.length === 0) {
      throw new Error("Cannot create an order with empty items");
    }
    return await orderRepository.create(items, totalPrice);
  }

  /**
   * Get order details by ID
   * @param {string} orderId 
   * @returns {Promise<object|null>}
   */
  async getOrder(orderId) {
    return await orderRepository.get(orderId);
  }

  /**
   * Register a new SSE listener for a specific order
   * @param {string} orderId 
   * @param {object} res - Express Response object
   */
  registerSseListener(orderId, res) {
    if (!this.sseListeners.has(orderId)) {
      this.sseListeners.set(orderId, new Set());
    }
    this.sseListeners.get(orderId).add(res);
  }

  /**
   * Remove an SSE listener
   * @param {string} orderId 
   * @param {object} res - Express Response object
   */
  removeSseListener(orderId, res) {
    if (this.sseListeners.has(orderId)) {
      const set = this.sseListeners.get(orderId);
      set.delete(res);
      if (set.size === 0) {
        this.sseListeners.delete(orderId);
      }
    }
  }

  /**
   * Notify Kiosk listeners that the order status has changed
   * @param {string} orderId 
   * @param {string} status 
   */
  notifyKiosk(orderId, status) {
    if (this.sseListeners.has(orderId)) {
      const listeners = this.sseListeners.get(orderId);
      const dataPayload = JSON.stringify({ status });
      
      for (const res of listeners) {
        try {
          res.write(`data: ${dataPayload}\n\n`);
          res.end(); // Close stream upon final status
        } catch (err) {
          console.error(`Failed to write to SSE client for order ${orderId}:`, err);
        }
      }
      this.sseListeners.delete(orderId);
    }
  }

  async updateOrderPayment(orderId, updates) {
    // ดึงรายละเอียดออเดอร์ก่อนเพื่อดูรายการสินค้าที่ซื้อ
    const order = await orderRepository.get(orderId);
    if (!order) {
      return null;
    }

    const updatedOrder = await orderRepository.update(orderId, {
      ...updates,
      status: "success"
    });

    if (updatedOrder) {
      // หักสต็อกของสินค้าแต่ละรายการในออเดอร์
      for (const item of order.items) {
        const productId = item.product.id;
        const quantity = item.quantity;
        await productRepository.decreaseStock(productId, quantity);
      }

      // Notify all Kiosk listeners of this order
      this.notifyKiosk(orderId, "success");
    }

    return updatedOrder;
  }

  /**
   * Get all paid, unfulfilled orders
   * @returns {Promise<Array>}
   */
  async getOrderQueue() {
    return await orderRepository.getQueue();
  }

  /**
   * Get all paid, fulfilled orders
   * @returns {Promise<Array>}
   */
  async getOrderHistory() {
    return await orderRepository.getHistory();
  }

  /**
   * Fulfill an order by orderId and handlerId
   * @param {string} orderId 
   * @param {number} handlerId 
   */
  async fulfillOrder(orderId, handlerId) {
    return await orderRepository.fulfill(orderId, handlerId);
  }

  /**
   * Fulfill the In Stock items of an order
   * @param {string} orderId 
   * @param {number} handlerId 
   */
  async fulfillOrderInStock(orderId, handlerId) {
    return await orderRepository.fulfillInStock(orderId, handlerId);
  }

  /**
   * Fulfill the Pre-Order items of an order
   * @param {string} orderId 
   * @param {number} handlerId 
   * @param {string} [courier]
   * @param {string} [trackingNumber]
   * @param {boolean} [autoBook]
   */
  async fulfillOrderPreOrder(orderId, handlerId, courier = null, trackingNumber = null, autoBook = false) {
    let finalCourier = courier;
    let finalTracking = trackingNumber;

    if (autoBook && courier) {
      const order = await orderRepository.get(orderId);
      if (order) {
        try {
          const bookingResult = await shippingService.bookShipment(order, courier);
          if (bookingResult.success) {
            finalTracking = bookingResult.trackingNumber;
          }
        } catch (err) {
          console.error(`[OrderService] Failed to auto-book shipment for order ${orderId}:`, err);
        }
      }
    }

    const updatedOrder = await orderRepository.fulfillPreOrder(orderId, handlerId, finalCourier, finalTracking);
    
    // Send email notification to customer if tracking is available
    if (updatedOrder && updatedOrder.customerEmail && finalTracking) {
      // Import emailService dynamically to avoid circular dependencies
      import("./emailService.js").then(({ default: emailService }) => {
        emailService.sendShipmentNotification(updatedOrder).catch(err => {
          console.error("[OrderService] Failed to send shipment notification email:", err);
        });
      });
    }

    return updatedOrder;
  }
}

export default new OrderService();
