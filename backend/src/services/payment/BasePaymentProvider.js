export default class BasePaymentProvider {
  /**
   * Create dynamic QR code payload
   * @param {string} orderId 
   * @param {number} amount 
   * @returns {Promise<{ qrPayload: string, transactionId: string }>}
   */
  async createCharge(orderId, amount) {
    throw new Error("createCharge not implemented");
  }

  /**
   * Cancel/reverse a pending charge
   * @param {string} chargeId 
   * @returns {Promise<boolean>}
   */
  async cancelCharge(chargeId) {
    return false;
  }
}
