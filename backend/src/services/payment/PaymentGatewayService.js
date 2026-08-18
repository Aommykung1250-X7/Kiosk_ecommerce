import MockPaymentProvider from "./MockPaymentProvider.js";
import OmiseProvider from "./OmiseProvider.js";

class PaymentGatewayService {
  constructor() {
    this.providers = {
      mock: new MockPaymentProvider(),
      omise: new OmiseProvider()
    };
  }

  /**
   * Get active provider instance
   * @returns {BasePaymentProvider}
   */
  getProvider() {
    const providerKey = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
    const provider = this.providers[providerKey];
    if (!provider) {
      console.warn(`Payment provider '${providerKey}' not found, falling back to mock.`);
      return this.providers.mock;
    }
    return provider;
  }

  /**
   * Generate QR payload for an order
   * @param {string} orderId 
   * @param {number} amount 
   * @returns {Promise<{ qrPayload: string, transactionId: string }>}
   */
  async generateQrCode(orderId, amount) {
    const provider = this.getProvider();
    return await provider.createCharge(orderId, amount);
  }

  /**
   * Check status of a charge by transaction ID
   * @param {string} transactionId 
   * @returns {Promise<{ id: string, status: string, paid: boolean, amount: number } | null>}
   */
  async checkChargeStatus(transactionId) {
    const provider = this.getProvider();
    if (typeof provider.getChargeStatus === "function") {
      return await provider.getChargeStatus(transactionId);
    }
    return null;
  }

  /**
   * Cancel/reverse a charge by transaction ID
   * @param {string} transactionId 
   * @returns {Promise<boolean>}
   */
  async cancelCharge(transactionId) {
    if (!transactionId) return false;
    const provider = this.getProvider();
    if (typeof provider.cancelCharge === "function") {
      return await provider.cancelCharge(transactionId);
    }
    return false;
  }
}

export default new PaymentGatewayService();

