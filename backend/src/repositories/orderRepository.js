// backend/src/repositories/orderRepository.js
import pool from "../data/db.js";
import { computePricing } from "../services/promotionService.js";

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
      const timestamp = Date.now();
      return `CAMT-${dateStr}-${timestamp}`;
    }
  }

  /**
   * Helper เพื่อดึง order_items สำหรับ order เดียวหรือหลาย order
   */
  async fetchItemsForOrders(orderIds) {
    if (!orderIds || orderIds.length === 0) return {};
    const query = `
      SELECT oi.*, p.image, p.preorder_release_date, p.pickup_location, p.category_id, c.name AS category_name 
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE oi.order_id = ANY($1) 
      ORDER BY oi.id ASC
    `;
    const res = await pool.query(query, [orderIds]);
    const itemsByOrderId = {};

    res.rows.forEach(row => {
      if (!itemsByOrderId[row.order_id]) {
        itemsByOrderId[row.order_id] = [];
      }
      itemsByOrderId[row.order_id].push({
        id: row.id,
        quantity: row.quantity,
        price: parseFloat(row.unit_price),
        originalPrice: parseFloat(row.original_unit_price ?? row.unit_price),
        fulfillmentStatus: row.fulfillment_status || "pending",
        fulfilledAt: row.fulfilled_at,
        product: {
          id: row.product_id,
          name: row.product_name,
          price: parseFloat(row.unit_price),
          originalPrice: parseFloat(row.original_unit_price ?? row.unit_price),
          status: row.product_status || "In Stock",
          image: row.image,
          imageUrl: row.image,
          preorder_release_date: row.preorder_release_date,
          preorderReleaseDate: row.preorder_release_date,
          pickup_location: row.pickup_location,
          pickupLocation: row.pickup_location,
          category: row.category_id,
          category_name: row.category_name,
          categoryName: row.category_name
        }
      });
    });

    return itemsByOrderId;
  }

  /**
   * Helper เพื่อดึง order_shipments สำหรับ order เดียวหรือหลาย order
   */
  async fetchShipmentsForOrders(orderIds) {
    if (!orderIds || orderIds.length === 0) return {};
    const query = `
      SELECT * FROM order_shipments 
      WHERE order_id = ANY($1) 
      ORDER BY id ASC
    `;
    const res = await pool.query(query, [orderIds]);
    const shipmentsByOrderId = {};
    res.rows.forEach(row => {
      if (!shipmentsByOrderId[row.order_id]) {
        shipmentsByOrderId[row.order_id] = [];
      }
      shipmentsByOrderId[row.order_id].push(row);
    });
    return shipmentsByOrderId;
  }

  /**
   * บันทึกข้อมูลพัสดุของรอบจัดส่งหนึ่ง ๆ — ถ้ามีแถวของ shipment_type นั้นอยู่แล้วให้อัปเดตทับ
   * ไม่ใช่ INSERT แถวใหม่ (กันแถวซ้ำ และกันเคสแก้เลขพัสดุแล้วแถวเก่าชนะตอนอ่าน)
   */
  async upsertShipment(orderDbId, shipmentType, courier, trackingNumber, stampShippedAt = true) {
    const existing = await pool.query(
      `SELECT id FROM order_shipments WHERE order_id = $1 AND shipment_type = $2 ORDER BY id ASC LIMIT 1`,
      [orderDbId, shipmentType]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE order_shipments
            SET courier_name = $1, tracking_number = $2, status = 'shipped'
                ${stampShippedAt ? ", shipped_at = NOW()" : ""}
          WHERE id = $3`,
        [courier || null, trackingNumber || null, existing.rows[0].id]
      );
      return;
    }

    await pool.query(
      `INSERT INTO order_shipments (order_id, shipment_type, courier_name, tracking_number, status, shipped_at)
       VALUES ($1, $2, $3, $4, 'shipped', ${stampShippedAt ? "NOW()" : "NULL"})`,
      [orderDbId, shipmentType, courier || null, trackingNumber || null]
    );
  }

  /**
   * Helper เพื่อแมปคอลัมน์จาก DB เป็นออบเจกต์ที่ใช้งานในระบบ
   */
  mapOrderRow(row, items = [], shipments = []) {
    // เลือกแถวล่าสุดของแต่ละรอบ (fetchShipmentsForOrders เรียง id ASC อยู่แล้ว)
    // เผื่อกรณีข้อมูลเก่าที่มีแถวซ้ำค้างอยู่ใน DB จะได้ไม่โดนแถวเก่าทับ
    const pickLatest = (type) => {
      const matches = shipments.filter(s => s.shipment_type === type);
      return matches.length > 0 ? matches[matches.length - 1] : undefined;
    };
    const combinedShip = pickLatest('combined');
    const instockShip = pickLatest('instock') || combinedShip;
    const preorderShip = pickLatest('preorder') || combinedShip;

    return {
      id: row.order_uuid,
      dbId: row.id,
      items,
      shipments,
      totalPrice: parseFloat(row.total_amount),
      discountTotal: parseFloat(row.discount_total || 0),
      status: row.payment_status === "paid" ? "success" : row.payment_status,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      customerAddress: row.customer_address,
      createdAt: row.created_at,
      paidAt: row.paid_at,
      fulfillmentStatus: row.fulfillment_status,
      fulfillmentStatusInstock: row.fulfillment_status_instock,
      fulfillmentStatusPreorder: row.fulfillment_status_preorder,
      fulfilledAt: row.fulfilled_at,
      deliveryOption: row.delivery_option,
      shippingOption: row.shipping_option,
      trackingNumber1: instockShip ? instockShip.tracking_number : null,
      courier1: instockShip ? instockShip.courier_name : null,
      trackingNumber2: preorderShip ? preorderShip.tracking_number : null,
      courier2: preorderShip ? preorderShip.courier_name : null,
      paymentGatewayRef: row.payment_gateway_ref
    };
  }

  /**
   * คิดราคาต่อชิ้นของทุกรายการใหม่จาก products.price ในฐานข้อมูล บวกส่วนลดที่ใช้อยู่ ณ ตอนสั่ง
   * ถ้าหาสินค้าใน DB ไม่เจอ (เช่นถูกลบไปแล้ว) จะ fallback ไปใช้ราคาที่ส่งมาแทน
   * @param {Array} items รายการจากตะกร้า
   * @returns {Promise<Array<{item: object, productId: number|null, quantity: number, unitPrice: number, originalUnitPrice: number}>>}
   */
  async resolveItemPricing(items) {
    const ids = items
      .map(item => parseInt(item.product?.id || item.id || item.product_id, 10))
      .filter(id => Number.isInteger(id));

    const productMap = new Map();
    if (ids.length > 0) {
      const res = await pool.query(
        "SELECT id, price, promotion, discount_type, discount_value, discount_start_date, discount_end_date FROM products WHERE id = ANY($1)",
        [ids]
      );
      res.rows.forEach(row => productMap.set(row.id, row));
    }

    return items.map(item => {
      const rawId = parseInt(item.product?.id || item.id || item.product_id, 10);
      const productId = Number.isInteger(rawId) ? rawId : null;
      const quantity = parseInt(item.quantity || item.qty || 1, 10);
      const dbRow = productId !== null ? productMap.get(productId) : null;

      if (!dbRow) {
        const fallback = parseFloat(item.product?.price || item.price || 0) || 0;
        console.warn(`[OrderRepository] Product ${productId} not found — ใช้ราคาที่ client ส่งมา (${fallback})`);
        return { item, productId, quantity, unitPrice: fallback, originalUnitPrice: fallback };
      }

      const { price, originalPrice } = computePricing(parseFloat(dbRow.price), dbRow);
      return { item, productId, quantity, unitPrice: price, originalUnitPrice: originalPrice };
    });
  }

  /**
   * Create a new order in PostgreSQL (บันทึก orders + order_items)
   */
  async create(items, totalPrice, deliveryOption = "pickup", shippingOption = "combined") {
    const orderId = await this.generateOrderId();
    const hasInStock = items.some(item => (item.product?.status || item.status) === 'In Stock');
    const hasPreOrder = items.some(item => (item.product?.status || item.status) === 'Pre-Order');
    
    const instockStatus = hasInStock ? 'pending' : 'none';
    const preorderStatus = hasPreOrder ? 'pending' : 'none';

    // คิดราคาต่อชิ้นใหม่จากฐานข้อมูล + ส่วนลดที่ใช้อยู่จริง ไม่เชื่อราคาที่ client ส่งมา
    const priced = await this.resolveItemPricing(items);
    const itemsSubtotal = priced.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const discountTotal = priced.reduce((sum, i) => sum + (i.originalUnitPrice - i.unitPrice) * i.quantity, 0);

    // ค่าจัดส่งยังคิดฝั่ง client อยู่ — ดึงกลับมาจากส่วนต่างของยอดรวมที่ส่งมา
    const shippingFee = Math.max(0, Math.round((totalPrice - itemsSubtotal) * 100) / 100);
    const serverTotal = Math.round((itemsSubtotal + shippingFee) * 100) / 100;

    if (Math.abs(serverTotal - totalPrice) > 0.01) {
      console.warn(
        `[OrderRepository] Client total ${totalPrice} != server total ${serverTotal} ` +
        `(subtotal ${itemsSubtotal}, shipping ${shippingFee}) — ใช้ยอดที่ server คำนวณ`
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert into orders
      const orderQuery = `
        INSERT INTO orders (order_uuid, total_amount, discount_total, payment_status, fulfillment_status_instock, fulfillment_status_preorder, delivery_option, shipping_option)
        VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
        RETURNING *
      `;
      const orderRes = await client.query(orderQuery, [orderId, serverTotal, Math.round(discountTotal * 100) / 100, instockStatus, preorderStatus, deliveryOption, shippingOption]);
      const newOrder = orderRes.rows[0];

      // 2. Insert into order_items
      const mappedItemsForReturn = [];
      for (const priceInfo of priced) {
        const { item, productId: pId, unitPrice: pPrice, originalUnitPrice, quantity: pQty } = priceInfo;
        const pName = item.product?.name || item.name || "สินค้า";
        const pStatus = item.product?.status || item.status || "In Stock";

        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, product_name, unit_price, original_unit_price, quantity, product_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const itemRes = await client.query(itemQuery, [newOrder.id, pId, pName, pPrice, originalUnitPrice, pQty, pStatus]);
        const insertedItem = itemRes.rows[0];

        mappedItemsForReturn.push({
          id: insertedItem.id,
          quantity: insertedItem.quantity,
          price: parseFloat(insertedItem.unit_price),
          product: {
            id: insertedItem.product_id,
            name: insertedItem.product_name,
            price: parseFloat(insertedItem.unit_price),
            originalPrice: parseFloat(insertedItem.original_unit_price ?? insertedItem.unit_price),
            status: insertedItem.product_status,
            image: item.product?.image || item.product?.imageUrl || item.image,
            imageUrl: item.product?.image || item.product?.imageUrl || item.image,
            preorder_release_date: item.product?.preorder_release_date || item.product?.preorderReleaseDate,
            preorderReleaseDate: item.product?.preorder_release_date || item.product?.preorderReleaseDate,
            pickup_location: item.product?.pickup_location || item.product?.pickupLocation,
            pickupLocation: item.product?.pickup_location || item.product?.pickupLocation,
            category: item.product?.category_id || item.product?.category,
            category_name: item.product?.category_name || item.product?.categoryName || item.product?.category_id || item.product?.category,
            categoryName: item.product?.category_name || item.product?.categoryName || item.product?.category_id || item.product?.category
          }
        });
      }

      await client.query("COMMIT");
      return this.mapOrderRow(newOrder, mappedItemsForReturn, []);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating order in DB:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch order by UUID from PostgreSQL
   */
  async get(orderUuid) {
    const query = `SELECT * FROM orders WHERE order_uuid = $1`;
    try {
      const res = await pool.query(query, [orderUuid]);
      if (res.rows.length === 0) return null;

      const orderRow = res.rows[0];
      const itemsMap = await this.fetchItemsForOrders([orderRow.id]);
      const shipmentsMap = await this.fetchShipmentsForOrders([orderRow.id]);
      return this.mapOrderRow(orderRow, itemsMap[orderRow.id] || [], shipmentsMap[orderRow.id] || []);
    } catch (error) {
      console.error("Error fetching order from DB:", error);
      throw error;
    }
  }

  /**
   * Update order status and details in PostgreSQL
   */
  async update(orderUuid, updates) {
    const paymentStatus = updates.status === "success" ? "paid" : updates.status;
    const paidAt = paymentStatus === "paid" ? new Date() : null;

    let addressStr = null;
    if (updates.customerAddress) {
      if (typeof updates.customerAddress === "string") {
        addressStr = updates.customerAddress;
      } else {
        const addr = updates.customerAddress;
        addressStr = `${addr.street || ""}, ${addr.subdistrict || ""}, ${addr.district || ""}, ${addr.province || ""} ${addr.zipcode || ""}`;
      }
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
        delivery_option = COALESCE($7, delivery_option),
        shipping_option = COALESCE($8, shipping_option),
        payment_gateway_ref = COALESCE($9, payment_gateway_ref)
      WHERE order_uuid = $10
      RETURNING *
    `;

    const values = [
      paymentStatus,
      paidAt,
      updates.customerName || null,
      updates.customerPhone || null,
      updates.customerEmail || null,
      addressStr,
      updates.deliveryOption || null,
      updates.shippingOption || null,
      updates.paymentGatewayRef || null,
      orderUuid
    ];

    try {
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;

      const orderRow = res.rows[0];

      if (updates.courier1 || updates.trackingNumber1 || updates.courier || updates.trackingNumber) {
        const c1 = updates.courier1 || updates.courier;
        const t1 = updates.trackingNumber1 || updates.trackingNumber;
        if (c1 || t1) {
          await this.upsertShipment(orderRow.id, 'instock', c1, t1, false);
        }
      }

      if (updates.courier2 || updates.trackingNumber2) {
        await this.upsertShipment(orderRow.id, 'preorder', updates.courier2, updates.trackingNumber2, false);
      }

      const itemsMap = await this.fetchItemsForOrders([orderRow.id]);
      const shipmentsMap = await this.fetchShipmentsForOrders([orderRow.id]);
      return this.mapOrderRow(orderRow, itemsMap[orderRow.id] || [], shipmentsMap[orderRow.id] || []);
    } catch (error) {
      console.error("Error updating order in DB:", error);
      throw error;
    }
  }

  /**
   * Fetch all paid and unfulfilled orders
   */
  async getQueue() {
    const query = `
      SELECT * FROM orders 
      WHERE payment_status = 'paid' 
        AND NOT (
          fulfillment_status = 'fulfilled'
          OR (
            fulfillment_status_instock IN ('fulfilled', 'none') 
            AND fulfillment_status_preorder IN ('fulfilled', 'none')
          )
        )
      ORDER BY created_at ASC
    `;
    try {
      const res = await pool.query(query);
      if (res.rows.length === 0) return [];

      const orderIds = res.rows.map(r => r.id);
      const itemsMap = await this.fetchItemsForOrders(orderIds);
      const shipmentsMap = await this.fetchShipmentsForOrders(orderIds);
      return res.rows.map(row => this.mapOrderRow(row, itemsMap[row.id] || [], shipmentsMap[row.id] || []));
    } catch (error) {
      console.error("Error fetching order queue from DB:", error);
      throw error;
    }
  }

  /**
   * Fetch all paid and fulfilled orders (order history)
   */
  async getHistory() {
    const query = `
      SELECT o.*, u.name as handler_name FROM orders o
      LEFT JOIN users u ON o.handler_id = u.id
      WHERE o.payment_status = 'paid' 
        AND (
          o.fulfillment_status = 'fulfilled' 
          OR (
            o.fulfillment_status_instock IN ('fulfilled', 'none') 
            AND o.fulfillment_status_preorder IN ('fulfilled', 'none')
          )
        )
      ORDER BY o.fulfilled_at DESC NULLS LAST, o.id DESC
    `;
    try {
      const res = await pool.query(query);
      if (res.rows.length === 0) return [];

      const orderIds = res.rows.map(r => r.id);
      const itemsMap = await this.fetchItemsForOrders(orderIds);
      const shipmentsMap = await this.fetchShipmentsForOrders(orderIds);
      return res.rows.map(row => {
        const order = this.mapOrderRow(row, itemsMap[row.id] || [], shipmentsMap[row.id] || []);
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
   */
  async fulfill(orderUuid, handlerId) {
    const query = `
      UPDATE orders 
      SET 
        fulfillment_status = 'fulfilled',
        fulfillment_status_instock = CASE WHEN fulfillment_status_instock = 'pending' THEN 'fulfilled' ELSE fulfillment_status_instock END,
        fulfillment_status_preorder = CASE WHEN fulfillment_status_preorder = 'pending' THEN 'fulfilled' ELSE fulfillment_status_preorder END,
        handler_id = $1,
        fulfilled_at = NOW()
      WHERE order_uuid = $2
      RETURNING *
    `;
    try {
      const res = await pool.query(query, [handlerId, orderUuid]);
      if (res.rows.length === 0) return null;
      const orderRow = res.rows[0];
      const itemsMap = await this.fetchItemsForOrders([orderRow.id]);
      const shipmentsMap = await this.fetchShipmentsForOrders([orderRow.id]);
      return this.mapOrderRow(orderRow, itemsMap[orderRow.id] || [], shipmentsMap[orderRow.id] || []);
    } catch (error) {
      console.error("Error fulfilling order in DB:", error);
      throw error;
    }
  }

  async fulfillInStock(orderUuid, handlerId, courier = null, trackingNumber = null) {
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
      const orderRow = res.rows[0];

      if (courier || trackingNumber) {
        await this.upsertShipment(orderRow.id, 'instock', courier, trackingNumber);
      }

      const itemsMap = await this.fetchItemsForOrders([orderRow.id]);
      const shipmentsMap = await this.fetchShipmentsForOrders([orderRow.id]);
      return this.mapOrderRow(orderRow, itemsMap[orderRow.id] || [], shipmentsMap[orderRow.id] || []);
    } catch (error) {
      console.error("Error fulfilling in-stock order in DB:", error);
      throw error;
    }
  }

  async fulfillPreOrder(orderUuid, handlerId, courier = null, trackingNumber = null) {
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
      const orderRow = res.rows[0];

      if (courier || trackingNumber) {
        await this.upsertShipment(orderRow.id, 'preorder', courier, trackingNumber);
      }

      const itemsMap = await this.fetchItemsForOrders([orderRow.id]);
      const shipmentsMap = await this.fetchShipmentsForOrders([orderRow.id]);
      return this.mapOrderRow(orderRow, itemsMap[orderRow.id] || [], shipmentsMap[orderRow.id] || []);
    } catch (error) {
      console.error("Error fulfilling pre-order in DB:", error);
      throw error;
    }
  }

  /**
   * Fulfill a combined order (both In-Stock and Pre-Order items together)
   */
  async fulfillCombined(orderUuid, handlerId, courier = null, trackingNumber = null) {
    const query = `
      UPDATE orders 
      SET fulfillment_status_instock = 'fulfilled',
          fulfillment_status_preorder = 'fulfilled',
          fulfillment_status = 'fulfilled',
          fulfilled_at = NOW(),
          handler_id = $1
      WHERE order_uuid = $2
      RETURNING *
    `;
    try {
      const res = await pool.query(query, [handlerId, orderUuid]);
      if (res.rows.length === 0) return null;
      const orderRow = res.rows[0];

      // Mark all order_items as fulfilled
      await pool.query(
        `UPDATE order_items SET fulfillment_status = 'fulfilled', fulfilled_at = NOW() WHERE order_id = $1`,
        [orderRow.id]
      );

      if (courier || trackingNumber) {
        await this.upsertShipment(orderRow.id, 'combined', courier, trackingNumber);
      }

      const itemsMap = await this.fetchItemsForOrders([orderRow.id]);
      const shipmentsMap = await this.fetchShipmentsForOrders([orderRow.id]);
      return this.mapOrderRow(orderRow, itemsMap[orderRow.id] || [], shipmentsMap[orderRow.id] || []);
    } catch (error) {
      console.error("Error fulfilling combined order in DB:", error);
      throw error;
    }
  }

  /**
   * Fulfill an individual order item by itemId
   */
  async fulfillItem(itemId, handlerId) {
    try {
      const itemRes = await pool.query(
        `UPDATE order_items 
         SET fulfillment_status = 'fulfilled', fulfilled_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [itemId]
      );

      if (itemRes.rows.length === 0) return null;
      const itemRow = itemRes.rows[0];

      // Check if ALL items for this order are fulfilled
      const allItemsRes = await pool.query(
        `SELECT fulfillment_status FROM order_items WHERE order_id = $1`,
        [itemRow.order_id]
      );

      const allFulfilled = allItemsRes.rows.every(r => r.fulfillment_status === 'fulfilled');

      let orderRow;
      if (allFulfilled) {
        const orderRes = await pool.query(
          `UPDATE orders 
           SET fulfillment_status = 'fulfilled', 
               fulfillment_status_instock = 'fulfilled', 
               fulfillment_status_preorder = 'fulfilled',
               fulfilled_at = NOW(), 
               handler_id = $2 
           WHERE id = $1 
           RETURNING *`,
          [itemRow.order_id, handlerId]
        );
        orderRow = orderRes.rows[0];
      } else {
        const orderRes = await pool.query(
          `SELECT * FROM orders WHERE id = $1`,
          [itemRow.order_id]
        );
        orderRow = orderRes.rows[0];
      }

      const itemsMap = await this.fetchItemsForOrders([orderRow.id]);
      const shipmentsMap = await this.fetchShipmentsForOrders([orderRow.id]);
      return this.mapOrderRow(orderRow, itemsMap[orderRow.id] || [], shipmentsMap[orderRow.id] || []);
    } catch (error) {
      console.error("Error fulfilling item in DB:", error);
      throw error;
    }
  }

  /**
   * Delete a pending order by orderUuid (when user cancels payment)
   */
  async deletePendingOrder(orderUuid) {
    const query = `
      DELETE FROM orders 
      WHERE order_uuid = $1 AND payment_status = 'pending'
      RETURNING *
    `;
    try {
      const res = await pool.query(query, [orderUuid]);
      return res.rows[0] || null;
    } catch (error) {
      console.error("Error deleting pending order:", error);
      throw error;
    }
  }

  /**
   * Delete pending orders older than 30 minutes
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

  async getShippingSettings() {
    const baseFeeRes = await pool.query("SELECT value FROM system_settings WHERE key = 'shipping_base_fee'");
    const splitFeeRes = await pool.query("SELECT value FROM system_settings WHERE key = 'shipping_split_fee'");
    
    return {
      baseShippingFee: parseFloat(baseFeeRes.rows[0]?.value || "40.00"),
      additionalSplitShippingFee: parseFloat(splitFeeRes.rows[0]?.value || "40.00")
    };
  }

  async updateShippingSettings(baseFee, splitFee) {
    if (baseFee !== undefined) {
      await pool.query("INSERT INTO system_settings (key, value) VALUES ('shipping_base_fee', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [baseFee.toString()]);
    }
    if (splitFee !== undefined) {
      await pool.query("INSERT INTO system_settings (key, value) VALUES ('shipping_split_fee', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [splitFee.toString()]);
    }
    return true;
  }
}

export default new OrderRepository();
