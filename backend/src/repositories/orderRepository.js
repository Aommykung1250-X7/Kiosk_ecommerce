// backend/src/repositories/orderRepository.js
import pool from "../data/db.js";

class OrderRepository {
  constructor() {
    this.orderCounter = 1;
    this.lastCounterDate = this.getDateString();
  }

  /**
   * Helper to get date string in YYYYMMDD format
   * @returns {string}
   */
  getDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  }

  /**
   * Generate unique order ID: CAMT-YYYYMMDD-XXXX (Database-backed for restart persistence)
   * @returns {Promise<string>}
   */
  async generateOrderId() {
    const dateStr = this.getDateString();
    
    const query = `
      SELECT order_uuid FROM orders 
      WHERE order_uuid LIKE $1
      ORDER BY order_uuid DESC 
      LIMIT 1
    `;
    const prefix = `CAMT-${dateStr}-%`;
    try {
      const res = await pool.query(query, [prefix]);
      let nextCounter = 1;
      if (res.rows.length > 0) {
        const lastUuid = res.rows[0].order_uuid;
        const parts = lastUuid.split("-");
        const lastCounter = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastCounter)) {
          nextCounter = lastCounter + 1;
        }
      }
      const counterStr = String(nextCounter).padStart(4, "0");
      return `CAMT-${dateStr}-${counterStr}`;
    } catch (error) {
      console.error("Error generating order ID:", error);
      // Fallback fallback if DB query fails
      const timestamp = Date.now();
      return `CAMT-${dateStr}-${timestamp}`;
    }
  }

  /**
   * Create a new order in PostgreSQL
   * @param {Array} items 
   * @param {number} totalPrice 
   * @returns {Promise<object>}
   */
  async create(items, totalPrice) {
    const orderId = await this.generateOrderId();
    const hasInStock = items.some(item => item.product && item.product.status === 'In Stock');
    const hasPreOrder = items.some(item => item.product && item.product.status === 'Pre-Order');
    
    const instockStatus = hasInStock ? 'pending' : 'none';
    const preorderStatus = hasPreOrder ? 'pending' : 'none';

    const query = `
      INSERT INTO orders (order_uuid, total_amount, payment_status, items, fulfillment_status_instock, fulfillment_status_preorder)
      VALUES ($1, $2, 'pending', $3, $4, $5)
      RETURNING *
    `;
    const values = [orderId, totalPrice, JSON.stringify(items), instockStatus, preorderStatus];

    try {
      const res = await pool.query(query, values);
      return this.mapOrderRow(res.rows[0]);
    } catch (error) {
      console.error("Error creating order in DB:", error);
      throw error;
    }
  }

  /**
   * Fetch order by ID from PostgreSQL
   * @param {string} orderUuid 
   * @returns {Promise<object|null>}
   */
  async get(orderUuid) {
    const query = `SELECT * FROM orders WHERE order_uuid = $1`;
    try {
      const res = await pool.query(query, [orderUuid]);
      if (res.rows.length === 0) return null;
      return this.mapOrderRow(res.rows[0]);
    } catch (error) {
      console.error("Error fetching order from DB:", error);
      throw error;
    }
  }

  /**
   * Update order status and details in PostgreSQL
   * @param {string} orderUuid 
   * @param {object} updates 
   * @returns {Promise<object|null>}
   */
  async update(orderUuid, updates) {
    // แมปสถานะ 'success' ฝั่งแอปพลิเคชันเป็น 'paid' ในฐานข้อมูล PostgreSQL
    const paymentStatus = updates.status === "success" ? "paid" : updates.status;
    const paidAt = paymentStatus === "paid" ? new Date() : null;

    let addressStr = "";
    if (updates.customerAddress) {
      const addr = updates.customerAddress;
      addressStr = `${addr.street || ""}, ${addr.subdistrict || ""}, ${addr.district || ""}, ${addr.province || ""} ${addr.zipcode || ""}`;
    }

    const query = `
      UPDATE orders 
      SET 
        payment_status = COALESCE($1, payment_status),
        paid_at = COALESCE($2, paid_at),
        customer_name = COALESCE($3, customer_name),
        customer_phone = COALESCE($4, customer_phone),
        customer_email = COALESCE($5, customer_email),
        customer_address = COALESCE($6, customer_address),
        slip_url = COALESCE($7, slip_url)
      WHERE order_uuid = $8
      RETURNING *
    `;
    const values = [
      paymentStatus || null,
      paidAt,
      updates.customerName || null,
      updates.customerPhone || null,
      updates.customerEmail || null,
      addressStr || null,
      updates.slipUrl || null,
      orderUuid
    ];

    try {
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;
      return this.mapOrderRow(res.rows[0]);
    } catch (error) {
      console.error("Error updating order in DB:", error);
      throw error;
    }
  }

  /**
   * Helper เพื่อแมปคอลัมน์จาก DB เป็นออบเจกต์ที่ใช้งานในระบบ
   */
  mapOrderRow(row) {
    return {
      id: row.order_uuid,
      items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
      totalPrice: parseFloat(row.total_amount),
      status: row.payment_status === "paid" ? "success" : row.payment_status,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      customerAddress: row.customer_address,
      slipUrl: row.slip_url,
      createdAt: row.created_at,
      paidAt: row.paid_at,
      fulfillmentStatus: row.fulfillment_status,
      fulfillmentStatusInstock: row.fulfillment_status_instock,
      fulfillmentStatusPreorder: row.fulfillment_status_preorder,
      fulfilledAt: row.fulfilled_at
    };
  }

  /**
   * Fetch all paid and unfulfilled orders
   * @returns {Promise<Array>}
   */
  async getQueue() {
    const query = `
      SELECT * FROM orders 
      WHERE payment_status = 'paid' AND fulfillment_status = 'pending' 
      ORDER BY created_at ASC
    `;
    try {
      const res = await pool.query(query);
      return res.rows.map(row => this.mapOrderRow(row));
    } catch (error) {
      console.error("Error fetching order queue from DB:", error);
      throw error;
    }
  }

  /**
   * Fetch all paid and fulfilled orders (order history)
   * @returns {Promise<Array>}
   */
  async getHistory() {
    const query = `
      SELECT o.*, u.name as handler_name FROM orders o
      LEFT JOIN users u ON o.handler_id = u.id
      WHERE o.payment_status = 'paid' AND o.fulfillment_status = 'fulfilled' 
      ORDER BY o.fulfilled_at DESC
    `;
    try {
      const res = await pool.query(query);
      return res.rows.map(row => {
        const order = this.mapOrderRow(row);
        order.handlerName = row.handler_name;
        return order;
      });
    } catch (error) {
      console.error("Error fetching order history from DB:", error);
      throw error;
    }
  }

  /**
   * Mark order as fulfilled by a staff/admin
   * @param {string} orderUuid 
   * @param {number} handlerId 
   * @returns {Promise<object|null>}
   */
  async fulfill(orderUuid, handlerId) {
    const query = `
      UPDATE orders 
      SET 
        fulfillment_status = 'fulfilled',
        fulfillment_status_instock = 'fulfilled',
        fulfillment_status_preorder = 'fulfilled',
        handler_id = $1,
        fulfilled_at = NOW()
      WHERE order_uuid = $2
      RETURNING *
    `;
    try {
      const res = await pool.query(query, [handlerId, orderUuid]);
      if (res.rows.length === 0) return null;
      return this.mapOrderRow(res.rows[0]);
    } catch (error) {
      console.error("Error fulfilling order in DB:", error);
      throw error;
    }
  }

  async fulfillInStock(orderUuid, handlerId) {
    const query = `
      UPDATE orders 
      SET 
        fulfillment_status_instock = 'fulfilled',
        fulfillment_status = CASE 
          WHEN fulfillment_status_preorder IN ('fulfilled', 'none') THEN 'fulfilled'::varchar
          ELSE fulfillment_status 
        END,
        fulfilled_at = CASE 
          WHEN fulfillment_status_preorder IN ('fulfilled', 'none') THEN NOW()
          ELSE fulfilled_at 
        END,
        handler_id = CASE 
          WHEN fulfillment_status_preorder IN ('fulfilled', 'none') THEN $1
          ELSE handler_id 
        END
      WHERE order_uuid = $2
      RETURNING *
    `;
    try {
      const res = await pool.query(query, [handlerId, orderUuid]);
      if (res.rows.length === 0) return null;
      return this.mapOrderRow(res.rows[0]);
    } catch (error) {
      console.error("Error fulfilling in-stock order in DB:", error);
      throw error;
    }
  }

  async fulfillPreOrder(orderUuid, handlerId) {
    const query = `
      UPDATE orders 
      SET 
        fulfillment_status_preorder = 'fulfilled',
        fulfillment_status = CASE 
          WHEN fulfillment_status_instock IN ('fulfilled', 'none') THEN 'fulfilled'::varchar
          ELSE fulfillment_status 
        END,
        fulfilled_at = CASE 
          WHEN fulfillment_status_instock IN ('fulfilled', 'none') THEN NOW()
          ELSE fulfilled_at 
        END,
        handler_id = CASE 
          WHEN fulfillment_status_instock IN ('fulfilled', 'none') THEN $1
          ELSE handler_id 
        END
      WHERE order_uuid = $2
      RETURNING *
    `;
    try {
      const res = await pool.query(query, [handlerId, orderUuid]);
      if (res.rows.length === 0) return null;
      return this.mapOrderRow(res.rows[0]);
    } catch (error) {
      console.error("Error fulfilling pre-order in DB:", error);
      throw error;
    }
  }

  /**
   * Delete pending orders older than 30 minutes
   * @returns {Promise<number>} Number of deleted orders
   */
  async deleteExpiredPending() {
    const query = `
      DELETE FROM orders 
      WHERE payment_status = 'pending' 
        AND created_at < NOW() - INTERVAL '30 minutes'
    `;
    try {
      const res = await pool.query(query);
      return res.rowCount;
    } catch (error) {
      console.error("Error deleting expired pending orders:", error);
      throw error;
    }
  }
}

export default new OrderRepository();
