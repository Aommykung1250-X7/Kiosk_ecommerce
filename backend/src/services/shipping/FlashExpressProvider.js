// backend/src/services/shipping/FlashExpressProvider.js

import crypto from "crypto";
import { BaseShippingProvider } from "./BaseShippingProvider.js";

export default class FlashExpressProvider extends BaseShippingProvider {
  constructor() {
    super("Flash Express", {
      apiUrl: process.env.FLASH_API_URL || "https://open-api.flashexpress.co.th",
      appId: process.env.FLASH_APP_ID,
      appSecret: process.env.FLASH_APP_SECRET,
      merchantId: process.env.FLASH_MERCHANT_ID,
    });
  }

  /**
   * สร้างค่าลายเซ็นดิจิทัล (Generate Sign) ตามมาตรฐานความปลอดภัยของ Flash Express
   * โดยนำพารามิเตอร์มาเรียงตามลำดับอักษร เชื่อมต่อกัน และแฮชด้วย MD5 ร่วมกับ App Secret
   * 
   * @param {object} params - ข้อมูลดิบที่ส่งไป API
   * @returns {string} ค่า MD5 Signature ตัวพิมพ์ใหญ่
   */
  generateSignature(params) {
    if (!this.config.appSecret) {
      throw new Error("FLASH_APP_SECRET is missing. Cannot generate signature.");
    }

    // 1. เรียงคีย์พารามิเตอร์ตามอักษร (A-Z)
    const sortedKeys = Object.keys(params).sort();
    
    // 2. รวบรวมข้อมูลให้อยู่ในฟอร์แมต key=value
    const stringArray = [];
    for (const key of sortedKeys) {
      if (params[key] !== undefined && params[key] !== null && key !== "sign") {
        stringArray.push(`${key}=${params[key]}`);
      }
    }
    
    // 3. นำมาต่อกันด้วย & และต่อด้วย &key=appSecret
    const rawString = `${stringArray.join("&")}&key=${this.config.appSecret}`;
    
    // 4. แฮชด้วย MD5 และแปลงเป็นตัวพิมพ์ใหญ่
    return crypto
      .createHash("md5")
      .update(rawString)
      .digest("hex")
      .toUpperCase();
  }

  /**
   * จองขนส่งกับ Flash Express (Book Shipment / Create Order)
   * 
   * @param {object} order - ออบเจกต์คำสั่งซื้อ
   */
  async bookShipment(order) {
    if (this.mockMode) {
      console.log(`[FlashExpressProvider] [MOCK MODE] Booking shipment for Order #${order.id}`);
      const trackingNumber = `TH${this.generateRandomDigits(12)}`; // รูปแบบ Flash: TH + 12 หลัก
      
      return {
        success: true,
        trackingNumber,
        labelUrl: `https://mock-courier.com/labels/flash/${trackingNumber}.pdf`,
        message: "Booked successfully in mock mode."
      };
    }

    console.log(`[FlashExpressProvider] [LIVE API] Booking shipment for Order #${order.id}`);
    
    if (!this.config.appId || !this.config.merchantId) {
      throw new Error("FLASH_APP_ID or FLASH_MERCHANT_ID is not configured in .env");
    }

    try {
      const url = `${this.config.apiUrl}/open/v1/orders`;
      
      // ตัวแปรที่ Flash Express บังคับใช้
      const requestParams = {
        app_id: this.config.appId,
        mchId: this.config.merchantId,
        nonceStr: Math.random().toString(36).substring(2, 17),
        timestamp: Math.floor(Date.now() / 1000).toString(),
        
        // ข้อมูลผู้รับผู้ส่งและพัสดุ
        outTradeNo: `ORDER-${order.id}-${Date.now()}`, // เลขอ้างอิงของร้านค้า
        expressType: "1", // 1 = Standard Delivery
        srcName: "DIIC Shop Kiosk Store",
        srcPhone: "020000000",
        srcProvince: "กรุงเทพมหานคร",
        srcCity: "คลองเตย",
        srcDetailAddress: "123 อาคารพาณิชย์ ถนนพระราม 4",
        srcPostalCode: "10110",
        
        dstName: order.customerName,
        dstPhone: order.customerPhone,
        // สำหรับ Flash API ข้อมูลจังหวัด อำเภอ ควรจะแยกฟิลด์กันชัดเจน
        // โค้ดนี้สามารถแยกหรือส่งไปในที่อยู่ย่อยได้ตามโครงสร้างข้อมูลจริง
        dstDetailAddress: order.customerAddress, 
        dstProvince: this.parseProvince(order.customerAddress) || "กรุงเทพมหานคร",
        dstCity: this.parseDistrict(order.customerAddress) || "เขตปทุมวัน",
        dstPostalCode: this.extractPostcode(order.customerAddress) || "10330",
        
        weight: "1000", // น้ำหนักจำลองเป็นกรัม (1000g = 1kg)
      };

      // เพิ่ม Signature ในพารามิเตอร์
      requestParams.sign = this.generateSignature(requestParams);

      // Flash Express ต้องการส่งข้อมูลแบบ x-www-form-urlencoded
      const formBody = new URLSearchParams();
      for (const [key, value] of Object.entries(requestParams)) {
        formBody.append(key, value);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flash API connection failed: Status ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // ตัวอย่างรูปแบบผลลัพธ์ของ Flash API:
      // { code: 1, message: "success", data: { pno: "TH0101XXXXXXXX", billCode: "..." } }
      if (data.code !== 1 && data.code !== 200) {
        throw new Error(data.message || `Flash API returned error code ${data.code}`);
      }

      return {
        success: true,
        trackingNumber: data.data.pno, // รหัสพัสดุ (pno)
        labelUrl: `https://www.flashexpress.co.th/tracking/?k=${data.data.pno}`,
        rawResponse: data
      };

    } catch (error) {
      console.error("[FlashExpressProvider] Live Booking Error:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ยกเลิกพัสดุกับ Flash Express
   */
  async cancelShipment(trackingNumber) {
    if (this.mockMode) {
      console.log(`[FlashExpressProvider] [MOCK MODE] Cancel shipment: ${trackingNumber}`);
      return { success: true, message: `Mock cancel successful for ${trackingNumber}` };
    }

    try {
      const url = `${this.config.apiUrl}/open/v1/orders/cancel`;
      
      const requestParams = {
        app_id: this.config.appId,
        mchId: this.config.merchantId,
        nonceStr: Math.random().toString(36).substring(2, 17),
        timestamp: Math.floor(Date.now() / 1000).toString(),
        pno: trackingNumber
      };

      requestParams.sign = this.generateSignature(requestParams);

      const formBody = new URLSearchParams();
      for (const [key, value] of Object.entries(requestParams)) {
        formBody.append(key, value);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      });

      const data = await response.json();
      return {
        success: data.code === 1 || data.code === 200,
        message: data.message || "Requested cancellation",
        rawResponse: data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * ตรวจสอบสถานะการขนส่งพัสดุ
   */
  async getTrackingStatus(trackingNumber) {
    if (this.mockMode) {
      return {
        success: true,
        trackingNumber,
        status: "In Transit",
        details: [
          { date: new Date().toISOString(), status_description: "รับพัสดุแล้ว (Flash Mock)" },
          { date: new Date().toISOString(), status_description: "พัสดุอยู่ระหว่างการคัดแยก (Flash Mock)" }
        ]
      };
    }

    try {
      const url = `${this.config.apiUrl}/open/v1/tracks`;
      
      const requestParams = {
        app_id: this.config.appId,
        mchId: this.config.merchantId,
        nonceStr: Math.random().toString(36).substring(2, 17),
        timestamp: Math.floor(Date.now() / 1000).toString(),
        pno: trackingNumber
      };

      requestParams.sign = this.generateSignature(requestParams);

      const formBody = new URLSearchParams();
      for (const [key, value] of Object.entries(requestParams)) {
        formBody.append(key, value);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      });

      const data = await response.json();
      
      // ตัวอย่างการแมพข้อมูลสถานะของ Flash
      const tracks = data.data?.tracks || [];
      const details = tracks.map(t => ({
        date: new Date(t.time * 1000).toISOString(),
        status_description: t.stageName,
        location: t.cityName
      }));

      return {
        success: data.code === 1 || data.code === 200,
        trackingNumber,
        status: details[details.length - 1]?.status_description || "Unknown",
        details,
        rawResponse: data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ฟังก์ชันตัวช่วยดึงรหัสไปรษณีย์
  extractPostcode(address) {
    if (!address) return null;
    const match = address.match(/\b\d{5}\b/);
    return match ? match[0] : null;
  }

  // ฟังก์ชันสกัดจังหวัดแบบง่ายๆ เพื่อนำส่ง API
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

  // ฟังก์ชันสกัดเขต/อำเภอแบบง่าย
  parseDistrict(address) {
    if (!address) return null;
    const match = address.match(/(?:เขต|อำเภอ|อ\.)\s*([ก-๙]+)/);
    return match ? match[1] : null;
  }
}
