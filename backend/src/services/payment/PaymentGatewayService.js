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
}

export default new PaymentGatewayService();
