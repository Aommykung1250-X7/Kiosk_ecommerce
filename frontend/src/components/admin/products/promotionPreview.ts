import type { DiscountType, PromotionStatus } from "../../../types/admin";
import { formatThaiDate, toLocalDateKey } from "../ui";

/**
 * ตัวช่วยฝั่งหน้าจอสำหรับโปรโมชั่นของสินค้า
 * ---------------------------------------------------------------------------
 * ใช้ร่วมกันระหว่างฟอร์มเพิ่ม/แก้ไขสินค้า กับหน้าต่างตั้งส่วนลดในตาราง เพื่อให้ตัวอย่างราคา
 * และคำเตือนเรื่องวันที่ตรงกันทั้งสองที่ และตรงกับ promotionService.js ฝั่ง backend
 */

/** เพดานส่วนลดแบบเปอร์เซ็นต์ ต้องตรงกับ MAX_DISCOUNT_PERCENT ใน backend/src/services/promotionService.js */
export const MAX_PERCENT = 90;

/** วันนี้ในรูปแบบ YYYY-MM-DD ตามเวลาเครื่อง เทียบกับค่าจาก <input type="date"> ได้ตรงๆ */
export function todayKey(): string {
  return toLocalDateKey(new Date());
}

/**
 * คิดราคาหลังลดด้วยสูตรเดียวกับ computePricing ฝั่ง backend
 * เพื่อให้ตัวอย่างในหน้าจอตรงกับราคาที่ลูกค้าจะเห็นจริง
 */
export function previewDiscountedPrice(
  fullPrice: number,
  type: DiscountType,
  value: number,
): number {
  const base = Number.isFinite(fullPrice) ? fullPrice : 0;
  const raw = type === "amount" ? base - value : base * (1 - value / 100);
  return Math.max(0, Math.round(raw * 100) / 100);
}

/**
 * สถานะของช่วงวันที่ที่กำลังกรอกอยู่ — ใช้ตรรกะเดียวกับ resolvePromotionStatus ฝั่ง backend
 * เพื่อเตือนแอดมินตั้งแต่ตอนกรอก ก่อนที่จะบันทึกแล้วพบว่าราคาไม่เปลี่ยน
 */
export function previewPromotionStatus(
  enabled: boolean,
  value: number,
  startDate: string,
  endDate: string,
): PromotionStatus {
  if (!enabled || !Number.isFinite(value) || value <= 0) return "off";
  const today = todayKey();
  if (endDate && endDate < today) return "expired";
  if (startDate && startDate > today) return "scheduled";
  return "active";
}

/** ข้อความอธิบายสถานะโปรโมชั่น คืน null เมื่อโปรมีผลอยู่แล้ว (ไม่ต้องเตือนอะไร) */
export function promotionScheduleNote(
  status: PromotionStatus,
  startDate: string,
  endDate: string,
): string | null {
  if (status === "scheduled") {
    return `ราคาจะยังไม่เปลี่ยนจนถึงวันที่ ${formatThaiDate(startDate)}`;
  }
  if (status === "expired") {
    return `โปรโมชั่นหมดอายุไปแล้วเมื่อ ${formatThaiDate(endDate)} เลือกวันสิ้นสุดใหม่ก่อนบันทึก`;
  }
  return null;
}
