import type { StageTone } from "../../../types/admin";

/**
 * ระบบสีของสถานะในหลังบ้าน — ประกาศไว้ที่เดียว
 *
 * กติกาที่ยึดทั้งพอร์ทัล: สีชมพู (preorder) ใช้กับ "ของที่ยังไม่อยู่บนชั้น"
 * เท่านั้น คือสินค้าพรีออเดอร์และการจำกัดสิทธิ์การซื้อ ไม่ใช้กับอย่างอื่นเลย
 * ผู้ใช้จึงกวาดตาหาของที่ยังส่งไม่ได้เจอทันทีจากสีเดียว
 */
export const TONE_STYLES: Record<StageTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  accent: "bg-bo-accent-soft text-bo-accent ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  preorder: "bg-bo-pink-soft text-bo-pink ring-pink-200",
};

export const TONE_DOTS: Record<StageTone, string> = {
  neutral: "bg-slate-400",
  info: "bg-sky-500",
  accent: "bg-bo-accent",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  success: "bg-emerald-500",
  preorder: "bg-bo-pink",
};
