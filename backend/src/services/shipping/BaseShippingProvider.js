// backend/src/services/shipping/BaseShippingProvider.js

export class BaseShippingProvider {
  /**
   * @param {string} name - ชื่อของขนส่ง
   * @param {object} config - ค่าคอนฟิกูเรชันต่างๆ เช่น Base URL, API Keys
   */
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    // โหลดค่าโหมด Mock จาก .env หากระบุเป็น 'true' หรือถ้าไม่มีค่าคอนฟิกกำหนดให้เป็น true เสมอเพื่อความปลอดภัย
    this.mockMode = process.env.SHIPPING_MOCK_MODE !== "false";
  }

  /**
   * จองขนส่งและขอเลขพัสดุ (Book Shipment & Get Tracking Number)
   * 
   * @param {object} order - ออบเจกต์คำสั่งซื้อของระบบ
   * @param {number} order.id - ไอดีคำสั่งซื้อ
   * @param {string} order.customerName - ชื่อผู้รับ
   * @param {string} order.customerPhone - เบอร์โทรศัพท์ผู้รับ
   * @param {string} order.customerAddress - ที่อยู่ผู้รับ
   * @param {number} order.totalPrice - ราคารวมคำสั่งซื้อ
   * @returns {Promise<{success: boolean, trackingNumber: string, labelUrl?: string, rawResponse?: any}>}
   */
  async bookShipment(order) {
    throw new Error(`bookShipment method is not implemented for provider "${this.name}"`);
  }

  /**
   * ยกเลิกการจองพัสดุ (Cancel Shipment Booking)
   * 
   * @param {string} trackingNumber - เลขพัสดุที่ต้องการยกเลิก
   * @returns {Promise<{success: boolean, message: string, rawResponse?: any}>}
   */
  async cancelShipment(trackingNumber) {
    throw new Error(`cancelShipment method is not implemented for provider "${this.name}"`);
  }

  /**
   * เช็คสถานะพัสดุ (Get Tracking Status)
   * 
   * @param {string} trackingNumber - เลขพัสดุที่ต้องการตรวจสอบ
   * @returns {Promise<{success: boolean, trackingNumber: string, status: string, details: Array<object>, rawResponse?: any}>}
   */
  async getTrackingStatus(trackingNumber) {
    throw new Error(`getTrackingStatus method is not implemented for provider "${this.name}"`);
  }

  /**
   * คำนวณค่าจัดส่ง (Calculate Shipping Rate)
   * 
   * @param {object} origin - ที่อยู่ผู้ส่ง
   * @param {object} destination - ที่อยู่ผู้รับ
   * @param {number} weight - น้ำหนักพัสดุ (กรัม หรือ กิโลกรัม ขึ้นอยู่กับขนส่ง)
   * @param {object} dimensions - ขนาดพัสดุ (กว้าง x ยาว x สูง)
   * @returns {Promise<{success: boolean, price: number, estimatedDays: number, rawResponse?: any}>}
   */
  async calculateRate(origin, destination, weight, dimensions) {
    throw new Error(`calculateRate method is not implemented for provider "${this.name}"`);
  }

  /**
   * ฟังก์ชันช่วยสร้างตัวเลขสุ่มสำหรับโหมด Mock
   * 
   * @param {number} length 
   * @returns {string}
   */
  generateRandomDigits(length) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }
}
