// backend/src/services/shippingService.js

import shippingProviderFactory from "./shipping/ShippingProviderFactory.js";

class ShippingService {
  /**
   * จองขนส่งและขอเลขพัสดุ (Book Shipment & Get Tracking Number)
   * ดึงผู้บริการจัดส่งผ่าน Factory และจองผ่าน API ของแต่ละขนส่ง (หรือโหมดจำลอง)
   * 
   * @param {object} order - ออบเจกต์คำสั่งซื้อ
   * @param {string} courier - รหัสของบริษัทขนส่ง ('thailandpost', 'flash', 'kerry', 'jt')
   * @returns {Promise<{success: boolean, trackingNumber: string, labelUrl?: string, rawResponse?: any}>}
   */
  async bookShipment(order, courier) {
    console.log(`[ShippingService] Requesting shipment booking for Order #${order.id} via courier: "${courier}"...`);
    const provider = shippingProviderFactory.getProvider(courier);
    return await provider.bookShipment(order);
  }

  /**
   * ยกเลิกพัสดุจัดส่ง (Cancel Shipment)
   * 
   * @param {string} trackingNumber - เลขพัสดุที่ต้องการยกเลิก
   * @param {string} courier - รหัสบริษัทขนส่ง
   */
  async cancelShipment(trackingNumber, courier) {
    console.log(`[ShippingService] Requesting shipment cancellation for "${trackingNumber}" via courier: "${courier}"...`);
    const provider = shippingProviderFactory.getProvider(courier);
    return await provider.cancelShipment(trackingNumber);
  }

  /**
   * ตรวจสอบสถานะการนำส่งพัสดุ (Get Tracking Status)
   * 
   * @param {string} trackingNumber - เลขพัสดุ
   * @param {string} courier - รหัสบริษัทขนส่ง
   */
  async getTrackingStatus(trackingNumber, courier) {
    console.log(`[ShippingService] Checking tracking status for "${trackingNumber}" via courier: "${courier}"...`);
    const provider = shippingProviderFactory.getProvider(courier);
    return await provider.getTrackingStatus(trackingNumber);
  }
}

export default new ShippingService();

