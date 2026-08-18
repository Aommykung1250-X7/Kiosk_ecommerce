// backend/src/controllers/orderController.js
import orderService from "../services/orderService.js";
import PaymentGatewayService from "../services/payment/PaymentGatewayService.js";
import pool from "../data/db.js";

class OrderController {
  /**
   * Handle POST /api/orders
   */
  async createOrder(req, res) {
    try {
      const { items, totalPrice, deliveryOption, shippingOption } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid order items." });
      }

      if (typeof totalPrice !== "number" || totalPrice < 0) {
        return res.status(400).json({ error: "Invalid total price." });
      }

      const order = await orderService.createOrder(items, totalPrice, deliveryOption || "pickup", shippingOption || "combined");

      // Request dynamic QR from active payment gateway provider
      let qrPayload = "";
      try {
        const paymentData = await PaymentGatewayService.generateQrCode(order.id, order.totalPrice);
        qrPayload = paymentData.qrPayload;

        // Save the payment gateway reference
        await orderService.updateOrderContactInfo(order.id, { paymentGatewayRef: paymentData.transactionId });
      } catch (err) {
        console.error("[OrderController] Payment gateway QR generation failed:", err);
      }

      return res.status(201).json({
        orderId: order.id,
        totalPrice: order.totalPrice,
        status: order.status,
        qrPayload
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
      let order = await orderService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      // Auto-sync Omise status if order is pending and has payment gateway reference
      if (order.status === "pending" && order.paymentGatewayRef) {
        try {
          const chargeStatus = await PaymentGatewayService.checkChargeStatus(order.paymentGatewayRef);
          if (chargeStatus && (chargeStatus.status === "successful" || chargeStatus.paid)) {
            console.log(`[OrderController] Charge ${order.paymentGatewayRef} verified paid on Omise API, marking order ${orderId} as paid`);
            order = await orderService.markOrderAsPaid(orderId, order.paymentGatewayRef);
          }
        } catch (syncErr) {
          console.error("[OrderController] Failed to sync Omise charge status:", syncErr);
        }
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
      const { courier, trackingNumber } = req.body;

      const order = await orderService.fulfillOrderInStock(orderId, handlerId, courier, trackingNumber);
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
      const { courier, trackingNumber } = req.body;

      const order = await orderService.fulfillOrderPreOrder(orderId, handlerId, courier, trackingNumber);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      return res.json({ message: "Pre-order items fulfilled successfully.", order });
    } catch (error) {
      console.error("Error in OrderController.fulfillOrderPreOrder:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Fulfill a combined order (POST /api/orders/:orderId/fulfill/combined)
   */
  async fulfillOrderCombined(req, res) {
    try {
      const { orderId } = req.params;
      const handlerId = req.user.id;
      const { courier, trackingNumber } = req.body;

      const order = await orderService.fulfillOrderCombined(orderId, handlerId, courier, trackingNumber);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      return res.json({ message: "Combined order fulfilled successfully.", order });
    } catch (error) {
      console.error("Error in OrderController.fulfillOrderCombined:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Fulfill an individual item by itemId (POST /api/orders/items/:itemId/fulfill)
   */
  async fulfillOrderItem(req, res) {
    try {
      const { itemId } = req.params;
      const handlerId = req.user ? req.user.id : null;
      const order = await orderService.fulfillOrderItem(itemId, handlerId);
      if (!order) {
        return res.status(404).json({ error: "ไม่พบรายการสินค้าในคำสั่งซื้อ" });
      }
      return res.json({ message: "ยืนยันจ่ายสินค้าเรียบร้อยแล้ว", order });
    } catch (error) {
      console.error("Error in OrderController.fulfillOrderItem:", error);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกรายการสินค้า" });
    }
  }

  /**
   * Cancel and delete an unpaid pending order (POST /api/orders/:orderId/cancel or DELETE /api/orders/:orderId)
   */
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const cancelled = await orderService.cancelPendingOrder(orderId);
      if (!cancelled) {
        return res.status(404).json({ error: "Order not found or already processed." });
      }
      return res.json({ message: "Order cancelled and deleted successfully.", orderId });
    } catch (error) {
      console.error("Error in OrderController.cancelOrder:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle POST /api/orders/:orderId/contact-info
   */
  async updateContactInfo(req, res) {
    try {
      const { orderId } = req.params;
      const { phone, email } = req.body;

      if (!phone || !email) {
        return res.status(400).json({ error: "Phone and email are required." });
      }

      const order = await orderService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      const updatedOrder = await orderService.updateOrderContactInfo(orderId, {
        customerPhone: phone,
        customerEmail: email
      });

      return res.json({
        message: "Contact info updated successfully.",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error in OrderController.updateContactInfo:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle GET /api/settings/shipping
   */
  async getShippingSettings(req, res) {
    try {
      const settings = await orderService.getShippingSettings();
      return res.json(settings);
    } catch (error) {
      console.error("Error in OrderController.getShippingSettings:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle POST /api/settings/shipping
   */
  async updateShippingSettings(req, res) {
    try {
      const { baseShippingFee, additionalSplitShippingFee } = req.body;
      await orderService.updateShippingSettings(baseShippingFee, additionalSplitShippingFee);
      return res.json({ message: "Shipping settings updated successfully." });
    } catch (error) {
      console.error("Error in OrderController.updateShippingSettings:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Update order address from mobile checkout (PUT /api/orders/:orderId/address)
   */
  async updateOrderAddress(req, res) {
    try {
      const { orderId } = req.params;
      const {
        name,
        phone,
        email,
        addressStreet,
        subdistrict,
        district,
        province,
        zipcode,
        customerAddressFormatted
      } = req.body;

      const addressStr = customerAddressFormatted || `${addressStreet}, ${subdistrict}, ${district}, ${province} ${zipcode}`;

      if (!name || !phone || !email || !addressStr || addressStr.trim() === "" || addressStr.includes("undefined")) {
        return res.status(400).json({ error: "All address fields are required." });
      }

      const order = await orderService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      // Update the order in database
      const updatedOrder = await orderService.updateOrderContactInfo(orderId, {
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        customerAddress: addressStr
      });

      // Upsert customer profile in DB for future auto-fill
      const cleanEmail = email ? email.trim() : null;
      try {
        let profileRes = null;
        if (cleanEmail) {
          profileRes = await pool.query(
            "SELECT id FROM customer_profiles WHERE LOWER(customer_email) = LOWER($1)",
            [cleanEmail]
          );
        }

        if (profileRes && profileRes.rows.length > 0) {
          const profileId = profileRes.rows[0].id;
          await pool.query(
            `UPDATE customer_profiles SET
               customer_email = $1,
               customer_name = $2,
               customer_phone = $3,
               customer_address = $4,
               updated_at = NOW()
             WHERE id = $5`,
            [cleanEmail, name, phone, addressStr, profileId]
          );
        } else {
          await pool.query(
            `INSERT INTO customer_profiles (customer_email, customer_name, customer_phone, customer_address)
             VALUES ($1, $2, $3, $4)`,
            [cleanEmail, name, phone, addressStr]
          );
        }
      } catch (profErr) {
        console.error("Error saving customer profile:", profErr);
      }

      return res.json({
        message: "Address updated successfully.",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error in OrderController.updateOrderAddress:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
}

export default new OrderController();
