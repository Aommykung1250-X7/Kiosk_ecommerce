// backend/src/services/shipping/KerryExpressProvider.js

import { BaseShippingProvider } from "./BaseShippingProvider.js";

export default class KerryExpressProvider extends BaseShippingProvider {
  constructor() {
    super("Kerry Express", {
      apiUrl: process.env.KERRY_API_URL || "https://api.kerryexpress.com/v1",
      apiKey: process.env.KERRY_API_KEY,
      shopCode: process.env.KERRY_SHOP_CODE,
    });
  }

  /**
   * จองคิวพัสดุกับ Kerry Express (Book Shipment / Create Parcel)
   * 
   * @param {object} order - ออบเจกต์คำสั่งซื้อ
   */
  async bookShipment(order) {
    if (this.mockMode) {
      console.log(`[KerryExpressProvider] [MOCK MODE] Booking shipment for Order #${order.id}`);
      const trackingNumber = `KEX${this.generateRandomDigits(10)}`; // รูปแบบ Kerry: KEX + 10 หลัก
      
      return {
        success: true,
        trackingNumber,
        labelUrl: `https://mock-courier.com/labels/kerry/${trackingNumber}.pdf`,
        message: "Booked successfully in mock mode."
      };
    }

    console.log(`[KerryExpressProvider] [LIVE API] Booking shipment for Order #${order.id}`);
    
    if (!this.config.apiKey) {
      throw new Error("KERRY_API_KEY is not configured in .env");
    }

    try {
      // ตัวอย่างพอร์ตหลักในการส่งข้อมูลไป API ของ Kerry
      const url = `${this.config.apiUrl}/shipment/create`;
      
      const payload = {
        shop_code: this.config.shopCode || "MY_SHOP_01",
        reference_no: `ORDER-${order.id}`,
        service_code: "ND", // ND = Next Day Delivery (บริการส่งวันถัดไป)
        
        // ข้อมูลผู้ส่ง (จากทางร้านค้า)
        sender: {
          name: "DITC Shop Kiosk Store",
          mobile: "020000000",
          address: "123 อาคารพาณิชย์ ถนนพระราม 4",
          subdistrict: "คลองเตย",
          district: "คลองเตย",
          province: "กรุงเทพมหานคร",
          postcode: "10110"
        },
        
        // ข้อมูลผู้รับปลายทาง
        recipient: {
          name: order.customerName,
          mobile: order.customerPhone,
          address: order.customerAddress,
          // Kerry ต้องการรหัสไปรษณีย์ที่ถูกต้องในการคัดแยก
          postcode: this.extractPostcode(order.customerAddress) || "10110",
        },
        
        // ข้อมูลพัสดุ
        parcel: {
          weight_kg: 1.5, // น้ำหนักพัสดุ (กก.)
          width_cm: 20,
          length_cm: 30,
          height_cm: 15,
          declared_value: order.totalPrice || 0
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kerry API failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // ตัวอย่างผลลัพธ์การตอบกลับ:
      // { status: "success", data: { con_no: "KEX1234567890", label_pdf: "..." } }
      if (data.status !== "success" || !data.data?.con_no) {
        throw new Error(data.message || "Failed to book shipment from Kerry API");
      }

      return {
        success: true,
        trackingNumber: data.data.con_no, // Kerry Connection Number (เลขนำส่ง)
        labelUrl: data.data.label_pdf || `https://th.kerryexpress.com/th/track/?track=${data.data.con_no}`,
        rawResponse: data
      };

    } catch (error) {
      console.error("[KerryExpressProvider] Live Booking Error:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ยกเลิกการส่งพัสดุกับ Kerry Express
   */
  async cancelShipment(trackingNumber) {
    if (this.mockMode) {
      console.log(`[KerryExpressProvider] [MOCK MODE] Cancel shipment: ${trackingNumber}`);
      return { success: true, message: `Mock cancel successful for ${trackingNumber}` };
    }

    try {
      const url = `${this.config.apiUrl}/shipment/cancel`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey
        },
        body: JSON.stringify({ con_no: trackingNumber })
      });

      const data = await response.json();
      return {
        success: data.status === "success",
        message: data.message || "Kerry Cancel API called",
        rawResponse: data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * ติดตามสถานะของพัสดุ Kerry Express
   */
  async getTrackingStatus(trackingNumber) {
    if (this.mockMode) {
      return {
        success: true,
        trackingNumber,
        status: "In Transit",
        details: [
          { date: new Date().toISOString(), status_description: "รับพัสดุเข้าระบบคัดแยก (Kerry Mock)" },
          { date: new Date().toISOString(), status_description: "พัสดุถึงสาขาปลายทางแล้ว (Kerry Mock)" }
        ]
      };
    }

    try {
      const url = `${this.config.apiUrl}/shipment/track`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey
        },
        body: JSON.stringify({ con_no: trackingNumber })
      });

      const data = await response.json();
      
      const events = data.data?.events || [];
      const details = events.map(e => ({
        date: e.event_date,
        status_description: e.event_description,
        location: e.location_name
      }));

      return {
        success: data.status === "success",
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
}
