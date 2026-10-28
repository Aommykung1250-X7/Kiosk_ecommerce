// backend/src/services/orderStageService.js

/**
 * ขั้นของคำสั่งซื้อ (ฝั่ง backend)
 * ---------------------------------------------------------------------------
 * ไฟล์นี้เป็นคู่แฝดของ frontend/src/components/admin/orders/orderStage.ts
 * ตรรกะต้องเหมือนกันเป๊ะ ถ้าแก้ที่หนึ่งต้องแก้อีกที่ด้วย มิฉะนั้นอีเมลสรุปออเดอร์ค้าง
 * กับหน้า "คิวคำสั่งซื้อ" จะบอกสถานะคนละอย่างสำหรับออเดอร์ใบเดียวกัน
 *
 * ฐานข้อมูลเก็บสถานะแยกเป็นสามฟิลด์ (รวม / ส่วนพร้อมส่ง / ส่วนพรีออเดอร์)
 * ฟังก์ชันนี้ยุบทั้งหมดเป็นขั้นเดียวที่พนักงานเข้าใจได้ทันทีว่า "ต้องทำอะไรต่อ"
 */

/**
 * ป้ายกลางของแต่ละขั้น ใช้เป็นหัวข้อกลุ่มในอีเมลสรุป
 *
 * ต้องมีชุดนี้แยกต่างหาก เพราะฝั่งหน้าจอขั้นเดียวกันมีได้สองป้ายตามบริบท
 * (ready_to_ship เป็นได้ทั้ง "รอการจัดส่ง" และ "รอส่งรอบแรก") เวลาจัดกลุ่มจึงยึด key
 */
export const STAGE_SUMMARY_LABEL = {
  waiting_pickup: "รอลูกค้ามารับหน้าร้าน",
  waiting_preorder: "รอสินค้าพรีออเดอร์",
  ready_to_ship: "รอการจัดส่ง",
  partially_shipped: "ส่งแล้วบางส่วน",
  waiting_address: "รอลูกค้าระบุที่อยู่",
  pending: "รอดำเนินการ",
  fulfilled: "เสร็จสิ้นแล้ว"
};

/**
 * ลำดับการแสดงผลในอีเมล — เรียงตามความเร่งด่วนที่พนักงานต้องลงมือ
 * ของที่ต้องรอลูกค้าตอบกลับอยู่บนสุด เพราะปล่อยไว้แล้วไม่มีใครขยับให้
 */
export const OUTSTANDING_STAGE_ORDER = [
  "waiting_address",
  "waiting_pickup",
  "ready_to_ship",
  "partially_shipped",
  "waiting_preorder",
  "pending"
];

/**
 * หาขั้นของคำสั่งซื้อหนึ่งใบ
 * @param {object|null} order ออเดอร์ที่ผ่าน orderRepository.mapOrderRow() มาแล้ว
 * @returns {{key: string, label: string}}
 */
export function getOrderStage(order) {
  if (!order) {
    return { key: "pending", label: "รอดำเนินการ" };
  }

  const instockDone = order.fulfillmentStatusInstock === "fulfilled";
  const preorderSettled =
    order.fulfillmentStatusPreorder === "fulfilled" ||
    order.fulfillmentStatusPreorder === "none";

  if (order.fulfillmentStatus === "fulfilled" || (instockDone && preorderSettled)) {
    return {
      key: "fulfilled",
      label: order.deliveryOption === "delivery" ? "จัดส่งแล้ว" : "จ่ายของครบแล้ว"
    };
  }

  if (order.deliveryOption === "pickup") {
    if (order.fulfillmentStatusInstock === "pending") {
      return { key: "waiting_pickup", label: "รอลูกค้ามารับ" };
    }
    if (order.fulfillmentStatusPreorder === "pending") {
      return { key: "waiting_preorder", label: "รอสินค้าพรีออเดอร์" };
    }
  }

  if (order.deliveryOption === "delivery") {
    if (!order.customerAddress || order.customerAddress.trim() === "") {
      return { key: "waiting_address", label: "รอลูกค้าระบุที่อยู่" };
    }

    if (order.shippingOption === "split") {
      if (order.fulfillmentStatusInstock === "pending") {
        return { key: "ready_to_ship", label: "รอส่งรอบแรก" };
      }
      if (order.fulfillmentStatusPreorder === "pending") {
        return { key: "partially_shipped", label: "ส่งแล้วบางส่วน" };
      }
    } else {
      const hasPreorder = (order.items || []).some(
        (item) => item.product?.status === "Pre-Order"
      );
      if (hasPreorder && order.fulfillmentStatusPreorder === "pending") {
        return { key: "waiting_preorder", label: "รอสินค้าพรีออเดอร์" };
      }
      return { key: "ready_to_ship", label: "รอการจัดส่ง" };
    }
  }

  return { key: "pending", label: "รอดำเนินการ" };
}
