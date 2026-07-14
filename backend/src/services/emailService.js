// backend/src/services/emailService.js
import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = null;
    this.transporterInitialized = false;
  }

  /**
   * Initialize nodemailer transporter if credentials are provided in env.
   */
  initTransporter() {
    if (this.transporterInitialized) return;
    this.transporterInitialized = true;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === "true";

    if (host && user && pass) {
      console.log(`[EmailService] SMTP credentials detected. Initializing SMTP transport for ${host}...`);
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port || "587", 10),
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      console.log("[EmailService] No SMTP settings found in environment variables. Running in DEVELOPMENT MOCK MODE.");
    }
  }

  /**
   * Generate premium HTML receipt template.
   * @param {object} order 
   * @returns {string} HTML content
   */
  generateReceiptHtml(order) {
    const orderId = order.id || "N/A";
    const dateStr = order.paidAt
      ? new Date(order.paidAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
      : new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

    // Check if there is any pre-order item in the order
    const inStockItems = (order.items || []).filter(item => item.product?.status === "In Stock");
    const hasInStock = inStockItems.length > 0;
    const preOrderItems = (order.items || []).filter(item => item.product?.status === "Pre-Order");
    const hasPreOrder = preOrderItems.length > 0;

    const shippingFee = hasPreOrder ? 40 : 0;
    const itemsSubtotal = parseFloat(order.totalPrice || 0) - shippingFee;

    // Collect unique pickup locations for in-stock items
    const pickupLocations = [...new Set(inStockItems.map(item => item.product?.pickup_location).filter(Boolean))];
    const pickupLocationsStr = pickupLocations.length > 0 ? pickupLocations.join(", ") : "ตู้จำหน่ายสินค้าของสถาบัน DIIC";

    let fulfillmentMethodStr = "";
    if (hasInStock && hasPreOrder) {
      fulfillmentMethodStr = "รับหน้าร้าน และ จัดส่งพัสดุ";
    } else if (hasPreOrder) {
      fulfillmentMethodStr = "จัดส่งทางพัสดุ (Delivery)";
    } else {
      fulfillmentMethodStr = "รับสินค้าหน้าร้าน (Store Pickup)";
    }

    const getCategoryEmoji = (category) => {
      const map = {
        drinks: "🥤",
        snacks: "🍿",
        instant: "🍜",
        stationery: "✏️"
      };
      return map[category] || "📦";
    };

    const getCategoryName = (category) => {
      const map = {
        drinks: "เครื่องดื่ม (Drinks)",
        snacks: "ขนมขบเคี้ยว (Snacks)",
        instant: "อาหารกึ่งสำเร็จรูป",
        stationery: "เครื่องเขียน"
      };
      return map[category] || "สินค้าทั่วไป";
    };

    const itemsHtml = (order.items || []).map(item => {
      const name = item.product?.name || "สินค้าไม่ระบุชื่อ";
      const quantity = item.quantity || 1;
      const price = parseFloat(item.product?.price || 0);
      const category = item.product?.category || "drinks";
      const emoji = getCategoryEmoji(category);
      const categoryName = getCategoryName(category);

      const isPreOrder = item.product?.status === "Pre-Order";
      const badgeHtml = isPreOrder
        ? ` <span style="background-color: #FF6B00; color: #FFFFFF; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 4px; margin-left: 5px; display: inline-block; vertical-align: middle;">Pre-Order</span>`
        : "";

      return `
        <!-- Product Item Row -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px; border-bottom: 1px solid #2C2E30; padding-bottom: 16px;">
          <tr>
            <!-- Left: Icon box styled as thumbnail -->
            <td width="55" style="vertical-align: top;">
              <div style="width: 48px; height: 48px; background-color: #2C2E30; border-radius: 8px; text-align: center; line-height: 48px; font-size: 22px;">
                ${emoji}
              </div>
            </td>
            <!-- Right: Product Information -->
            <td style="vertical-align: top; padding-left: 12px; text-align: left;">
              <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #FFFFFF; line-height: 1.4;">
                ${name}${badgeHtml}
              </h4>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #888888;">
                หมวดหมู่: ${categoryName}
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 13px; font-weight: bold; color: #FFA800; text-align: left;">
                    ฿${price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="font-size: 12px; color: #AAAAAA; text-align: right;">
                    x ${quantity}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }).join("");

    let pickupDeliveryBoxHtml = "";
    if (hasInStock && hasPreOrder) {
      pickupDeliveryBoxHtml = `
              <!-- Both In-Stock and Pre-Order Items -->
              <div style="background-color: #1A1B1C; border-radius: 8px; border: 1px solid #2C2E30; padding: 14px 16px; margin-top: 8px;">
                <!-- In Stock Section -->
                <span style="font-size: 11px; font-weight: bold; color: #FFA800; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🏪 ส่วนสินค้าพร้อมส่ง (STORE PICKUP)
                </span>
                <span style="font-size: 12px; color: #CCCCCC; line-height: 1.5; display: block; margin-bottom: 12px;">
                  <strong>สถานที่รับสินค้า:</strong> ${pickupLocationsStr}
                </span>

                <!-- Pre-Order Section -->
                <span style="font-size: 11px; font-weight: bold; color: #FFA800; text-transform: uppercase; display: block; margin-bottom: 6px; border-top: 1px solid #2C2E30; padding-top: 12px;">
                  🚚 ส่วนสินค้าสั่งซื้อล่วงหน้า (Pre-Order Items)
                </span>
                <span style="font-size: 12px; color: #CCCCCC; line-height: 1.5; display: block; margin-bottom: 4px;">
                  <strong>กำหนดจัดส่ง:</strong> สำหรับสินค้า Pre-Order สินค้าจะจัดส่งประมาณ 15-20 วัน
                </span>
                <span style="font-size: 12px; color: #CCCCCC; line-height: 1.5; display: block;">
                  <strong>ที่อยู่จัดส่ง:</strong> ${order.customerName} , ${order.customerAddress || "ไม่ได้ระบุที่อยู่จัดส่ง"}
                </span>
              </div>
      `;
    } else if (hasPreOrder) {
      pickupDeliveryBoxHtml = `
              <!-- Pre-Order Only Items -->
              <div style="background-color: #1A1B1C; border-radius: 8px; border: 1px solid #2C2E30; padding: 14px 16px; margin-top: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: #FFA800; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🚚 จัดส่งทางพัสดุ (Delivery)
                </span>
                <span style="font-size: 12px; color: #CCCCCC; line-height: 1.5; display: block; margin-bottom: 4px;">
                  <strong>กำหนดจัดส่ง:</strong> สินค้าจะจัดส่งประมาณ 15-20 วัน
                </span>
                <span style="font-size: 12px; color: #CCCCCC; line-height: 1.5; display: block;">
                  <strong>ที่อยู่จัดส่ง:</strong> ${order.customerName} , ${order.customerAddress || "ไม่ได้ระบุที่อยู่จัดส่ง"}
                </span>
              </div>
      `;
    } else {
      pickupDeliveryBoxHtml = `
              <!-- In-Stock Only Items -->
              <div style="background-color: #1A1B1C; border-radius: 8px; border: 1px solid #2C2E30; padding: 14px 16px; margin-top: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: #FFA800; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🏪 รับสินค้าหน้าร้าน (Store Pickup)
                </span>
                <span style="font-size: 12px; color: #CCCCCC; line-height: 1.5; display: block;">
                  <strong>สถานที่รับสินค้า:</strong> ${pickupLocationsStr}
                </span>
                <span style="font-size: 11px; color: #888888; display: block; margin-top: 6px;">
                  *กรุณานำหมายเลขคำสั่งซื้อนี้ไปรับสินค้ากับทาง Staff ณ ที่รับสินค้า
                </span>
              </div>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยืนยันคำสั่งซื้อของคุณแล้ว!</title>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700;850;900&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #161819; font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161819; padding: 20px 10px;">
    <tr>
      <td align="center">
        
        <!-- Main TikTok-inspired Mobile-first Wrapper -->
        <table width="100%" class="container" style="max-width: 500px; background-color: #161819; border-collapse: collapse;">
          
          <!-- Gradient Top Brand Banner (Orange to Yellow) -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00 0%, #FFA800 100%); border-top-left-radius: 12px; border-top-right-radius: 12px; padding: 24px; text-align: center; border-bottom: 2px solid #FF6B00;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: 1px; text-transform: uppercase;">
                DIIC SHOP
              </h2>
              <p style="margin: 3px 0 0 0; font-size: 10px; color: #FFFFFF; font-weight: 500; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px;">
                CAMT KIOSK E-COMMERCE
              </p>
            </td>
          </tr>

          <!-- Card 1: Greetings & Confirmation Message -->
          <tr>
            <td style="background-color: #212325; border-bottom: 1px solid #161819; padding: 28px 24px; text-align: left;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 850; color: #FFFFFF; line-height: 1.3;">
                ยืนยันคำสั่งซื้อของคุณแล้ว!
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 13.5px; color: #E5E5E5; font-weight: 500;">
                สวัสดี คุณ ${order.customerName || "ลูกค้าผู้มีอุปการคุณ"}!
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #CCCCCC; line-height: 1.6;">
                ยืนยันคำสั่งซื้อเรียบร้อยแล้ว สินค้าที่พร้อมรับสามารถเข้ารับสินค้าได้ตามสถานที่ที่แจ้งและสินค้า Pre-Order จะจัดส่งตามไปในภายหลัง ขอบคุณครับ/ค่ะ
              </p>
              <p style="margin: 0; font-size: 12.5px; font-weight: bold; color: #FFA800;">
                ทีมงาน DIIC Shop Kiosk
              </p>
            </td>
          </tr>

          <!-- Card 2: Items List Card -->
          <tr>
            <td style="background-color: #212325; border-bottom: 1px solid #161819; padding: 24px 24px 8px 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: #FFA800; text-transform: uppercase; letter-spacing: 0.8px;">
                รายการสินค้าในคำสั่งซื้อ
              </h3>
              ${itemsHtml}
            </td>
          </tr>

          <!-- Card 3: Order Metadata & Shipping Info -->
          <tr>
            <td style="background-color: #212325; border-bottom: 1px solid #161819; padding: 24px; text-align: left;">
              <h3 style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: #FFA800; text-transform: uppercase; letter-spacing: 0.8px;">
                รายละเอียดการสั่งซื้อ
              </h3>
              
              <!-- Info Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="font-size: 12px; color: #888888; padding: 4px 0;">หมายเลขคำสั่งซื้อ:</td>
                  <td style="font-size: 12px; font-weight: bold; color: #FFFFFF; text-align: right; font-family: monospace;">
                    ${orderId}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #888888; padding: 4px 0;">วันที่ชำระเงิน:</td>
                  <td style="font-size: 12px; color: #E5E5E5; text-align: right;">
                    ${dateStr}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #888888; padding: 4px 0;">ช่องทางการรับสินค้า:</td>
                  <td style="font-size: 12px; font-weight: bold; color: #E5E5E5; text-align: right;">
                    ${fulfillmentMethodStr}
                  </td>
                </tr>
              </table>

              ${pickupDeliveryBoxHtml}
            </td>
          </tr>

          <!-- Card 4: Financial Summary Card (Calculations) -->
          <tr>
            <td style="background-color: #212325; padding: 24px; text-align: left; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 12px; color: #888888; padding: 6px 0;">ยอดรวมค่าสินค้า (Subtotal):</td>
                  <td style="font-size: 12px; color: #E5E5E5; text-align: right; padding: 6px 0;">
                    ฿${itemsSubtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #888888; padding: 6px 0;">ค่าจัดส่ง (Shipping Fee):</td>
                  <td style="font-size: 12px; color: #E5E5E5; text-align: right; padding: 6px 0;">
                    ฿${shippingFee.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style="border-top: 1px dashed #2C2E30;">
                  <td style="font-size: 14px; font-weight: bold; color: #FFFFFF; padding: 16px 0 0 0;">ยอดรวมสุทธิ (Total):</td>
                  <td style="font-size: 18px; font-weight: 900; color: #FF6B00; text-align: right; padding: 16px 0 0 0;">
                    ฿${parseFloat(order.totalPrice || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Legal & Disclaimer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #666666;">
                อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ กรุณาอย่าตอบกลับอีเมลนี้
              </p>
              <p style="margin: 0; font-size: 11px; color: #555555;">
                &copy; ${new Date().getFullYear()} DIIC CAMT. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Send the email receipt to the customer.
   * Runs asynchronously as non-blocking.
   * @param {object} order 
   * @param {string} customerEmail 
   */
  async sendReceipt(order, customerEmail) {
    this.initTransporter();

    if (!customerEmail || !customerEmail.includes("@")) {
      console.log(`[EmailService] Invalid or missing email address: "${customerEmail}". Skipping sending email.`);
      return;
    }

    const htmlContent = this.generateReceiptHtml(order);

    if (this.transporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"DIIC Shop Kiosk" <no-reply@diic-kiosk.com>',
        to: customerEmail.trim(),
        subject: `[DIIC Shop Kiosk] ใบเสร็จรับเงินสำหรับคำสั่งซื้อ #${order.id}`,
        html: htmlContent,
      };

      try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email receipt sent successfully to ${customerEmail}. MessageId: ${info.messageId}`);
      } catch (error) {
        console.error(`[EmailService] Failed to send email receipt to ${customerEmail}:`, error);
      }
    } else {
      // DEVELOPMENT MOCK LOGGING
      console.log("\n========================================================");
      console.log("             [EmailService] [MOCK SENDING]");
      console.log(`To:      ${customerEmail}`);
      console.log(`Subject: [DIIC Shop Kiosk] ใบเสร็จสำหรับคำสั่งซื้อ #${order.id}`);
      console.log(`Order:   ${order.id}`);
      console.log(`Total:   ฿${order.totalPrice}`);
      console.log(`Items:`);
      (order.items || []).forEach(item => {
        console.log(`  - ${item.product?.name} (x${item.quantity}) - ฿${item.product?.price * item.quantity}`);
      });
      console.log(`Ship To: ${order.customerName} - Phone: ${order.customerPhone}`);
      console.log(`Address: ${order.customerAddress}`);
      console.log("========================================================\n");
    }
  }

  /**
   * Send shipment tracking email notification to the customer.
   * Runs asynchronously as non-blocking.
   * @param {object} order 
   */
  async sendShipmentNotification(order) {
    this.initTransporter();

    const customerEmail = order.customerEmail;
    if (!customerEmail || !customerEmail.includes("@")) {
      console.log(`[EmailService] Invalid or missing email address: "${customerEmail}". Skipping shipment notification.`);
      return;
    }

    const courierMap = {
      thailandpost: "ไปรษณีย์ไทย (EMS)",
      flash: "Flash Express",
      kerry: "Kerry Express",
      jt: "J&T Express"
    };
    const courierName = courierMap[order.courier] || order.courier || "บริการจัดส่งทั่วไป";
    const trackingNo = order.trackingNumber || "N/A";
    
    // Create tracking links dynamically
    let trackingLink = "#";
    const cleanTracking = trackingNo.trim();
    if (order.courier === "thailandpost") trackingLink = `https://track.thailandpost.co.th/?trackNumber=${cleanTracking}`;
    else if (order.courier === "flash") trackingLink = `https://www.flashexpress.co.th/tracking/?k=${cleanTracking}`;
    else if (order.courier === "kerry") trackingLink = `https://th.kerryexpress.com/th/track/?track=${cleanTracking}`;
    else if (order.courier === "jt") trackingLink = `https://www.jtexpress.co.th/index/query/route.html?billcode=${cleanTracking}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>แจ้งจัดส่งสินค้าสั่งซื้อล่วงหน้า (Pre-Order)</title>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700;850;900&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #161819; font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #161819; padding: 20px 10px;">
    <tr>
      <td align="center">
        
        <!-- Main TikTok-inspired Mobile-first Wrapper -->
        <table width="100%" class="container" style="max-width: 500px; background-color: #161819; border-collapse: collapse;">
          
          <!-- Gradient Top Brand Banner (Orange to Yellow) -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00 0%, #FFA800 100%); border-top-left-radius: 12px; border-top-right-radius: 12px; padding: 24px; text-align: center; border-bottom: 2px solid #FF6B00;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: 1px; text-transform: uppercase;">
                DIIC SHOP
              </h2>
              <p style="margin: 3px 0 0 0; font-size: 10px; color: #FFFFFF; font-weight: 500; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px;">
                CAMT KIOSK E-COMMERCE
              </p>
            </td>
          </tr>

          <!-- Card 1: Main Notification Message -->
          <tr>
            <td style="background-color: #212325; border-bottom: 1px solid #161819; padding: 28px 24px; text-align: left;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 850; color: #FFFFFF; line-height: 1.3;">
                สินค้าสั่งซื้อล่วงหน้าถูกจัดส่งแล้ว!
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 13.5px; color: #E5E5E5; font-weight: 500;">
                สวัสดี คุณ ${order.customerName || "ลูกค้าผู้มีอุปการคุณ"}!
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #CCCCCC; line-height: 1.6;">
                เราขอแจ้งให้ทราบว่า รายการสินค้าสั่งซื้อล่วงหน้า (Pre-Order) ในคำสั่งซื้อหมายเลข <strong>#${order.id}</strong> ได้รับการแพ็กและส่งมอบให้กับทางบริษัทขนส่งเรียบร้อยแล้ว!
              </p>
              <p style="margin: 0; font-size: 12.5px; font-weight: bold; color: #FFA800;">
                ทีมงาน DIIC Shop Kiosk
              </p>
            </td>
          </tr>

          <!-- Card 2: Tracking details -->
          <tr>
            <td style="background-color: #212325; border-bottom: 1px solid #161819; padding: 24px; text-align: left;">
              <h3 style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: #FFA800; text-transform: uppercase; letter-spacing: 0.8px;">
                ข้อมูลการจัดส่งพัสดุ
              </h3>
              
              <!-- Info Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="font-size: 12.5px; color: #888888; padding: 6px 0;">ผู้ให้บริการขนส่ง (Courier):</td>
                  <td style="font-size: 12.5px; font-weight: bold; color: #FFFFFF; text-align: right;">
                    ${courierName}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12.5px; color: #888888; padding: 6px 0;">เลขพัสดุ (Tracking Number):</td>
                  <td style="font-size: 13px; font-weight: bold; color: #FF6B00; text-align: right; font-family: monospace;">
                    ${trackingNo}
                  </td>
                </tr>
              </table>

              <!-- Call to Action button -->
              <div style="text-align: center; margin: 24px 0 8px 0;">
                <a href="${trackingLink}" target="_blank" style="background: linear-gradient(135deg, #FF6B00 0%, #FFA800 100%); color: #FFFFFF; padding: 12px 28px; border-radius: 25px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 13.5px; box-shadow: 0 4px 12px rgba(255,107,0,0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                  ตรวจสอบสถานะพัสดุ
                </a>
              </div>
            </td>
          </tr>

          <!-- Card 3: Shipping Address Card -->
          <tr>
            <td style="background-color: #212325; padding: 24px; text-align: left; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
              <div style="background-color: #1A1B1C; border-radius: 8px; border: 1px solid #2C2E30; padding: 14px 16px;">
                <span style="font-size: 11px; font-weight: bold; color: #FFA800; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  ที่อยู่จัดส่งสินค้า
                </span>
                <span style="font-size: 12.5px; color: #CCCCCC; line-height: 1.5; display: block;">
                  <strong>ผู้รับ:</strong> ${order.customerName}<br>
                  <strong>ที่อยู่:</strong> ${order.customerAddress || "ไม่ได้ระบุที่อยู่จัดส่ง"}
                </span>
              </div>
            </td>
          </tr>

          <!-- Footer Legal & Disclaimer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #666666;">
                อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ กรุณาอย่าตอบกลับอีเมลนี้
              </p>
              <p style="margin: 0; font-size: 11px; color: #555555;">
                &copy; ${new Date().getFullYear()} DIIC CAMT. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (this.transporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"DIIC Shop Kiosk" <no-reply@diic-kiosk.com>',
        to: customerEmail.trim(),
        subject: `[DIIC Shop Kiosk] แจ้งจัดส่งสินค้าสำหรับคำสั่งซื้อ #${order.id}`,
        html: htmlContent,
      };

      try {
        await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Shipment notification sent successfully to ${customerEmail}.`);
      } catch (error) {
        console.error(`[EmailService] Failed to send shipment notification to ${customerEmail}:`, error);
      }
    } else {
      // DEVELOPMENT MOCK LOGGING
      console.log("\n========================================================");
      console.log("    [EmailService] [MOCK SHIPMENT NOTIFICATION]");
      console.log(`To:      ${customerEmail}`);
      console.log(`Subject: [DIIC Shop Kiosk] แจ้งจัดส่งสินค้าสำหรับคำสั่งซื้อ #${order.id}`);
      console.log(`Courier: ${courierName}`);
      console.log(`Tracking: ${trackingNo}`);
      console.log(`Link:    ${trackingLink}`);
      console.log("========================================================\n");
    }
  }
}

export default new EmailService();
