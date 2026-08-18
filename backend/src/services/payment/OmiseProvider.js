import BasePaymentProvider from "./BasePaymentProvider.js";

export default class OmiseProvider extends BasePaymentProvider {
  constructor() {
    super();
    this.secretKey = process.env.OMISE_SECRET_KEY || "";
  }

  async createCharge(orderId, amount) {
    const secretKey = process.env.OMISE_SECRET_KEY || this.secretKey;
    if (!secretKey) {
      throw new Error("Omise secret key is not configured in environment variables.");
    }

    const satangAmount = Math.round(amount * 100);
    const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");

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
    
    // Extract the PromptPay QR code payload (EMVCo text or Scannable Image URL)
    const qrPayload =
      data.source?.references?.qr_code_data ||
      data.source?.scannable_code?.image?.download_uri ||
      data.source?.scannable_code?.display_code ||
      data.source?.scannable_code?.image_url;

    if (!qrPayload) {
      console.error("[OmiseProvider] Response source payload missing QR data:", JSON.stringify(data.source));
      throw new Error("Failed to retrieve PromptPay QR payload from Omise response.");
    }

    return {
      qrPayload,
      transactionId: data.id
    };
  }

  /**
   * Fetch current charge status directly from Omise API
   * @param {string} chargeId 
   * @returns {Promise<{ id: string, status: string, paid: boolean, amount: number } | null>}
   */
  async getChargeStatus(chargeId) {
    const secretKey = process.env.OMISE_SECRET_KEY || this.secretKey;
    if (!secretKey || !chargeId) return null;

    const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");

    try {
      const response = await fetch(`https://api.omise.co/charges/${chargeId}`, {
        method: "GET",
        headers: {
          "Authorization": authHeader
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        id: data.id,
        status: data.status,
        paid: Boolean(data.paid),
        amount: data.amount
      };
    } catch (err) {
      console.error("[OmiseProvider] Error fetching charge status:", err);
      return null;
    }
  }

  /**
   * Cancel/reverse a pending charge on Omise
   * @param {string} chargeId 
   * @returns {Promise<boolean>}
   */
  async cancelCharge(chargeId) {
    const secretKey = process.env.OMISE_SECRET_KEY || this.secretKey;
    if (!secretKey || !chargeId) return false;

    const authHeader = "Basic " + Buffer.from(secretKey + ":").toString("base64");

    try {
      const response = await fetch(`https://api.omise.co/charges/${chargeId}/reverse`, {
        method: "POST",
        headers: {
          "Authorization": authHeader
        }
      });

      if (response.ok) {
        console.log(`[OmiseProvider] Charge ${chargeId} successfully reversed/cancelled on Omise.`);
        return true;
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`[OmiseProvider] Failed to reverse Omise charge ${chargeId}:`, errData.message || response.statusText);
        return false;
      }
    } catch (err) {
      console.error("[OmiseProvider] Error cancelling/reversing charge on Omise:", err);
      return false;
    }
  }
}

