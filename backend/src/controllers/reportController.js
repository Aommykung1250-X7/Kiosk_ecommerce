import ExcelJS from "exceljs";
import { format } from "fast-csv";
import { 
    getSummaryStats, 
    getSalesReport, 
    getProductReport, 
    getKioskTrafficReport 
} from "../repositories/reportRepository.js";
import dailyReportService, { TIME_PATTERN } from "../services/dailyReportService.js";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** อ่านวันที่จาก query/body ไม่ระบุ = วันนี้ตามเวลาไทย */
const resolveDateKey = (value) => {
    if (value === undefined || value === null || value === "") {
        return dailyReportService.todayInBangkok();
    }
    if (!DATE_KEY_PATTERN.test(String(value))) return null;
    return String(value);
};

/**
 * พรีวิวสรุปออเดอร์ค้างของวันหนึ่ง — หน้าจอกับอีเมลใช้ข้อมูลชุดเดียวกัน
 * GET /api/admin/reports/daily-digest?date=YYYY-MM-DD
 */
export const getDailyDigestController = async (req, res) => {
    const dateKey = resolveDateKey(req.query.date);
    if (!dateKey) {
        return res.status(400).json({ success: false, error: "รูปแบบวันที่ต้องเป็น YYYY-MM-DD" });
    }

    try {
        const digest = await dailyReportService.buildDigest(dateKey);
        res.json({ success: true, data: digest });
    } catch (err) {
        console.error("Error building daily digest:", err);
        res.status(500).json({ success: false, error: "ไม่สามารถสร้างสรุปออเดอร์ค้างได้" });
    }
};

/**
 * GET /api/admin/reports/daily-digest/settings
 */
export const getDailyDigestSettingsController = async (req, res) => {
    try {
        const settings = await dailyReportService.getSettings();
        // lastSentDate เป็นค่าใช้ภายในของตัวตั้งเวลา ไม่ต้องส่งออกไปให้หน้าจอ
        const { lastSentDate, ...visible } = settings;
        res.json({ success: true, data: visible });
    } catch (err) {
        console.error("Error reading daily digest settings:", err);
        res.status(500).json({ success: false, error: "ไม่สามารถอ่านการตั้งค่ารายงานได้" });
    }
};

/**
 * POST /api/admin/reports/daily-digest/settings
 */
export const updateDailyDigestSettingsController = async (req, res) => {
    const { enabled, email, time } = req.body || {};

    const trimmedEmail = String(email ?? "").trim();
    if (enabled && !trimmedEmail) {
        return res.status(400).json({ success: false, error: "ต้องระบุอีเมลผู้รับก่อนเปิดการส่งอัตโนมัติ" });
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ success: false, error: "รูปแบบอีเมลไม่ถูกต้อง" });
    }
    if (!TIME_PATTERN.test(String(time ?? ""))) {
        return res.status(400).json({ success: false, error: "รูปแบบเวลาต้องเป็น HH:MM เช่น 20:00" });
    }

    try {
        const saved = await dailyReportService.saveSettings({
            enabled: Boolean(enabled),
            email: trimmedEmail,
            time: String(time)
        });
        const { lastSentDate, ...visible } = saved;
        res.json({ success: true, data: visible });
    } catch (err) {
        console.error("Error saving daily digest settings:", err);
        res.status(500).json({ success: false, error: "บันทึกการตั้งค่ารายงานไม่สำเร็จ" });
    }
};

/**
 * ส่งอีเมลสรุปทันทีตามวันที่ที่เลือก (ไม่แตะตัวกันส่งซ้ำของตัวตั้งเวลา)
 * POST /api/admin/reports/daily-digest/send
 */
export const sendDailyDigestController = async (req, res) => {
    const dateKey = resolveDateKey(req.body?.date);
    if (!dateKey) {
        return res.status(400).json({ success: false, error: "รูปแบบวันที่ต้องเป็น YYYY-MM-DD" });
    }

    try {
        const result = await dailyReportService.sendDigest(dateKey, req.body?.email);
        res.json({
            success: true,
            data: { recipient: result.recipient, outstandingCount: result.digest.outstandingCount }
        });
    } catch (err) {
        if (err.statusCode === 400) {
            return res.status(400).json({ success: false, error: err.message });
        }
        console.error("Error sending daily digest:", err);
        res.status(500).json({ success: false, error: "ส่งอีเมลรายงานไม่สำเร็จ ตรวจสอบการตั้งค่า SMTP" });
    }
};

/**
 * Controller สำหรับดึงข้อมูลสรุป Dashboard Preview
 */
export const getSummaryStatsController = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await getSummaryStats(startDate, endDate);
        res.json({ success: true, data: stats });
    } catch (err) {
        console.error("Error getting summary stats:", err);
        res.status(500).json({ success: false, error: "ไม่สามารถดึงข้อมูลสรุปได้" });
    }
};

/**
 * Controller สำหรับ Export รายงานเป็น Excel (.xlsx), CSV (.csv) หรือ PDF (.pdf)
 */
export const exportReportController = async (req, res) => {
    try {
        const { type = "sales", format: exportFormat = "excel", startDate, endDate } = req.query;

        if (exportFormat === "excel") {
            return exportExcelReport(req, res, type, startDate, endDate);
        } else if (exportFormat === "csv") {
            return exportCsvReport(req, res, type, startDate, endDate);
        } else if (exportFormat === "pdf") {
            return exportPdfReport(req, res, type, startDate, endDate);
        } else {
            return res.status(400).json({ success: false, error: "ไม่รองรับรูปแบบไฟล์ที่ระบุ" });
        }
    } catch (err) {
        console.error("Error exporting report:", err);
        res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการส่งออกรายงาน" });
    }
};

/**
 * ฟังก์ชันสร้างไฟล์ Excel (.xlsx)
 */
const exportExcelReport = async (req, res, type, startDate, endDate) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DITC CAMT Kiosk System";
    workbook.created = new Date();

    const timestampStr = new Date().toISOString().split("T")[0];
    let filename = `Report_${type}_${timestampStr}.xlsx`;

    if (type === "sales") {
        filename = `Sales_Report_${timestampStr}.xlsx`;
        const worksheet = workbook.addWorksheet("รายงานสรุปยอดขาย");

        worksheet.columns = [
            { header: "ลำดับ", key: "index", width: 8 },
            { header: "เลขที่คำสั่งซื้อ (UUID)", key: "order_uuid", width: 32 },
            { header: "ชื่อลูกค้า", key: "customer_name", width: 22 },
            { header: "เบอร์โทรศัพท์", key: "customer_phone", width: 16 },
            { header: "อีเมล", key: "customer_email", width: 25 },
            { header: "รูปแบบการรับ", key: "delivery_option", width: 16 },
            { header: "ตัวเลือกการส่ง", key: "shipping_option", width: 18 },
            { header: "สถานะชำระเงิน", key: "payment_status", width: 15 },
            { header: "ยอดเงินรวม (บาท)", key: "total_amount", width: 18 },
            { header: "วันที่ชำระเงิน", key: "paid_at", width: 22 },
            { header: "บริษัทขนส่ง (1)", key: "courier_1", width: 16 },
            { header: "เลข Tracking (1)", key: "tracking_number_1", width: 20 },
            { header: "บริษัทขนส่ง (2)", key: "courier_2", width: 16 },
            { header: "เลข Tracking (2)", key: "tracking_number_2", width: 20 }
        ];

        const rows = await getSalesReport(startDate, endDate);
        let grandTotal = 0;

        rows.forEach((row, i) => {
            const amount = parseFloat(row.total_amount || 0);
            grandTotal += amount;

            worksheet.addRow({
                index: i + 1,
                order_uuid: row.order_uuid,
                customer_name: row.customer_name || "ไม่ระบุ",
                customer_phone: row.customer_phone || "-",
                customer_email: row.customer_email || "-",
                delivery_option: row.delivery_option === "delivery" ? "จัดส่งสินค้า" : "รับสินค้าที่นี่",
                shipping_option: row.shipping_option === "split" ? "แยกจัดส่ง" : "จัดส่งพร้อมกัน",
                payment_status: row.payment_status === "paid" ? "ชำระเงินสำเร็จ" : row.payment_status,
                total_amount: amount,
                paid_at: row.paid_at ? new Date(row.paid_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "-",
                courier_1: row.courier_1 || "-",
                tracking_number_1: row.tracking_number_1 || "-",
                courier_2: row.courier_2 || "-",
                tracking_number_2: row.tracking_number_2 || "-"
            });
        });

        // ตกแต่ง Header Row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1B1B1C" } };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };

        // แถวสรุปผลรวม (Totals Row)
        const summaryRow = worksheet.addRow({
            index: "",
            order_uuid: "สรุปผลรวมทั้งหมด",
            total_amount: grandTotal
        });
        summaryRow.font = { bold: true, color: { argb: "000000" } };
        summaryRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F0F0" } };

    } else if (type === "products") {
        filename = `Product_Report_${timestampStr}.xlsx`;
        const worksheet = workbook.addWorksheet("รายงานสินค้าและคลัง");

        worksheet.columns = [
            { header: "รหัสสินค้า", key: "id", width: 12 },
            { header: "ชื่อสินค้า", key: "name", width: 30 },
            { header: "หมวดหมู่", key: "category", width: 16 },
            { header: "ราคาขาย (บาท)", key: "price", width: 16 },
            { header: "คงเหลือ (ชิ้น)", key: "stock", width: 15 },
            { header: "จำนวนเข้าชม (Views)", key: "views", width: 20 },
            { header: "ยอดขายรวม (ชิ้น)", key: "unitsSold", width: 18 },
            { header: "รายได้รวม (บาท)", key: "totalRevenue", width: 18 },
            { header: "อัตราการซื้อ (Conversion)", key: "conversionRate", width: 22 },
            { header: "สถานะสินค้า", key: "status", width: 15 }
        ];

        const rows = await getProductReport(startDate, endDate);
        rows.forEach(row => worksheet.addRow(row));

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1B1B1C" } };

    } else if (type === "kiosk") {
        filename = `Kiosk_Traffic_Report_${timestampStr}.xlsx`;
        const worksheet = workbook.addWorksheet("สถิติการใช้งานตู้");

        worksheet.columns = [
            { header: "ช่วงเวลา (ชั่วโมง)", key: "hour", width: 20 },
            { header: "จำนวนออเดอร์ (รายการ)", key: "orders", width: 22 },
            { header: "รายได้รวม (บาท)", key: "revenue", width: 20 }
        ];

        const data = await getKioskTrafficReport(startDate, endDate);
        data.hourlyDistribution.forEach(row => worksheet.addRow(row));

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1B1B1C" } };
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
};

/**
 * ฟังก์ชันสร้างไฟล์ CSV (.csv) พร้อม UTF-8 BOM สำหรับภาษาไทย
 */
const exportCsvReport = async (req, res, type, startDate, endDate) => {
    const timestampStr = new Date().toISOString().split("T")[0];
    const filename = `${type}_Report_${timestampStr}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // ใส่ UTF-8 BOM (\uFEFF) หน้าสุดของไฟล์ CSV เพื่อให้ Microsoft Excel บน Windows/Mac อ่านภาษาไทยได้ถูกต้อง
    res.write("\uFEFF");

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    if (type === "sales") {
        const rows = await getSalesReport(startDate, endDate);
        rows.forEach(r => {
            csvStream.write({
                "Order UUID": r.order_uuid,
                "Customer Name": r.customer_name || "N/A",
                "Customer Phone": r.customer_phone || "-",
                "Customer Email": r.customer_email || "-",
                "Delivery Option": r.delivery_option === "delivery" ? "จัดส่งสินค้า" : "รับสินค้าที่นี่",
                "Total Amount (THB)": r.total_amount,
                "Payment Status": r.payment_status,
                "Paid Date": r.paid_at ? new Date(r.paid_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "-"
            });
        });
    } else if (type === "products") {
        const rows = await getProductReport(startDate, endDate);
        rows.forEach(r => {
            csvStream.write({
                "Product ID": r.id,
                "Product Name": r.name,
                "Category": r.category,
                "Price": r.price,
                "Stock": r.stock,
                "Views": r.views,
                "Units Sold": r.unitsSold,
                "Total Revenue": r.totalRevenue,
                "Conversion Rate": r.conversionRate
            });
        });
    } else if (type === "kiosk") {
        const data = await getKioskTrafficReport(startDate, endDate);
        data.hourlyDistribution.forEach(r => {
            csvStream.write({
                "Time Slot": r.hour,
                "Order Count": r.orders,
                "Total Revenue (THB)": r.revenue
            });
        });
    }

    csvStream.end();
};

/**
 * ฟังก์ชันสร้าง PDF Report เป็น Printable HTML Page
 */
const exportPdfReport = async (req, res, type, startDate, endDate) => {
    const timestampStr = new Date().toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let title = "รายงานสรุปยอดขายและการเงิน";
    let tableHeaders = ["#", "Order UUID", "ชื่อลูกค้า", "การรับสินค้า", "ยอดเงินรวม (บาท)", "วันที่ชำระเงิน"];
    let tableRows = [];

    if (type === "sales") {
        title = "รายงานสรุปยอดขายและการเงิน (Sales Report)";
        const rows = await getSalesReport(startDate, endDate);
        tableRows = rows.map((r, idx) => `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${r.order_uuid}</td>
                <td>${r.customer_name || 'ไม่ระบุ'}</td>
                <td>${r.delivery_option === 'delivery' ? 'จัดส่งพัสดุ' : 'รับหน้าร้าน'}</td>
                <td style="text-align:right; font-weight:bold;">${parseFloat(r.total_amount).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                <td>${r.paid_at ? new Date(r.paid_at).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }) : '-'}</td>
            </tr>
        `);
    } else if (type === "products") {
        title = "รายงานวิเคราะห์ประสิทธิภาพสินค้า (Product Performance)";
        tableHeaders = ["ID", "ชื่อสินค้า", "หมวดหมู่", "ราคา", "คงเหลือ", "ยอดเข้าชม", "ขายได้ (ชิ้น)", "รายได้รวม (บาท)"];
        const rows = await getProductReport(startDate, endDate);
        tableRows = rows.map(r => `
            <tr>
                <td style="text-align:center;">${r.id}</td>
                <td><strong>${r.name}</strong></td>
                <td>${r.category}</td>
                <td style="text-align:right;">${r.price.toFixed(2)}</td>
                <td style="text-align:center;">${r.stock}</td>
                <td style="text-align:center;">${r.views}</td>
                <td style="text-align:center;">${r.unitsSold}</td>
                <td style="text-align:right; font-weight:bold;">${r.totalRevenue.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
        `);
    } else if (type === "kiosk") {
        title = "รายงานสถิติการใช้งานตู้ Kiosk (Kiosk Traffic Log)";
        tableHeaders = ["ช่วงเวลา", "จำนวนคำสั่งซื้อ", "รายได้รวม (บาท)"];
        const data = await getKioskTrafficReport(startDate, endDate);
        tableRows = data.hourlyDistribution.map(r => `
            <tr>
                <td style="text-align:center;">${r.hour}</td>
                <td style="text-align:center;">${r.orders} รายการ</td>
                <td style="text-align:right; font-weight:bold;">${r.revenue.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
            </tr>
        `);
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
                body {
                    font-family: 'Sarabun', sans-serif;
                    margin: 40px;
                    color: #1b1b1c;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #5EBAA8;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .logo-title {
                    font-size: 20px;
                    font-weight: bold;
                    color: #1b1b1c;
                }
                .subtitle {
                    font-size: 13px;
                    color: #666;
                    margin-top: 4px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                th {
                    background-color: #1b1b1c;
                    color: #ffffff;
                    padding: 10px;
                    font-size: 12px;
                    text-align: left;
                }
                td {
                    padding: 8px 10px;
                    border-bottom: 1px solid #eee;
                    font-size: 12px;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .footer {
                    margin-top: 30px;
                    text-align: right;
                    font-size: 11px;
                    color: #888;
                }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo-title">DITC CAMT Kiosk e-Commerce</div>
                    <div class="subtitle">${title}</div>
                </div>
                <div style="text-align: right; font-size: 12px; color: #555;">
                    วันที่พิมพ์: ${timestampStr}<br>
                    ออกรายงานโดย: ระบบผู้ดูแลระบบ (Admin)
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows.join('')}
                </tbody>
            </table>

            <div class="footer">
                เอกสารนี้สร้างขึ้นแบบอัตโนมัติจากระบบ DITC CAMT Kiosk Store Management
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(htmlContent);
};
