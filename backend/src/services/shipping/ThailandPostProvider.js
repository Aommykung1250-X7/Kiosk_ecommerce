// backend/src/services/shipping/ThailandPostProvider.js

import { BaseShippingProvider } from "./BaseShippingProvider.js";

export default class ThailandPostProvider extends BaseShippingProvider {
  constructor() {
    super("Thailand Post", {
      apiUrl: process.env.THAILANDPOST_API_URL || "https://trackapi.thailandpost.co.th",
      apiToken: process.env.THAILANDPOST_API_TOKEN,
    });
  }

  /**
   * ขอสิทธิ์การใช้งาน Token ชั่วคราว (Authenticate & Get Token)
   * API ของไปรษณีย์ไทยต้องการการขอ Token ใหม่โดยใช้ Token หลัก
   * 
   * @returns {Promise<string>} Token สำหรับใช้งานครั้งเดียว/ชั่วคราว
   */
  async getAuthToken() {
    const url = `${this.config.apiUrl}/post/api/v1/authenticate/token`;
    
    console.log(`[ThailandPostProvider] Requesting session token from ${url}...`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${this.config.apiToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      // ตัวอย่างการคืนค่าข้อมูล: { token: "TEMP_JWT_TOKEN", expire: "2026-07-17 23:59:59" }
      return data.token;
    } catch (error) {
      console.error("[ThailandPostProvider] Authentication Error:", error.message);
      throw error;
    }
  }

  /**
   * จองขนส่งและขอเลขพัสดุ (Book Shipment)
   * 
   * @param {object} order - ออบเจกต์คำสั่งซื้อ
   */
  async bookShipment(order) {
    if (this.mockMode) {
      console.log(`[ThailandPostProvider] [MOCK MODE] Booking shipment for Order #${order.id}`);
      const trackingNumber = `EH${this.generateRandomDigits(9)}TH`; // รูปแบบ EMS ไปรษณีย์ไทย
      
      return {
        success: true,
        trackingNumber,
        labelUrl: `https://mock-courier.com/labels/thailandpost/${trackingNumber}.pdf`,
        message: "Booked successfully in mock mode."
      };
    }

    // กรณีเชื่อมต่อ API ระบบจริง
    console.log(`[ThailandPostProvider] [LIVE API] Booking shipment for Order #${order.id}`);
    
    if (!this.config.apiToken) {
      throw new Error("THAILANDPOST_API_TOKEN is not configured in .env");
    }

    try {
      // 1. รับ temporary token
      const sessionToken = await this.getAuthToken();

      // 2. เรียกส่งรายการสินค้า / สร้างการจอง
      const url = `${this.config.apiUrl}/post/api/v1/items`;
      
      // แปลงที่อยู่และข้อมูลออเดอร์ให้ตรงกับโครงสร้าง API ไปรษณีย์ไทย
      const payload = {
        // ตัวอย่างโครงสร้างที่ไปรษณีย์ไทยต้องการ
        // สามารถปรับเปลี่ยนฟิลด์ตามข้อกำหนดล่าสุดของ API ได้
        status: "success",
        items: [
          {
            item_name: `คำสั่งซื้อ #${order.id}`,
            receiver_name: order.customerName,
            receiver_phone: order.customerPhone,
            receiver_address: order.customerAddress,
            // ในทางปฏิบัติ คุณควรแยก รหัสไปรษณีย์ และ อำเภอ/จังหวัด ออกจากที่อยู่หลัก
            // นี่คือส่วนที่ผู้ใช้สามารถขยายโค้ดเพื่อแมพฟิลด์ปลายทางเพิ่มเติมได้
            receiver_postcode: this.extractPostcode(order.customerAddress) || "10000", 
            sender_name: "DITC Shop Kiosk Store",
            sender_phone: "020000000",
            sender_address: "123 อาคารพาณิชย์ กรุงเทพฯ",
            sender_postcode: "10110",
            service_type: "EMS", // EMS, Register, COD เป็นต้น
          }
        ]
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Booking failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // สมมติว่ารูปแบบผลลัพธ์ของ API เป็นดังนี้: 
      // { success: true, response: { items: [ { barcode: "EH123456789TH", status: true } ] } }
      const itemResult = data.response?.items?.[0];
      
      if (!data.success || !itemResult?.status) {
        throw new Error(data.message || "Failed to book shipment from provider response");
      }

      return {
        success: true,
        trackingNumber: itemResult.barcode,
        labelUrl: itemResult.label_url || `https://track.thailandpost.co.th/?trackNumber=${itemResult.barcode}`,
        rawResponse: data
      };

    } catch (error) {
      console.error("[ThailandPostProvider] Live Booking Error:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ยกเลิกการจองพัสดุ (Cancel Shipment)
   */
  async cancelShipment(trackingNumber) {
    if (this.mockMode) {
      console.log(`[ThailandPostProvider] [MOCK MODE] Cancel shipment: ${trackingNumber}`);
      return { success: true, message: `Mock cancel successful for ${trackingNumber}` };
    }

    try {
      const sessionToken = await this.getAuthToken();
      const url = `${this.config.apiUrl}/post/api/v1/cancel`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ barcode: trackingNumber })
      });

      const data = await response.json();
      return {
        success: data.success || false,
        message: data.message || "Cancellation API requested.",
        rawResponse: data
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * ติดตามสถานะพัสดุ (Get Tracking Status)
   */
  async getTrackingStatus(trackingNumber) {
    if (this.mockMode) {
      return {
        success: true,
        trackingNumber,
        status: "In Transit",
        details: [
          { date: new Date().toISOString(), status_description: "รับเข้าระบบ (Mock)" },
          { date: new Date().toISOString(), status_description: "อยู่ระหว่างการขนส่ง (Mock)" }
        ]
      };
    }

    try {
      const sessionToken = await this.getAuthToken();
      // Endpoint ตรวจสอบสถานะการติดตามพัสดุ
      const url = `${this.config.apiUrl}/post/api/v1/track`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ barcodes: [trackingNumber] })
      });

      const data = await response.json();
      
      // ประมวลผลผลลัพธ์จากไปรษณีย์ไทยเพื่อทำให้อยู่ในฟอร์แมตมาตรฐานของระบบ Kiosk
      const tracks = data.response?.items?.[trackingNumber] || [];
      const details = tracks.map(t => ({
        date: t.status_date,
        status_description: t.status_description,
        location: t.location
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

  /**
   * ฟังก์ชันดึงรหัสไปรษณีย์แบบง่ายจากที่อยู่ข้อความ
   */
  extractPostcode(address) {
    if (!address) return null;
    const match = address.match(/\b\d{5}\b/);
    return match ? match[0] : null;
  }
}
