// backend/src/services/shippingService.js

class ShippingService {
  /**
   * Book a shipment with a courier (Flash, Kerry, Thailand Post, etc.)
   * This is an extensible mock layer. In the future, you can integrate real courier APIs here.
   * 
   * @param {object} order - The order object
   * @param {string} courier - The courier identifier ('thailandpost', 'flash', 'kerry', 'jt')
   * @returns {Promise<{success: boolean, trackingNumber: string, labelUrl?: string}>}
   */
  async bookShipment(order, courier) {
    console.log(`[ShippingService] Requesting shipment booking for Order #${order.id} via courier: "${courier}"...`);
    
    // Simulate minor network latency of a real API call (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const lowercaseCourier = (courier || "").toLowerCase();
    let trackingNumber = "";

    // Generate realistic looking tracking codes depending on courier
    const randomDigits = (length) => {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
      }
      return result;
    };

    switch (lowercaseCourier) {
      case "thailandpost":
        // EMS format: EH + 9 digits + TH
        trackingNumber = `EH${randomDigits(9)}TH`;
        break;
      case "flash":
        // Flash format: TH + 12 digits/alphanumeric
        trackingNumber = `TH${randomDigits(12)}`;
        break;
      case "kerry":
        // Kerry format: KEX + 10 digits
        trackingNumber = `KEX${randomDigits(10)}`;
        break;
      case "jt":
        // J&T format: 12 digits starting with 88
        trackingNumber = `88${randomDigits(10)}`;
        break;
      default:
        // Fallback generic tracking number
        trackingNumber = `TRACK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    }

    console.log(`[ShippingService] Successfully booked shipment via API mock. Tracking Number: ${trackingNumber}`);
    
    return {
      success: true,
      trackingNumber,
      labelUrl: `https://mock-courier.com/labels/${trackingNumber}.pdf` // Mock label URL
    };
  }
}

export default new ShippingService();
