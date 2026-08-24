import type { Order, OrderStage, PaymentState, StageTone } from "../../../types/admin";

/**
 * ขั้นของคำสั่งซื้อ
 * ---------------------------------------------------------------------------
 * ฐานข้อมูลเก็บสถานะแยกเป็นสามฟิลด์ (รวม / ส่วนพร้อมส่ง / ส่วนพรีออเดอร์)
 * ฟังก์ชันนี้ยุบทั้งหมดเป็นขั้นเดียวที่พนักงานเข้าใจได้ทันทีว่า "ต้องทำอะไรต่อ"
 * ใช้ร่วมกันทั้งแท็บกรอง ป้ายในตาราง และหัวแผงรายละเอียด เพื่อไม่ให้ตีความคนละแบบ
 */
export function getOrderStage(order: Order | null | undefined): OrderStage {
  if (!order) {
    return { key: "pending", label: "รอดำเนินการ", tone: "neutral" };
  }

  const instockDone = order.fulfillmentStatusInstock === "fulfilled";
  const preorderSettled =
    order.fulfillmentStatusPreorder === "fulfilled" ||
    order.fulfillmentStatusPreorder === "none";

  if (order.fulfillmentStatus === "fulfilled" || (instockDone && preorderSettled)) {
    return {
      key: "fulfilled",
      label: order.deliveryOption === "delivery" ? "จัดส่งแล้ว" : "จ่ายของครบแล้ว",
      tone: "success",
    };
  }

  if (order.deliveryOption === "pickup") {
    if (order.fulfillmentStatusInstock === "pending") {
      return { key: "waiting_pickup", label: "รอลูกค้ามารับ", tone: "info" };
    }
    if (order.fulfillmentStatusPreorder === "pending") {
      return { key: "waiting_preorder", label: "รอสินค้าพรีออเดอร์", tone: "preorder" };
    }
  }

  if (order.deliveryOption === "delivery") {
    if (!order.customerAddress || order.customerAddress.trim() === "") {
      return { key: "waiting_address", label: "รอลูกค้าระบุที่อยู่", tone: "danger" };
    }

    if (order.shippingOption === "split") {
      if (order.fulfillmentStatusInstock === "pending") {
        return { key: "ready_to_ship", label: "รอส่งรอบแรก", tone: "warning" };
      }
      if (order.fulfillmentStatusPreorder === "pending") {
        return { key: "partially_shipped", label: "ส่งแล้วบางส่วน", tone: "accent" };
      }
    } else {
      const hasPreorder = order.items?.some(
        (item) => item.product?.status === "Pre-Order",
      );
      if (hasPreorder && order.fulfillmentStatusPreorder === "pending") {
        return { key: "waiting_preorder", label: "รอสินค้าพรีออเดอร์", tone: "preorder" };
      }
      return { key: "ready_to_ship", label: "รอการจัดส่ง", tone: "warning" };
    }
  }

  return { key: "pending", label: "รอดำเนินการ", tone: "neutral" };
}

export interface PaymentBadge {
  label: string;
  tone: StageTone;
}

/**
 * สถานะการชำระเงิน
 * ระบบนี้รับเงินผ่านเพย์เมนต์เกตเวย์ช่องทางเดียว จึงแสดงผลการชำระเป็นหลัก
 * และมีเลขอ้างอิงของเกตเวย์กำกับไว้ให้ตรวจสอบย้อนหลังได้
 */
export function getPaymentBadge(status: PaymentState): PaymentBadge {
  switch (status) {
    case "success":
      return { label: "ชำระแล้ว", tone: "success" };
    case "failed":
      return { label: "ชำระไม่สำเร็จ", tone: "danger" };
    default:
      return { label: "รอชำระเงิน", tone: "warning" };
  }
}

export function countItems(order: Order): number {
  return (order.items ?? []).reduce((total, item) => total + (item.quantity || 1), 0);
}

export function hasPreOrderItem(order: Order): boolean {
  return (order.items ?? []).some((item) => item.product?.status === "Pre-Order");
}
