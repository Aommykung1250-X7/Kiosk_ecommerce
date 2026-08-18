// backend/src/services/shipping/JTExpressProvider.js

import crypto from "crypto";
import { BaseShippingProvider } from "./BaseShippingProvider.js";

export default class JTExpressProvider extends BaseShippingProvider {
  constructor() {
    super("J&T Express", {
      apiUrl: process.env.JT_API_URL || "https://openapi.jtexpress.co.th/webapi",
      customerCode: process.env.JT_CUSTOMER_CODE,
      password: process.env.JT_PASSWORD,
      uuid: process.env.JT_UUID,
    });
  }

  /**
   * สร้างลายเซ็นดิจิทัลสำหรับตรวจสอบความถูกต้องทางความปลอดภัยของ J&T Express
   * โดยทั่วไป J&T จะใช้ MD5 ของ JSON Payload บวกกับ Key/UUID
   * 
   * @param {string} jsonPayload - ข้อมูล JSON ของออเดอร์ในรูปแบบ String
   * @returns {string} ค่า Signature สำหรับส่งใน HTTP Header หรือ Request Body
   */
  generateSignature(jsonPayload) {
    if (!this.config.uuid) {
      throw new Error("JT_UUID is missing. Cannot generate signature.");
    }
    
    // รูปแบบทั่วไปของ J&T: md5(jsonPayload + uuid) 
    const rawData = jsonPayload + this.config.uuid;
    return crypto
      .createHash("md5")
      .update(rawData)
      .digest("hex")
      .toUpperCase();
  }

  /**
   * จองขนส่งและรับรหัสเลขพัสดุจาก J&T Express (Book Shipment)
   * 
   * @param {object} order - ออบเจกต์คำสั่งซื้อ
   */
  async bookShipment(order) {
    if (this.mockMode) {
      console.log(`[JTExpressProvider] [MOCK MODE] Booking shipment for Order #${order.id}`);
      const trackingNumber = `88${this.generateRandomDigits(10)}`; // J&T รูปแบบ: ขึ้นต้นด้วย 88 + 10 หลัก
      
      return {
        success: true,
        trackingNumber,
        labelUrl: `https://mock-courier.com/labels/jt/${trackingNumber}.pdf`,
        message: "Booked successfully in mock mode."
      };
    }

    console.log(`[JTExpressProvider] [LIVE API] Booking shipment for Order #${order.id}`);
    
    if (!this.config.customerCode || !this.config.uuid) {
      throw new Error("JT_CUSTOMER_CODE or JT_UUID is not configured in .env");
    }

    try {
      const url = `${this.config.apiUrl}/order/add`;
      
      // ข้อมูลการจัดส่งตามรูปแบบมาตรฐานของ J&T Express API
      const orderData = {
        customerCode: this.config.customerCode,
        txlogisticid: `JT-ORDER-${order.id}-${Date.now()}`, // เลขที่รายการอ้างอิงร้านค้า
        ordertype: "1", // 1 = Normal Delivery
        expressType: "1",
        
        // ข้อมูลร้านค้าผู้ส่ง
        sender: {
          name: "DITC Shop Kiosk Store",
          phone: "020000000",
          mobile: "020000000",
          prov: "กรุงเทพมหานคร",
          city: "คลองเตย",
          area: "คลองเตย",
          address: "123 อาคารพาณิชย์ ถนนพระราม 4",
          postcode: "10110"
        },
        
        // ข้อมูลลูกค้าผู้รับปลายทาง
        receiver: {
          name: order.customerName,
          phone: order.customerPhone,
          mobile: order.customerPhone,
          prov: this.parseProvince(order.customerAddress) || "กรุงเทพมหานคร",
          city: "เขตปทุมวัน",
          area: "รองเมือง",
          address: order.customerAddress,
          postcode: this.extractPostcode(order.customerAddress) || "10330"
        },
        
        // รายละเอียดพัสดุ
        weight: 1.0, // กิโลกรัม
        length: 20, // ซม.
        width: 15,
        height: 10,
        itemsvalue: order.totalPrice || 0,
        goodsName: `พัสดุคำสั่งซื้อ #${order.id}`
      };

      const jsonPayload = JSON.stringify(orderData);
      const digest = this.generateSignature(jsonPayload);

      // J&T มักจะรับข้อมูลในรูปแบบ x-www-form-urlencoded โดยมีฟิลด์หลักคือ logist_interface และ data_digest
      const formParams = new URLSearchParams();
      formParams.append("logist_interface", jsonPayload);
      formParams.append("data_digest", digest);
      formParams.append("msg_type", "ORDERCREATE");
      formParams.append("eccompanyid", this.config.customerCode);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formParams
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`J&T API connection failed: Status ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // ตัวอย่างโครงสร้างผลลัพธ์ของ J&T:
      // { responseitems: [ { success: "true", mailno: "880123456789", reason: "" } ] }
      const itemResult = data.responseitems?.[0];
      
      if (!itemResult || itemResult.success !== "true") {
        throw new Error(itemResult?.reason || "Failed to book shipment from J&T response");
      }

      return {
        success: true,
        trackingNumber: itemResult.mailno, // เลขพัสดุของ J&T
        labelUrl: `https://www.jtexpress.co.th/index/query/route.html?billcode=${itemResult.mailno}`,
        rawResponse: data
      };

    } catch (error) {
      console.error("[JTExpressProvider] Live Booking Error:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ยกเลิกพัสดุกับ J&T Express
   */
  async cancelShipment(trackingNumber) {
    if (this.mockMode) {
      console.log(`[JTExpressProvider] [MOCK MODE] Cancel shipment: ${trackingNumber}`);
      return { success: true, message: `Mock cancel successful for ${trackingNumber}` };
    }

    try {
      const url = `${this.config.apiUrl}/order/cancel`;
      
      const payload = {
        customerCode: this.config.customerCode,
        mailno: trackingNumber,
        reason: "Customer requested cancellation"
      };

      const jsonPayload = JSON.stringify(payload);
      const digest = this.generateSignature(jsonPayload);

      const formParams = new URLSearchParams();
      formParams.append("logist_interface", jsonPayload);
      formParams.append("data_digest", digest);
      formParams.append("msg_type", "ORDERCANCEL");
      formParams.append("eccompanyid", this.config.customerCode);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formParams
      });

      const data = await response.json();
      const itemResult = data.responseitems?.[0];
      
      return {
        success: itemResult?.success === "true",
        message: itemResult?.reason || "Requested J&T cancel API",
        rawResponse: data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * ตรวจสอบสถานะการติดตามพัสดุ J&T Express
   */
  async getTrackingStatus(trackingNumber) {
    if (this.mockMode) {
      return {
        success: true,
        trackingNumber,
        status: "In Transit",
        details: [
          { date: new Date().toISOString(), status_description: "รับพัสดุโดยสาขา J&T (Mock)" },
          { date: new Date().toISOString(), status_description: "กำลังส่งไปยังศูนย์กระจายสินค้า (Mock)" }
        ]
      };
    }

    try {
      const url = `${this.config.apiUrl}/track/query`;
      
      const payload = {
        customerCode: this.config.customerCode,
        billcodes: [trackingNumber]
      };

      const jsonPayload = JSON.stringify(payload);
      const digest = this.generateSignature(jsonPayload);

      const formParams = new URLSearchParams();
      formParams.append("logist_interface", jsonPayload);
      formParams.append("data_digest", digest);
      formParams.append("msg_type", "TRACKQUERY");
      formParams.append("eccompanyid", this.config.customerCode);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formParams
      });

      const data = await response.json();
      
      // ตัวอย่างประมวลผลข้อมูลการติดตามพัสดุของ J&T
      const detailsList = data.details?.[trackingNumber] || [];
      const details = detailsList.map(t => ({
        date: t.scanTime,
        status_description: t.scanType,
        location: t.desc
      }));

      return {
        success: true,
        trackingNumber,
        status: details[details.length - 1]?.status_description || "Unknown",
        details,
        rawResponse: data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ดึงรหัสไปรษณีย์
  extractPostcode(address) {
    if (!address) return null;
    const match = address.match(/\b\d{5}\b/);
    return match ? match[0] : null;
  }

  // ดึงจังหวัด
  parseProvince(address) {
    if (!address) return null;
    const provinces = ["กรุงเทพมหานคร", "กรุงเทพฯ", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "ชลบุรี", "เชียงใหม่", "ภูเก็ต"];
    for (const province of provinces) {
      if (address.includes(province)) {
        return province === "กรุงเทพฯ" ? "กรุงเทพมหานคร" : province;
      }
    }
    return null;
  }
}
