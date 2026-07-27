// backend/src/services/shipping/ShippingProviderFactory.js

import ThailandPostProvider from "./ThailandPostProvider.js";
import FlashExpressProvider from "./FlashExpressProvider.js";
import KerryExpressProvider from "./KerryExpressProvider.js";
import JTExpressProvider from "./JTExpressProvider.js";
import { BaseShippingProvider } from "./BaseShippingProvider.js";

/**
 * คลาสสำหรับขนส่งทั่วไปแบบจำลอง (กรณีไม่พบขนส่งที่ระบุ)
 */
class FallbackShippingProvider extends BaseShippingProvider {
  constructor() {
    super("Generic Courier");
  }

  async bookShipment(order) {
    console.log(`[FallbackShippingProvider] Using fallback mock shipping for Order #${order.id}`);
    const trackingNumber = `TRACK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    return {
      success: true,
      trackingNumber,
      labelUrl: `https://mock-courier.com/labels/generic/${trackingNumber}.pdf`,
      message: "Booked via fallback generic provider."
    };
  }

  async cancelShipment(trackingNumber) {
    return { success: true, message: "Fallback cancel mock success." };
  }

  async getTrackingStatus(trackingNumber) {
    return {
      success: true,
      trackingNumber,
      status: "Delivered",
      details: [{ date: new Date().toISOString(), status_description: "จัดส่งสำเร็จ (Generic Mock)" }]
    };
  }
}

class ShippingProviderFactory {
  constructor() {
    // ลงทะเบียนอินสแตนซ์ผู้ให้บริการขนส่งแบบขี้เกียจ (Lazy Instantiation) หรือสร้างเตรียมไว้ล่วงหน้า
    this.providers = {
      thailandpost: new ThailandPostProvider(),
      flash: new FlashExpressProvider(),
      kerry: new KerryExpressProvider(),
      jt: new JTExpressProvider(),
      fallback: new FallbackShippingProvider(),
    };
  }

  /**
   * คืนค่าออบเจกต์ตัวเชื่อมต่อ API ขนส่งที่ต้องการใช้งาน
   * 
   * @param {string} courierName - ชื่อบริษัทขนส่ง ('thailandpost', 'flash', 'kerry', 'jt')
   * @returns {BaseShippingProvider} ตัวเชื่อมต่อ API ขนส่ง
   */
  getProvider(courierName) {
    const key = (courierName || "").toLowerCase().trim();
    const provider = this.providers[key];

    if (!provider) {
      console.warn(`[ShippingProviderFactory] Unknown courier: "${courierName}". Using generic fallback provider.`);
      return this.providers.fallback;
    }

    return provider;
  }
}

export default new ShippingProviderFactory();
