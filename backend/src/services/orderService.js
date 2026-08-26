// backend/src/services/orderService.js
import orderRepository from "../repositories/orderRepository.js";
import productRepository from "../repositories/productRepository.js";
import shippingService from "./shippingService.js";
import PaymentGatewayService from "./payment/PaymentGatewayService.js";

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
  async createOrder(items, totalPrice, deliveryOption = "pickup", shippingOption = "combined") {
    if (!items || items.length === 0) {
      throw new Error("Cannot create an order with empty items");
    }
    return await orderRepository.create(items, totalPrice, deliveryOption, shippingOption);
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

  /**
   * ผลข้างเคียงเมื่อออเดอร์จ่ายเงินสำเร็จ: หักสต็อก + บันทึกยอดขายสะสมของสินค้า
   * รวมไว้ที่เดียวเพราะมีสองเส้นทางที่ทำให้ออเดอร์กลายเป็นจ่ายแล้ว
   * @param {object} order ออเดอร์ที่อ่านมาก่อนอัปเดตสถานะ (ต้องมี items)
   */
  async applyPaidSideEffects(order) {
    for (const item of order.items) {
      const productId = item.product.id;
      const quantity = item.quantity;
      // order_items.product_id เป็น NULL ได้ (ON DELETE SET NULL) ถ้าสินค้าถูกลบไปแล้ว
      if (!productId) continue;
      await productRepository.decreaseStock(productId, quantity);
      await productRepository.recordSale(productId, quantity, item.price * quantity);
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
      // หักสต็อกและบันทึกยอดขายของสินค้าแต่ละรายการในออเดอร์
      await this.applyPaidSideEffects(order);

      // Notify all Kiosk listeners of this order
      this.notifyKiosk(orderId, "success");
    }

    return updatedOrder;
  }

  async markOrderAsPaid(orderId, paymentGatewayRef) {
    const order = await orderRepository.get(orderId);
    if (!order) {
      return null;
    }
    if (order.status === "success") {
      return order; // Already paid
    }

    const updatedOrder = await orderRepository.update(orderId, {
      status: "success",
      paymentGatewayRef
    });

    if (updatedOrder) {
      // หักสต็อกและบันทึกยอดขายของสินค้าแต่ละรายการในออเดอร์
      await this.applyPaidSideEffects(order);

      // ส่งอีเมลใบเสร็จหากมีอีเมลลูกค้าบันทึกไว้แล้ว
      if (updatedOrder.customerEmail) {
        import("./emailService.js").then(({ default: emailService }) => {
          emailService.sendReceipt(updatedOrder, updatedOrder.customerEmail).catch(err => {
            console.error("Error sending email receipt on markOrderAsPaid:", err);
          });
        });
      }

      // Notify all Kiosk listeners of this order
      this.notifyKiosk(orderId, "success");
    }

    return updatedOrder;
  }

  async updateOrderContactInfo(orderId, updates) {
    const updatedOrder = await orderRepository.update(orderId, updates);

    if (updatedOrder && updates.customerEmail && updatedOrder.status === "success") {
      // ส่งอีเมลใบเสร็จแบบ Async กรณีออเดอร์ชำระเงินสำเร็จแล้ว
      import("./emailService.js").then(({ default: emailService }) => {
        emailService.sendReceipt(updatedOrder, updates.customerEmail).catch(err => {
          console.error("Error sending email receipt async:", err);
        });
      });
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

  async fulfillOrderItem(itemId, handlerId) {
    return await orderRepository.fulfillItem(itemId, handlerId);
  }

  /**
   * Fulfill the In Stock items of an order
   * @param {string} orderId 
   * @param {number} handlerId 
   * @param {string} [courier]
   * @param {string} [trackingNumber]
   */
  async fulfillOrderInStock(orderId, handlerId, courier = null, trackingNumber = null) {
    const updatedOrder = await orderRepository.fulfillInStock(orderId, handlerId, courier, trackingNumber);
    
    // Send email notification to customer if tracking is available
    if (updatedOrder && updatedOrder.customerEmail && trackingNumber) {
      import("./emailService.js").then(({ default: emailService }) => {
        emailService.sendShipmentNotification(updatedOrder, {
          courier,
          trackingNumber,
          type: "instock"
        }).catch(err => {
          console.error("[OrderService] Failed to send shipment notification email:", err);
        });
      });
    }

    return updatedOrder;
  }

  /**
   * Fulfill the Pre-Order items of an order
   * @param {string} orderId 
   * @param {number} handlerId 
   * @param {string} [courier]
   * @param {string} [trackingNumber]
   */
  async fulfillOrderPreOrder(orderId, handlerId, courier = null, trackingNumber = null) {
    const updatedOrder = await orderRepository.fulfillPreOrder(orderId, handlerId, courier, trackingNumber);
    
    // Send email notification to customer if tracking is available
    if (updatedOrder && updatedOrder.customerEmail && trackingNumber) {
      // Import emailService dynamically to avoid circular dependencies
      import("./emailService.js").then(({ default: emailService }) => {
        emailService.sendShipmentNotification(updatedOrder, {
          courier,
          trackingNumber,
          type: "preorder"
        }).catch(err => {
          console.error("[OrderService] Failed to send shipment notification email:", err);
        });
      });
    }

    return updatedOrder;
  }

  /**
   * Fulfill a combined order (sending single email for combined shipment)
   */
  async fulfillOrderCombined(orderId, handlerId, courier = null, trackingNumber = null) {
    const updatedOrder = await orderRepository.fulfillCombined(orderId, handlerId, courier, trackingNumber);
    
    // Send ONLY 1 email notification for combined shipment
    if (updatedOrder && updatedOrder.customerEmail && trackingNumber) {
      import("./emailService.js").then(({ default: emailService }) => {
        emailService.sendShipmentNotification(updatedOrder, {
          courier,
          trackingNumber,
          type: "combined"
        }).catch(err => {
          console.error("[OrderService] Failed to send combined shipment email:", err);
        });
      });
    }

    return updatedOrder;
  }

  async cancelPendingOrder(orderId) {
    const order = await orderRepository.get(orderId);
    if (order && order.paymentGatewayRef) {
      PaymentGatewayService.cancelCharge(order.paymentGatewayRef).catch(err => {
        console.error("[OrderService] Error cancelling payment gateway charge:", err);
      });
    }
    return await orderRepository.deletePendingOrder(orderId);
  }

  async getShippingSettings() {
    return await orderRepository.getShippingSettings();
  }

  async updateShippingSettings(baseFee, splitFee) {
    return await orderRepository.updateShippingSettings(baseFee, splitFee);
  }
}

export default new OrderService();
