import type { StageTone } from "../../../types/admin";

/**
 * ระบบสีของสถานะในหลังบ้าน — ประกาศไว้ที่เดียว
 *
 * กติกาที่ยึดทั้งพอร์ทัล:
 *   preorder (เหลือง) ใช้กับ "ของที่ยังไม่อยู่บนชั้น" เท่านั้น คือสินค้าพรีออเดอร์
 *     และการจำกัดสิทธิ์การซื้อ — เป็นสีเดียวกับแท็ก PRE-ORDER ที่ลูกค้าเห็นบนตู้
 *     แอดมินจึงเทียบสองหน้าจอได้โดยไม่ต้องจำสองสี
 *   lowstock (ชมพู) ใช้กับ "ใกล้หมด" เท่านั้น เป็นสีที่แสบตาที่สุดในชุด
 *     เพราะเป็นสถานะเดียวที่ต้องลงมือทำอะไรบางอย่างก่อนของหมดจริง
 *   warning (เหลืองอำพัน) เหลือไว้ให้คำเตือนทั่วไปและสถานะรอของฝั่งออร์เดอร์
 */
export const TONE_STYLES: Record<StageTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  accent: "bg-bo-accent-soft text-bo-accent ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  // #F5A623 บนพื้นอ่อนคอนทราสต์ไม่ถึง AA สำหรับตัวอักษรเล็ก ตัวหนังสือจึงใช้ amber-800
  // ส่วน #F5A623 ตัวจริงไปอยู่ที่จุด dot และป้ายพื้นทึบ ซึ่งเป็นที่ที่หน้าตู้ใช้
  preorder: "bg-bo-preorder-soft text-amber-800 ring-amber-200",
  lowstock: "bg-bo-lowstock-soft text-bo-lowstock ring-pink-200",
};

export const TONE_DOTS: Record<StageTone, string> = {
  neutral: "bg-slate-400",
  info: "bg-sky-500",
  accent: "bg-bo-accent",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  success: "bg-emerald-500",
  preorder: "bg-bo-preorder",
  lowstock: "bg-bo-lowstock",
};
