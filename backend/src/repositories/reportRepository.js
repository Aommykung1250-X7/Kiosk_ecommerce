import pool from "../data/db.js";

/**
 * Helper ปรับรูปแบบวันที่เป็น Timestamp ครอบคลุมทั้งวัน (00:00:00 ถึง 23:59:59)
 */
const prepareDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const startTimestamp = startDate.includes(" ") || startDate.includes("T") ? startDate : `${startDate} 00:00:00`;
    const endTimestamp = endDate.includes(" ") || endDate.includes("T") ? endDate : `${endDate} 23:59:59`;
    return { startTimestamp, endTimestamp };
};

/**
 * ดึงสถิติภาพรวมสำหรับ Admin Dashboard (KPI Cards & Charts)
 */
export const getSummaryStats = async (startDate, endDate) => {
    let dateFilter = "";
    const queryParams = [];

    const dateRange = prepareDateRange(startDate, endDate);
    if (dateRange) {
        dateFilter = "AND created_at >= $1 AND created_at <= $2";
        queryParams.push(dateRange.startTimestamp, dateRange.endTimestamp);
    }

    // 1. ยอดขายรวม (Total Revenue) และ จำนวนออเดอร์ที่ชำระเงินแล้ว
    const salesQuery = `
        SELECT 
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COUNT(id) AS paid_orders_count
        FROM orders
        WHERE payment_status = 'paid' ${dateFilter}
    `;
    const salesRes = await pool.query(salesQuery, queryParams);

    // 2. จำนวนสินค้าคงเหลือ และ สินค้าทั้งหมด
    const productsRes = await pool.query(`
        SELECT 
            COUNT(id) AS total_products,
            COALESCE(SUM(stock), 0) AS total_stock,
            COUNT(CASE WHEN stock <= 5 THEN 1 END) AS low_stock_count
        FROM products
    `);

    // 3. จำนวน session wakeups ตู้ Kiosk
    const kioskStatsRes = await pool.query(`
        SELECT value FROM kiosk_stats WHERE key = 'session_wakeups'
    `);
    const totalWakeups = kioskStatsRes.rows.length > 0 ? parseInt(kioskStatsRes.rows[0].value, 10) : 0;

    // 4. สรุปรายได้แยกตามรูปแบบการรับสินค้า (Pick up vs Delivery)
    const deliveryOptionQuery = `
        SELECT 
            COALESCE(delivery_option, 'pickup') AS delivery_option,
            COUNT(id) AS order_count,
            COALESCE(SUM(total_amount), 0) AS total_amount
        FROM orders
        WHERE payment_status = 'paid' ${dateFilter}
        GROUP BY COALESCE(delivery_option, 'pickup')
    `;
    const deliveryOptionRes = await pool.query(deliveryOptionQuery, queryParams);

    // 5. สรุปรายได้รายวัน (Daily Revenue Trend)
    const dailyTrendQuery = `
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
            COUNT(id) AS orders_count,
            COALESCE(SUM(total_amount), 0) AS daily_revenue
        FROM orders
        WHERE payment_status = 'paid' ${dateFilter}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
    `;
    const dailyTrendRes = await pool.query(dailyTrendQuery, queryParams);

    // 6. รายงานสินค้าเพิ่มเติมสำหรับพรีวิวบน UI
    const productReportList = await getProductReport(startDate, endDate);

    // 7. รายงานการใช้งานตู้เพิ่มเติมสำหรับพรีวิวบน UI
    const kioskTrafficData = await getKioskTrafficReport(startDate, endDate);

    return {
        totalRevenue: parseFloat(salesRes.rows[0].total_revenue),
        paidOrdersCount: parseInt(salesRes.rows[0].paid_orders_count, 10),
        totalProducts: parseInt(productsRes.rows[0].total_products, 10),
        totalStock: parseInt(productsRes.rows[0].total_stock, 10),
        lowStockCount: parseInt(productsRes.rows[0].low_stock_count, 10),
        totalWakeups,
        deliveryBreakdown: deliveryOptionRes.rows,
        dailyTrend: dailyTrendRes.rows,
        productReportList,
        hourlyDistribution: kioskTrafficData.hourlyDistribution,
        popularTags: kioskTrafficData.popularTags
    };
};

/**
 * ดึงรายงานสรุปยอดขาย (Sales Report) ละเอียดรายออเดอร์
 */
export const getSalesReport = async (startDate, endDate) => {
    let dateFilter = "";
    const queryParams = [];

    const dateRange = prepareDateRange(startDate, endDate);
    if (dateRange) {
        dateFilter = "WHERE created_at >= $1 AND created_at <= $2";
        queryParams.push(dateRange.startTimestamp, dateRange.endTimestamp);
    }

    const query = `
        SELECT 
            id,
            order_uuid,
            total_amount,
            payment_status,
            fulfillment_status,
            delivery_option,
            shipping_option,
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            paid_at,
            created_at
        FROM orders
        ${dateFilter}
        ORDER BY created_at DESC
    `;

    const res = await pool.query(query, queryParams);
    return res.rows;
};

/**
 * ดึงรายงานวิเคราะห์ประสิทธิภาพสินค้า (Product Report) ด้วย SQL JOIN ตาราง order_items แบบ 100%
 */
export const getProductReport = async (startDate, endDate) => {
    let orderDateFilter = "";
    const queryParams = [];

    const dateRange = prepareDateRange(startDate, endDate);
    if (dateRange) {
        orderDateFilter = "AND o.created_at >= $1 AND o.created_at <= $2";
        queryParams.push(dateRange.startTimestamp, dateRange.endTimestamp);
    }

    const query = `
        SELECT 
            p.id,
            p.name,
            COALESCE(c.name, 'ทั่วไป') AS category,
            p.price,
            p.stock,
            p.views,
            p.status,
            COALESCE(p.pickup_location, 'หน้าร้าน') AS pickup_location,
            COALESCE(SUM(CASE WHEN o.payment_status = 'paid' ${orderDateFilter} THEN oi.quantity ELSE 0 END), 0) AS units_sold,
            COALESCE(SUM(CASE WHEN o.payment_status = 'paid' ${orderDateFilter} THEN (oi.quantity * oi.unit_price) ELSE 0 END), 0) AS total_revenue
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        GROUP BY p.id, p.name, c.name, p.price, p.stock, p.views, p.status, p.pickup_location
        ORDER BY views DESC, p.id ASC
    `;

    const res = await pool.query(query, queryParams);

    return res.rows.map(row => {
        const views = parseInt(row.views || 0, 10);
        const unitsSold = parseInt(row.units_sold || 0, 10);
        const totalRevenue = parseFloat(row.total_revenue || 0);
        const conversionRate = views > 0 ? ((unitsSold / views) * 100).toFixed(2) : "0.00";

        return {
            id: row.id,
            name: row.name,
            category: row.category,
            price: parseFloat(row.price),
            stock: parseInt(row.stock, 10),
            views,
            unitsSold,
            totalRevenue,
            conversionRate: `${conversionRate}%`,
            status: row.status,
            pickupLocation: row.pickup_location
        };
    });
};

/**
 * ดึงรายงานสถิติการใช้งานตู้ (Kiosk Traffic Report)
 */
export const getKioskTrafficReport = async (startDate, endDate) => {
    let dateFilter = "";
    const queryParams = [];

    const dateRange = prepareDateRange(startDate, endDate);
    if (dateRange) {
        dateFilter = "AND created_at >= $1 AND created_at <= $2";
        queryParams.push(dateRange.startTimestamp, dateRange.endTimestamp);
    }

    // 1. สถิติคำสั่งซื้อแยกตามช่วงเวลาของวัน (Hourly Traffic Breakdown 00:00 - 23:00)
    const hourlyQuery = `
        SELECT 
            EXTRACT(HOUR FROM created_at) AS hour_of_day,
            COUNT(id) AS order_count,
            COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM orders
        WHERE payment_status = 'paid' ${dateFilter}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour_of_day ASC
    `;
    const hourlyRes = await pool.query(hourlyQuery, queryParams);

    // 2. ดึง session wakeups
    const kioskStatsRes = await pool.query(`
        SELECT value FROM kiosk_stats WHERE key = 'session_wakeups'
    `);
    const totalWakeups = kioskStatsRes.rows.length > 0 ? parseInt(kioskStatsRes.rows[0].value, 10) : 0;

    // 3. ดึงคำค้นหายอดนิยมจาก system_settings
    const searchTagsRes = await pool.query(`
        SELECT value FROM system_settings WHERE key = 'popular_search_tags'
    `);
    let popularTags = [];
    if (searchTagsRes.rows.length > 0 && searchTagsRes.rows[0].value) {
        try {
            popularTags = JSON.parse(searchTagsRes.rows[0].value);
        } catch (e) {
            popularTags = [];
        }
    }

    return {
        totalWakeups,
        popularTags,
        hourlyDistribution: hourlyRes.rows.map(r => ({
            hour: `${String(r.hour_of_day).padStart(2, '0')}:00`,
            orders: parseInt(r.order_count, 10),
            revenue: parseFloat(r.total_revenue)
        }))
    };
};
