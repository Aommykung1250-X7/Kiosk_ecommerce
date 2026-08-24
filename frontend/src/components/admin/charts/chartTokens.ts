/**
 * โทเคนของกราฟ
 * ---------------------------------------------------------------------------
 * ทุกกราฟในหลังบ้านมีชุดข้อมูลเดียวต่อกราฟ จึงใช้ "หนึ่งกราฟ หนึ่งสี" และไม่มีกล่องคำอธิบายสี
 * เพราะหัวกราฟบอกอยู่แล้วว่ากำลังดูอะไร
 *   เขียว  = เงิน (สอดคล้องกับการ์ดรายได้ด้านบน)
 *   น้ำเงิน = การนับจำนวน เช่น ออเดอร์และยอดขายเป็นชิ้น
 * ผ่านการตรวจ contrast และการมองเห็นสีบกพร่องด้วย scripts/validate_palette.js แล้ว
 */
export const CHART_MONEY = "#059669";
export const CHART_COUNT = "#2B6BF0";
export const CHART_GRID = "#E7EAF3";
export const CHART_AXIS_TEXT = "#6B7392";

/** เว้นที่ให้แกนและป้ายกำกับ ไม่ให้ตัวเลขล้นออกนอกกรอบ */
export const CHART_PADDING = { top: 16, right: 12, bottom: 26, left: 52 };

/** ปัดตัวเลขบนแกนขึ้นเป็นเลขกลมๆ กราฟจึงไม่ชนขอบบนพอดีเป๊ะ */
export function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/** ย่อจำนวนเงินบนแกน ให้ป้ายสั้นพอที่จะไม่เบียดกัน */
export function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("th-TH", { maximumFractionDigits: 1 })} ล.`;
  if (value >= 1_000) return `${(value / 1_000).toLocaleString("th-TH", { maximumFractionDigits: 1 })} พ.`;
  return value.toLocaleString("th-TH");
}
