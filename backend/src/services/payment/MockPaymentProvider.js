import BasePaymentProvider from "./BasePaymentProvider.js";

export default class MockPaymentProvider extends BasePaymentProvider {
  async createCharge(orderId, amount) {
    // Return a mock PromptPay payload
    const phone = "0812345678"; // Mock merchant phone number
    const qrPayload = this.generatePromptPayPayload(phone, amount);
    return {
      qrPayload,
      transactionId: `mock_tx_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  generatePromptPayPayload(phoneOrTaxId, amount) {
    const target = phoneOrTaxId.replace(/[^0-9]/g, "");
    let targetType = "01110113"; // phone
    let formattedTarget = target;
    if (target.startsWith("0")) {
      // Convert e.g. 0812345678 to 66812345678
      formattedTarget = "66" + target.substring(1);
    }
    const targetLength = String(formattedTarget.length).padStart(2, "0");
    const targetInfo = `0016A000000677010111${targetType}${targetLength}${formattedTarget}`;

    const formattedAmount = parseFloat(amount).toFixed(2);
    const amountLength = String(formattedAmount.length).padStart(2, "0");

    const payload = [
      "000201",
      "010212",
      `2937${targetInfo}`,
      "5802TH",
      "5303764",
      `54${amountLength}${formattedAmount}`,
      "6304B1A2"
    ].join("");

    return payload;
  }
}
