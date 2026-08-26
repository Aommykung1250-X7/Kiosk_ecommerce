// backend/src/services/emailService.js
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const formatThaiDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Bangkok"
    });
  } catch (err) {
    const date = new Date(dateVal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  }
};

/**
 * ชุดสีของอีเมล — ยกมาจากหน้าจอหลักสินค้าบนตู้โดยตรง
 * (Header.jsx / Home.jsx / ProductCard.jsx / index.css)
 * ถ้าเปลี่ยนสีบนตู้เมื่อไหร่ ให้แก้ที่นี่ที่เดียว ไม่ต้องไล่แก้ในเทมเพลต
 */
const THEME = {
  pageBg:     "#F8F8F8", // พื้นหลังแอป (--color-app-bg)
  card:       "#FFFFFF", // การ์ดสินค้า
  tile:       "#F4F5F7", // กรอบรูปสินค้าใน ProductCard
  panel:      "#F1F4F8", // กล่องข้อมูล (pill ที่ไม่ถูกเลือกใน Sidebar)
  line:       "#E5E7EB", // เส้นคั่น (border-gray-200)
  navy:       "#0E1B3E", // แถบหัวใน Header.jsx
  yellow:     "#FABE2C", // ปุ่ม CART
  yellowSoft: "#FFF9E6", // พื้นเหลืองอ่อน (SupportModal / KioskPayment)
  ink:        "#1B1B1C", // ตัวอักษรบนพื้นเหลือง
  text:       "#111827", // หัวข้อ / ราคา (text-gray-900)
  body:       "#1F2937", // เนื้อความ (text-gray-800)
  sub:        "#374151", // ข้อความรอง (text-gray-700)
  muted:      "#6B7280", // ป้ายกำกับ (text-gray-500)
  faint:      "#9CA3AF", // ลิขสิทธิ์ (text-gray-400)
  preorder:   "#F5A623", // ป้าย PRE-ORDER บนการ์ด
  preorderTx: "#E65100", // ข้อความวันพร้อมรับสินค้า
  sale:       "#E01E5A", // ราคาลด / ส่วนลด
  white:      "#FFFFFF",
};

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
   * หัวอีเมล: โลโก้ DITC บนพื้นกรมท่า — ชุดเดียวกับมุมซ้ายบนของหน้าจอหลักสินค้า
   * แนบไฟล์แบบ CID เพราะอีเมลส่วนใหญ่บล็อกรูปจาก URL ภายนอก
   * ถ้าหาไฟล์โลโก้ไม่เจอ จะถอยไปใช้ตัวอักษรแทน เพื่อไม่ให้อีเมลพัง
   * @returns {{ html: string, attachment: object|null }}
   */
  buildBrandHeader() {
    const bannerStyle = `background-color: ${THEME.navy}; border-top-left-radius: 12px; border-top-right-radius: 12px; padding: 24px; text-align: center; border-bottom: 3px solid ${THEME.yellow};`;
    const logoPath = path.join(process.cwd(), "assets", "ditc_logo.png");

    if (!fs.existsSync(logoPath)) {
      console.warn(`[EmailService] Logo not found at ${logoPath}. Falling back to text header.`);
      return {
        attachment: null,
        html: `<td bgcolor="${THEME.navy}" style="${bannerStyle}">
              <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: ${THEME.white}; letter-spacing: 1px; text-transform: uppercase;">
                DITC SHOP
              </h2>
            </td>`,
      };
    }

    // โลโก้ต้นฉบับ 326x108 — ย่อลงครึ่งหนึ่งให้คมบนจอความละเอียดสูง
    return {
      attachment: { filename: "ditc_logo.png", path: logoPath, cid: "ditc_logo" },
      html: `<td bgcolor="${THEME.navy}" style="${bannerStyle}">
              <img src="cid:ditc_logo" alt="DITC" width="109" height="36" style="display: block; margin: 0 auto; width: 109px; height: 36px; border: 0; outline: none; text-decoration: none;" />
            </td>`,
    };
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

    const itemsSubtotal = (order.items || []).reduce((acc, item) => acc + (parseFloat(item.product?.price || 0) * (item.quantity || 1)), 0);
    const shippingFee = Math.max(0, parseFloat(order.totalPrice || 0) - itemsSubtotal);
    // ส่วนลดโปรโมชั่นที่ใช้ไปตอนสั่ง — คิดจากราคาเต็มที่บันทึกไว้คู่กับราคาที่ขายจริง
    const discountTotal = (order.items || []).reduce(
      (acc, item) => acc + ((parseFloat(item.product?.originalPrice ?? item.product?.price ?? 0) - parseFloat(item.product?.price || 0)) * (item.quantity || 1)),
      0
    );
    const grossSubtotal = itemsSubtotal + discountTotal;

    // Collect unique pickup locations for in-stock items
    const pickupLocations = [...new Set(inStockItems.map(item => item.product?.pickup_location || item.product?.pickupLocation).filter(Boolean))];
    const pickupLocationsStr = pickupLocations.length > 0 ? pickupLocations.join(", ") : "ตู้จำหน่ายสินค้าของสถาบัน DITC";

    let fulfillmentMethodStr = "";
    if (order.deliveryOption === "delivery") {
      fulfillmentMethodStr = order.shippingOption === "split" ? "แยกจัดส่งพัสดุ (Split Shipping)" : "จัดส่งพัสดุรวมกัน (Combined Shipping)";
    } else {
      fulfillmentMethodStr = "รับสินค้าหน้าร้าน (Store Pickup)";
    }

    // Build formatted preorder items date list & find latest preorder date
    let latestPreorderDateStr = "";
    let preorderItemsDateListHtml = "";
    if (hasPreOrder) {
      const dates = preOrderItems
        .map(item => item.product?.preorder_release_date || item.product?.preorderReleaseDate)
        .filter(Boolean)
        .map(d => new Date(d));
      
      if (dates.length > 0) {
        const latestDate = new Date(Math.max(...dates));
        if (!isNaN(latestDate.getTime())) {
          latestPreorderDateStr = formatThaiDate(latestDate);
        }
      }

      preorderItemsDateListHtml = preOrderItems.map(item => {
        const pName = item.product?.name || "สินค้า Pre-Order";
        const pDate = item.product?.preorder_release_date || item.product?.preorderReleaseDate;
        const pDateFormatted = pDate ? formatThaiDate(pDate) : "จะแจ้งให้ทราบภายหลัง";
        return `<div style="margin-top: 3px; color: ${THEME.preorderTx}; font-weight: bold;">• ${pName}: พร้อมรับ/จัดส่งตั้งแต่วันที่ ${pDateFormatted}</div>`;
      }).join("");
    }
    const latestPreorderDateText = latestPreorderDateStr || "จะแจ้งให้ทราบภายหลัง";

    const getCategoryEmoji = (categoryKey) => {
      const key = (categoryKey || "").toLowerCase();
      const map = {
        drinks: "🥤",
        snacks: "🍿",
        instant: "🍜",
        stationery: "✏️",
        souvenirs: "🎁",
        toy: "🧸",
        sweet: "🍬"
      };
      return map[key] || "📦";
    };

    const getCategoryName = (item) => {
      const explicitName = item.product?.category_name || item.product?.categoryName;
      if (explicitName && explicitName.trim() !== "") {
        return explicitName.trim();
      }

      const catKey = (item.product?.category || item.product?.category_id || "").toLowerCase();
      const map = {
        drinks: "เครื่องดื่ม (Drinks)",
        snacks: "ขนมขบเคี้ยว (Snacks)",
        instant: "อาหารกึ่งสำเร็จรูป",
        stationery: "เครื่องเขียน",
        souvenirs: "ของที่ระลึก",
        toy: "ของเล่น",
        sweet: "ขนมหวาน"
      };
      return map[catKey] || catKey || "สินค้าทั่วไป";
    };

    const attachments = [];

    const brand = this.buildBrandHeader();
    if (brand.attachment) attachments.push(brand.attachment);

    const itemsHtml = (order.items || []).map((item, index) => {
      const name = item.product?.name || "สินค้าไม่ระบุชื่อ";
      const quantity = item.quantity || 1;
      const price = parseFloat(item.product?.price || 0);
      const categoryKey = item.product?.category || item.product?.category_id || "drinks";
      const emoji = getCategoryEmoji(categoryKey);
      const categoryName = getCategoryName(item);

      const isPreOrder = item.product?.status === "Pre-Order";
      const badgeHtml = isPreOrder
        ? ` <span style="background-color: ${THEME.preorder}; color: ${THEME.white}; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 4px; margin-left: 5px; display: inline-block; vertical-align: middle;">Pre-Order</span>`
        : "";

      const releaseDateVal = item.product?.preorder_release_date || item.product?.preorderReleaseDate;
      const releaseDateHtml = isPreOrder
        ? `<div style="margin: 4px 0 6px 0; font-size: 11.5px; color: ${THEME.preorderTx}; font-weight: bold; text-align: left;">
             📅 เริ่มจัดส่ง/พร้อมรับสินค้า: ${releaseDateVal ? formatThaiDate(releaseDateVal) : "จะแจ้งให้ทราบภายหลัง"}
           </div>`
        : "";

      const rawImage = item.product?.image || item.product?.imageUrl || item.product?.image_url;
      let thumbnailHtml = "";
      if (rawImage && typeof rawImage === "string" && rawImage.trim() !== "") {
        let imageUrl = rawImage;
        const filename = rawImage.replace(/^\/?(uploads\/products\/|uploads\/)/, "");
        const localFilePath = path.join(process.cwd(), "uploads", "products", filename);

        if (fs.existsSync(localFilePath)) {
          const cid = `prod_img_${item.product?.id || index}_${index}`;
          attachments.push({
            filename: filename,
            path: localFilePath,
            cid: cid
          });
          imageUrl = `cid:${cid}`;
        } else if (!rawImage.startsWith("http://") && !rawImage.startsWith("https://") && !rawImage.startsWith("data:")) {
          const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
          const cleanImgPath = rawImage.startsWith("/") ? rawImage : `/uploads/products/${rawImage}`;
          imageUrl = `${backendUrl}${cleanImgPath}`;
        }

        thumbnailHtml = `
          <div style="width: 48px; height: 48px; background-color: ${THEME.tile}; border-radius: 8px; overflow: hidden; border: 1px solid ${THEME.line};">
            <img src="${imageUrl}" alt="${name}" width="48" height="48" style="width: 48px; height: 48px; object-fit: cover; display: block; border-radius: 8px;" />
          </div>
        `;
      } else {
        thumbnailHtml = `
          <div style="width: 48px; height: 48px; background-color: ${THEME.tile}; border-radius: 8px; text-align: center; line-height: 48px; font-size: 22px;">
            ${emoji}
          </div>
        `;
      }

      return `
        <!-- Product Item Row -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px; border-bottom: 1px solid ${THEME.line}; padding-bottom: 16px;">
          <tr>
            <!-- Left: Thumbnail image or Emoji fallback -->
            <td width="55" style="vertical-align: top;">
              ${thumbnailHtml}
            </td>
            <!-- Right: Product Information -->
            <td style="vertical-align: top; padding-left: 12px; text-align: left;">
              <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: ${THEME.text}; line-height: 1.4;">
                ${name}${badgeHtml}
              </h4>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: ${THEME.muted};">
                หมวดหมู่: ${categoryName}
              </p>
              ${releaseDateHtml}
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 13px; font-weight: bold; color: ${THEME.text}; text-align: left;">
                    ฿${price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td style="font-size: 12px; color: ${THEME.muted}; text-align: right;">
                    x ${quantity}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }).join("");

    const isDelivery = order.deliveryOption === "delivery";
    const isSplit = order.shippingOption === "split";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const deliveryFormUrl = `${frontendUrl}/mobile/delivery?orderId=${orderId}`;

    let pickupDeliveryBoxHtml = "";
    if (isDelivery) {
      const buttonHtml = `
        <div style="text-align: center; margin: 18px 0 6px 0;">
          <a href="${deliveryFormUrl}" style="background-color: ${THEME.yellow}; color: ${THEME.ink}; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(250, 190, 44, 0.35);">
            กรอกรายละเอียดการจัดส่งสินค้า
          </a>
        </div>
      `;

      if (hasInStock && hasPreOrder) {
        pickupDeliveryBoxHtml = `
              <!-- Both In-Stock and Pre-Order Items (Delivery) -->
              <div style="background-color: ${THEME.panel}; border-radius: 8px; border: 1px solid ${THEME.line}; padding: 14px 16px; margin-top: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🚚 จัดส่งทางพัสดุ (Delivery) - ${isSplit ? "แยกจัดส่งสินค้า (Split Shipping)" : "จัดส่งพร้อมกันทั้งหมด (Combined)"}
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.5; display: block; margin-bottom: 4px;">
                  <strong>การจัดส่ง:</strong> ${isSplit ? `สินค้าพร้อมส่ง (In Stock) จะส่งให้ทันที ส่วนสินค้าสั่งซื้อล่วงหน้า (Pre-Order) เริ่มจัดส่งตั้งแต่วันที่: ${latestPreorderDateText}` : `เริ่มจัดส่งสินค้าทั้งหมดพร้อมกันเมื่อผลิตครบ (คาดว่าเริ่มจัดส่งตั้งแต่วันที่: ${latestPreorderDateText})`}
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.5; display: block; margin-bottom: 4px;">
                  <strong>ที่อยู่จัดส่ง:</strong> ${order.customerName || "ยังไม่ได้ระบุที่อยู่"} ${order.customerAddress ? `, ${order.customerAddress}` : ""}
                </span>
                ${order.customerAddress ? "" : buttonHtml}
              </div>
        `;
      } else {
        pickupDeliveryBoxHtml = `
              <!-- Single Type Items (Delivery) -->
              <div style="background-color: ${THEME.panel}; border-radius: 8px; border: 1px solid ${THEME.line}; padding: 14px 16px; margin-top: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🚚 จัดส่งทางพัสดุ (Delivery)
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.5; display: block; margin-bottom: 4px;">
                  <strong>การจัดส่ง:</strong> ${hasPreOrder ? `เริ่มจัดส่งสินค้าตั้งแต่วันที่: ${latestPreorderDateText}` : "จัดส่งพัสดุไปยังที่อยู่ของลูกค้า"}
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.5; display: block; margin-bottom: 4px;">
                  <strong>ที่อยู่จัดส่ง:</strong> ${order.customerName || "ยังไม่ได้ระบุที่อยู่"} ${order.customerAddress ? `, ${order.customerAddress}` : ""}
                </span>
                ${order.customerAddress ? "" : buttonHtml}
              </div>
        `;
      }
    } else {
      if (hasInStock && hasPreOrder) {
        pickupDeliveryBoxHtml = `
              <!-- Store Pickup Box (In-Stock + Pre-Order) -->
              <div style="background-color: ${THEME.panel}; border-radius: 8px; border: 1px solid ${THEME.line}; padding: 14px 16px; margin-top: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🏪 รับสินค้าหน้าร้าน (Store Pickup)
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.6; display: block; margin-bottom: 6px;">
                  <strong>1. สินค้าพร้อมส่ง (In Stock):</strong> รับสินค้าได้ทันที ณ <strong>${pickupLocationsStr}</strong>
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.6; display: block;">
                  <strong>2. สินค้าพรีออเดอร์ (Pre-Order):</strong>
                  ${preorderItemsDateListHtml || `<div style="margin-top: 3px; color: ${THEME.preorderTx}; font-weight: bold;">คาดว่าพร้อมรับตั้งแต่วันที่: ${latestPreorderDateText}</div>`}
                </span>
                <span style="font-size: 11px; color: ${THEME.muted}; display: block; margin-top: 8px;">
                  *กรุณานำหมายเลขคำสั่งซื้อนี้ไปติดต่อรับสินค้ากับทางพนักงาน ณ จุดให้บริการ
                </span>
              </div>
        `;
      } else if (hasPreOrder) {
        pickupDeliveryBoxHtml = `
              <!-- Store Pickup Box (Pre-Order Only) -->
              <div style="background-color: ${THEME.panel}; border-radius: 8px; border: 1px solid ${THEME.line}; padding: 14px 16px; margin-top: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🏪 รับสินค้าหน้าร้าน (Store Pickup)
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.6; display: block;">
                  <strong>กำหนดการรับสินค้า Pre-Order:</strong>
                  ${preorderItemsDateListHtml || `<div style="margin-top: 3px; color: ${THEME.preorderTx}; font-weight: bold;">คาดว่าพร้อมรับตั้งแต่วันที่: ${latestPreorderDateText}</div>`}
                </span>
                <span style="font-size: 11px; color: ${THEME.muted}; display: block; margin-top: 8px;">
                  *กรุณานำหมายเลขคำสั่งซื้อนี้ไปติดต่อรับสินค้ากับทางพนักงาน ณ จุดให้บริการ
                </span>
              </div>
        `;
      } else {
        pickupDeliveryBoxHtml = `
              <!-- Store Pickup Box (In-Stock Only) -->
              <div style="background-color: ${THEME.panel}; border-radius: 8px; border: 1px solid ${THEME.line}; padding: 14px 16px; margin-top: 8px;">
                <span style="font-size: 11px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  🏪 รับสินค้าหน้าร้าน (Store Pickup)
                </span>
                <span style="font-size: 12px; color: ${THEME.sub}; line-height: 1.5; display: block;">
                  <strong>ข้อมูลการรับสินค้า:</strong> รับสินค้าพร้อมส่งได้ทันที ณ <strong>${pickupLocationsStr}</strong>
                </span>
                <span style="font-size: 11px; color: ${THEME.muted}; display: block; margin-top: 6px;">
                  *กรุณานำหมายเลขคำสั่งซื้อนี้ไปติดต่อรับสินค้ากับทางพนักงาน ณ จุดให้บริการ
                </span>
              </div>
        `;
      }
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>ยืนยันคำสั่งซื้อของคุณแล้ว!</title>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700;850;900&display=swap" rel="stylesheet">
</head>
<body bgcolor="${THEME.pageBg}" style="margin: 0; padding: 0; background-color: ${THEME.pageBg}; font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${THEME.pageBg}" style="background-color: ${THEME.pageBg}; padding: 20px 10px;">
    <tr>
      <td align="center">
        
        <!-- กรอบอีเมลกว้าง 500px ธีมสว่างเหมือนหน้าจอหลักสินค้า -->
        <table width="100%" class="container" bgcolor="${THEME.pageBg}" style="max-width: 500px; background-color: ${THEME.pageBg}; border-collapse: collapse;">
          
          <!-- แถบหัวแบรนด์ กรมท่า + เส้นใต้เหลือง (ชุดสีเดียวกับ Header บนตู้) -->
          <tr>
            ${brand.html}
          </tr>

          <!-- Card 1: Greetings & Confirmation Message -->
          <tr>
            <td bgcolor="${THEME.card}" style="background-color: ${THEME.card}; border-bottom: 1px solid ${THEME.line}; padding: 28px 24px; text-align: left;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 850; color: ${THEME.text}; line-height: 1.3;">
                ยืนยันคำสั่งซื้อของคุณแล้ว!
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 13.5px; color: ${THEME.body}; font-weight: 500;">
                สวัสดี คุณ ${order.customerName || "ลูกค้าผู้มีอุปการคุณ"}!
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: ${THEME.sub}; line-height: 1.6;">
                ยืนยันคำสั่งซื้อเรียบร้อยแล้ว สินค้าที่พร้อมรับสามารถเข้ารับสินค้าได้ตามสถานที่ที่แจ้งและสินค้า Pre-Order จะจัดส่งตามไปในภายหลัง ขอบคุณครับ/ค่ะ
              </p>
              <p style="margin: 0; font-size: 12.5px; font-weight: bold; color: ${THEME.navy};">
                ทีมงาน DITC Shop Kiosk
              </p>
            </td>
          </tr>

          <!-- Card 2: Items List Card -->
          <tr>
            <td bgcolor="${THEME.card}" style="background-color: ${THEME.card}; border-bottom: 1px solid ${THEME.line}; padding: 24px 24px 8px 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; letter-spacing: 0.8px;">
                รายการสินค้าในคำสั่งซื้อ
              </h3>
              ${itemsHtml}
            </td>
          </tr>

          <!-- Card 3: Order Metadata & Shipping Info -->
          <tr>
            <td bgcolor="${THEME.card}" style="background-color: ${THEME.card}; border-bottom: 1px solid ${THEME.line}; padding: 24px; text-align: left;">
              <h3 style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; letter-spacing: 0.8px;">
                รายละเอียดการสั่งซื้อ
              </h3>
              
              <!-- Info Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="font-size: 12px; color: ${THEME.muted}; padding: 4px 0;">หมายเลขคำสั่งซื้อ:</td>
                  <td style="font-size: 12px; font-weight: bold; color: ${THEME.text}; text-align: right; font-family: monospace;">
                    ${orderId}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: ${THEME.muted}; padding: 4px 0;">วันที่ชำระเงิน:</td>
                  <td style="font-size: 12px; color: ${THEME.body}; text-align: right;">
                    ${dateStr}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: ${THEME.muted}; padding: 4px 0;">ช่องทางการรับสินค้า:</td>
                  <td style="font-size: 12px; font-weight: bold; color: ${THEME.body}; text-align: right;">
                    ${fulfillmentMethodStr}
                  </td>
                </tr>
              </table>

              ${pickupDeliveryBoxHtml}
            </td>
          </tr>

          <!-- Card 4: Financial Summary Card (Calculations) -->
          <tr>
            <td bgcolor="${THEME.card}" style="background-color: ${THEME.card}; padding: 24px; text-align: left; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 12px; color: ${THEME.muted}; padding: 6px 0;">ยอดรวมค่าสินค้า (Subtotal):</td>
                  <td style="font-size: 12px; color: ${THEME.body}; text-align: right; padding: 6px 0;">
                    ฿${grossSubtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                ${discountTotal > 0 ? `
                <tr>
                  <td style="font-size: 12px; color: ${THEME.muted}; padding: 6px 0;">ส่วนลดโปรโมชั่น (Discount):</td>
                  <td style="font-size: 12px; color: ${THEME.sale}; text-align: right; padding: 6px 0;">
                    -฿${discountTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>` : ""}
                <tr>
                  <td style="font-size: 12px; color: ${THEME.muted}; padding: 6px 0;">ค่าจัดส่ง (Shipping Fee):</td>
                  <td style="font-size: 12px; color: ${THEME.body}; text-align: right; padding: 6px 0;">
                    ฿${shippingFee.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td bgcolor="${THEME.yellowSoft}" style="background-color: ${THEME.yellowSoft}; border-left: 3px solid ${THEME.yellow}; border-top: 1px solid ${THEME.line}; border-bottom: 1px solid ${THEME.line}; font-size: 14px; font-weight: bold; color: ${THEME.navy}; padding: 14px 12px;">ยอดรวมสุทธิ (Total):</td>
                  <td bgcolor="${THEME.yellowSoft}" style="background-color: ${THEME.yellowSoft}; border-top: 1px solid ${THEME.line}; border-bottom: 1px solid ${THEME.line}; font-size: 18px; font-weight: 900; color: ${THEME.navy}; text-align: right; padding: 14px 12px;">
                    ฿${parseFloat(order.totalPrice || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Legal & Disclaimer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: ${THEME.muted};">
                อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ กรุณาอย่าตอบกลับอีเมลนี้
              </p>
              <p style="margin: 0; font-size: 11px; color: ${THEME.faint};">
                &copy; ${new Date().getFullYear()} DITC CAMT. All rights reserved.
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

    return { htmlContent, attachments };
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

    const { htmlContent, attachments } = this.generateReceiptHtml(order);

    if (this.transporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"DITC Shop Kiosk" <no-reply@ditc-kiosk.com>',
        to: customerEmail.trim(),
        subject: `[DITC Shop Kiosk] ใบเสร็จรับเงินสำหรับคำสั่งซื้อ #${order.id}`,
        html: htmlContent,
        attachments: attachments || []
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
      console.log(`Subject: [DITC Shop Kiosk] ใบเสร็จสำหรับคำสั่งซื้อ #${order.id}`);
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
   * @param {object} [details]
   */
  async sendShipmentNotification(order, details = {}) {
    this.initTransporter();

    const customerEmail = order.customerEmail;
    if (!customerEmail || !customerEmail.includes("@")) {
      console.log(`[EmailService] Invalid or missing email address: "${customerEmail}". Skipping shipment notification.`);
      return;
    }

    const courierCode = details.courier || order.courier || order.courier1 || order.courier2 || "";
    const trackingNo = details.trackingNumber || order.trackingNumber || order.trackingNumber1 || order.trackingNumber2 || "N/A";
    const shipmentType = details.type || (order.fulfillmentStatusInstock === 'fulfilled' && order.fulfillmentStatusPreorder !== 'fulfilled' ? "instock" : "preorder");

    const courierMap = {
      thailandpost: "ไปรษณีย์ไทย (EMS)",
      flash: "Flash Express",
      kerry: "Kerry Express (KEX)",
      jt: "J&T Express",
      ninja: "Ninja Van"
    };
    const courierName = courierMap[courierCode] || courierCode || "บริการจัดส่งทั่วไป";
    
    // Create tracking links dynamically (main tracking portal without parameters)
    let trackingLink = "#";
    if (courierCode === "thailandpost") trackingLink = "https://track.thailandpost.co.th/";
    else if (courierCode === "flash") trackingLink = "https://www.flashexpress.co.th/tracking/";
    else if (courierCode === "kerry") trackingLink = "https://th.kex-express.com/th/track/";
    else if (courierCode === "jt") trackingLink = "https://www.jtexpress.co.th/index/query/route.html";
    else if (courierCode === "ninja") trackingLink = "https://www.ninjavan.co/th-th/tracking";

    let titleText = "แจ้งจัดส่งพัสดุสินค้า";
    let headingText = "พัสดุสินค้าของคุณถูกจัดส่งแล้ว!";
    let bodyText = `เราขอแจ้งให้ทราบว่า รายการสินค้าในคำสั่งซื้อหมายเลข <strong>#${order.id}</strong> ได้รับการแพ็กและส่งมอบให้กับทางบริษัทขนส่งเรียบร้อยแล้ว!`;

    if (shipmentType === "combined" || order.shippingOption === "combined") {
      titleText = "แจ้งจัดส่งพัสดุแบบรวมส่ง (Combined Shipping)";
      headingText = "พัสดุจัดส่งรวมของคุณถูกจัดส่งแล้ว!";
      bodyText = `เราขอแจ้งให้ทราบว่า รายการสินค้าทั้งหมดในคำสั่งซื้อแบบรวมส่ง (Combined Shipping) หมายเลข <strong>#${order.id}</strong> ได้รับการแพ็กและส่งมอบให้กับทางบริษัทขนส่งเรียบร้อยแล้ว!`;
    } else if (shipmentType === "instock") {
      titleText = "แจ้งจัดส่งสินค้าพร้อมส่ง (In Stock)";
      headingText = "สินค้าพร้อมส่งถูกจัดส่งแล้ว!";
      bodyText = `เราขอแจ้งให้ทราบว่า รายการสินค้าพร้อมส่ง (In Stock) ในคำสั่งซื้อหมายเลข <strong>#${order.id}</strong> ได้รับการแพ็กและส่งมอบให้กับทางบริษัทขนส่งเรียบร้อยแล้ว!`;
    } else if (shipmentType === "preorder") {
      titleText = "แจ้งจัดส่งสินค้าสั่งซื้อล่วงหน้า (Pre-Order)";
      headingText = "สินค้าสั่งซื้อล่วงหน้าถูกจัดส่งแล้ว!";
      bodyText = `เราขอแจ้งให้ทราบว่า รายการสินค้าสั่งซื้อล่วงหน้า (Pre-Order) ในคำสั่งซื้อหมายเลข <strong>#${order.id}</strong> ได้รับการแพ็กและส่งมอบให้กับทางบริษัทขนส่งเรียบร้อยแล้ว!`;
    }

    const brand = this.buildBrandHeader();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${titleText}</title>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;700;850;900&display=swap" rel="stylesheet">
</head>
<body bgcolor="${THEME.pageBg}" style="margin: 0; padding: 0; background-color: ${THEME.pageBg}; font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${THEME.pageBg}" style="background-color: ${THEME.pageBg}; padding: 20px 10px;">
    <tr>
      <td align="center">
        
        <!-- กรอบอีเมลกว้าง 500px ธีมสว่างเหมือนหน้าจอหลักสินค้า -->
        <table width="100%" class="container" bgcolor="${THEME.pageBg}" style="max-width: 500px; background-color: ${THEME.pageBg}; border-collapse: collapse;">
          
          <!-- แถบหัวแบรนด์ กรมท่า + เส้นใต้เหลือง (ชุดสีเดียวกับ Header บนตู้) -->
          <tr>
            ${brand.html}
          </tr>

          <!-- Card 1: Main Notification Message -->
          <tr>
            <td bgcolor="${THEME.card}" style="background-color: ${THEME.card}; border-bottom: 1px solid ${THEME.line}; padding: 28px 24px; text-align: left;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 850; color: ${THEME.text}; line-height: 1.3;">
                ${headingText}
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 13.5px; color: ${THEME.body}; font-weight: 500;">
                สวัสดี คุณ ${order.customerName || "ลูกค้าผู้มีอุปการคุณ"}!
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: ${THEME.sub}; line-height: 1.6;">
                ${bodyText}
              </p>
              <p style="margin: 0; font-size: 12.5px; font-weight: bold; color: ${THEME.navy};">
                ทีมงาน DITC Shop Kiosk
              </p>
            </td>
          </tr>

          <!-- Card 2: Tracking details -->
          <tr>
            <td bgcolor="${THEME.card}" style="background-color: ${THEME.card}; border-bottom: 1px solid ${THEME.line}; padding: 24px; text-align: left;">
              <h3 style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; letter-spacing: 0.8px;">
                ข้อมูลการจัดส่งพัสดุ
              </h3>
              
              <!-- Info Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="font-size: 12.5px; color: ${THEME.muted}; padding: 6px 0;">ผู้ให้บริการขนส่ง (Courier):</td>
                  <td style="font-size: 12.5px; font-weight: bold; color: ${THEME.text}; text-align: right;">
                    ${courierName}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12.5px; color: ${THEME.muted}; padding: 6px 0;">เลขพัสดุ (Tracking Number):</td>
                  <td style="font-size: 13px; font-weight: bold; color: ${THEME.navy}; text-align: right; font-family: monospace;">
                    ${trackingNo}
                  </td>
                </tr>
              </table>

              <!-- Call to Action button -->
              <div style="text-align: center; margin: 24px 0 8px 0;">
                <a href="${trackingLink}" target="_blank" style="background-color: ${THEME.yellow}; color: ${THEME.ink}; padding: 12px 28px; border-radius: 25px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 13.5px; box-shadow: 0 4px 12px rgba(250,190,44,0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  ตรวจสอบสถานะพัสดุ
                </a>
              </div>
            </td>
          </tr>

          <!-- Card 3: Shipping Address Card -->
          <tr>
            <td bgcolor="${THEME.card}" style="background-color: ${THEME.card}; padding: 24px; text-align: left; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
              <div style="background-color: ${THEME.panel}; border-radius: 8px; border: 1px solid ${THEME.line}; padding: 14px 16px;">
                <span style="font-size: 11px; font-weight: bold; color: ${THEME.navy}; text-transform: uppercase; display: block; margin-bottom: 6px;">
                  ที่อยู่จัดส่งสินค้า
                </span>
                <span style="font-size: 12.5px; color: ${THEME.sub}; line-height: 1.5; display: block;">
                  <strong>ผู้รับ:</strong> ${order.customerName || "ไม่ระบุ"}<br>
                  <strong>ที่อยู่:</strong> ${order.customerAddress || "ไม่ได้ระบุที่อยู่จัดส่ง"}
                </span>
              </div>
            </td>
          </tr>

          <!-- Footer Legal & Disclaimer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: ${THEME.muted};">
                อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ กรุณาอย่าตอบกลับอีเมลนี้
              </p>
              <p style="margin: 0; font-size: 11px; color: ${THEME.faint};">
                &copy; ${new Date().getFullYear()} DITC CAMT. All rights reserved.
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
        from: process.env.EMAIL_FROM || '"DITC Shop Kiosk" <no-reply@ditc-kiosk.com>',
        to: customerEmail.trim(),
        subject: `[DITC Shop Kiosk] ${titleText} สำหรับคำสั่งซื้อ #${order.id}`,
        html: htmlContent,
        attachments: brand.attachment ? [brand.attachment] : [],
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
      console.log(`Subject: [DITC Shop Kiosk] ${titleText} สำหรับคำสั่งซื้อ #${order.id}`);
      console.log(`Courier: ${courierName}`);
      console.log(`Tracking: ${trackingNo}`);
      console.log(`Link:    ${trackingLink}`);
      console.log("========================================================\n");
    }
  }
}

export default new EmailService();
