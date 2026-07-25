import BasePaymentProvider from "./BasePaymentProvider.js";

export default class OmiseProvider extends BasePaymentProvider {
  constructor() {
    super();
    this.secretKey = process.env.OMISE_SECRET_KEY || "";
  }

  async createCharge(orderId, amount) {
    if (!this.secretKey) {
      throw new Error("Omise secret key is not configured in environment variables.");
    }

    const satangAmount = Math.round(amount * 100);
    const authHeader = "Basic " + Buffer.from(this.secretKey + ":").toString("base64");

    const response = await fetch("https://api.omise.co/charges", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        amount: satangAmount.toString(),
        currency: "thb",
        "source[type]": "promptpay",
        "metadata[orderId]": orderId
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(`Omise API Charge creation failed: ${errBody.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the PromptPay QR code data
    const qrPayload = data.source?.references?.qr_code_data;
    if (!qrPayload) {
      throw new Error("Failed to retrieve PromptPay QR payload from Omise response.");
    }

    return {
      qrPayload,
      transactionId: data.id
    };
  }
}
