// backend/src/services/orderService.js
import orderRepository from "../repositories/orderRepository.js";
import productRepository from "../repositories/productRepository.js";

class OrderService {
  constructor() {
    this.sseListeners = new Map(); // Map of orderId -> Set of Express Response objects
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
   * Fulfill an order by orderId and handlerId
   * @param {string} orderId 
   * @param {number} handlerId 
   */
  async fulfillOrder(orderId, handlerId) {
    return await orderRepository.fulfill(orderId, handlerId);
  }
}

export default new OrderService();
