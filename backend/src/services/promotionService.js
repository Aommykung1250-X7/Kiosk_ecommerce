// backend/src/services/promotionService.js

/** เพดานส่วนลดแบบเปอร์เซ็นต์ */
export const MAX_DISCOUNT_PERCENT = 90;

/** ชนิดส่วนลดที่รองรับ — ลดเป็นเปอร์เซ็นต์ หรือลดเป็นจำนวนเงินบาท */
export const DISCOUNT_TYPES = ["percent", "amount"];

/**
 * แปลงสตริง YYYY-MM-DD เป็น Date ตาม timezone ของเครื่อง server
 * @param {string} value
 * @param {"start"|"end"} edge ต้นวัน (00:00:00) หรือท้ายวัน (23:59:59.999)
 * @returns {Date|null} null เมื่อรูปแบบไม่ถูกต้องหรือค่าว่าง
 */
function parseDateBoundary(value, edge) {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;

  if (edge === "end") {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

/**
 * ตรวจว่าตอนนี้อยู่ในช่วงวันที่ของโปรโมชั่นหรือไม่ (นับแบบรวมวันเริ่มและวันสิ้นสุด)
 * @param {{startDate: string, endDate: string}} schedule ว่าง = ไม่จำกัด
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isWithinSchedule(schedule, now = new Date()) {
  const start = parseDateBoundary(schedule.startDate, "start");
  const end = parseDateBoundary(schedule.endDate, "end");

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

/**
 * แปลงค่าวันที่จาก DB (คอลัมน์ DATE คืนมาเป็น Date object) เป็นสตริง YYYY-MM-DD ตามเวลาเครื่อง
 * @param {Date|string|null} value
 * @returns {string}
 */
export function toDateKey(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

/**
 * ชนิดและค่าส่วนลดที่แอดมินตั้งไว้ที่ตัวสินค้า โดยยังไม่สนใจช่วงวันที่
 * @param {object} row แถวจากตาราง products (รองรับทั้งชื่อคอลัมน์ DB และชื่อฟิลด์ฝั่ง API)
 * @returns {{type: "percent"|"amount", value: number}|null} null เมื่อไม่ได้ตั้งค่าไว้
 */
function readDiscountSetting(row) {
  if (!row) return null;

  const rawVal = row.discount_value ?? row.discountValue ?? row.promotionValue ?? row.promotion_value;
  const value = parseFloat(rawVal);
  if (!Number.isFinite(value) || value <= 0) return null;

  const rawType = row.discount_type ?? row.discountType ?? row.promotionType ?? row.promotion_type;
  return { type: rawType === "amount" ? "amount" : "percent", value };
}

/**
 * ช่วงวันที่ของโปรโมชั่นในรูปแบบ YYYY-MM-DD (สตริงว่าง = ไม่จำกัด)
 * @param {object} row แถวจากตาราง products
 * @returns {{startDate: string, endDate: string}}
 */
export function getSchedule(row) {
  if (!row) return { startDate: "", endDate: "" };
  return {
    startDate: toDateKey(row.discount_start_date ?? row.discountStartDate ?? row.promotionStartDate ?? row.promotion_start_date),
    endDate: toDateKey(row.discount_end_date ?? row.discountEndDate ?? row.promotionEndDate ?? row.promotion_end_date)
  };
}

/** สวิตช์โปรโมชั่นของสินค้าถูกเปิดไว้หรือไม่ (DB คืน boolean แต่ payload อาจเป็นสตริง/ตัวเลข) */
function isPromotionSwitchOn(row) {
  return row?.promotion === true || row?.promotion === "true" || row?.promotion === 1;
}

/**
 * สถานะของโปรโมชั่นเทียบกับวันนี้ — แยก "ยังไม่ถึงวันเริ่ม" และ "หมดอายุแล้ว" ออกจาก "ไม่มีโปร"
 * เพราะทั้งสามกรณีให้ราคาเต็มเหมือนกัน หน้าจอจึงต้องมีทางบอกความต่างให้แอดมินเห็น
 *
 * @param {object} row แถวจากตาราง products
 * @param {Date} [now]
 * @returns {"off"|"scheduled"|"active"|"expired"}
 */
export function resolvePromotionStatus(row, now = new Date()) {
  if (!isPromotionSwitchOn(row)) return "off";
  if (!readDiscountSetting(row)) return "off";

  const { startDate, endDate } = getSchedule(row);
  if (isWithinSchedule({ startDate, endDate }, now)) return "active";

  // นอกช่วงแล้ว เหลือแค่ตัดสินว่ายังไม่เริ่ม หรือเลยวันสิ้นสุดไปแล้ว
  return isWithinSchedule({ startDate, endDate: "" }, now) ? "expired" : "scheduled";
}

/**
 * ส่วนลดของสินค้าชิ้นนี้ที่แอดมินตั้งไว้ — ใช้ได้ต่อเมื่อเปิดสวิตช์โปรโมชั่น
 * ใส่ค่ามากกว่า 0 และอยู่ในช่วงวันที่ที่กำหนด
 * @param {object} row แถวจากตาราง products
 * @param {Date} [now]
 * @returns {{type: "percent"|"amount", value: number}|null}
 */
export function resolveProductDiscount(row, now = new Date()) {
  if (resolvePromotionStatus(row, now) !== "active") return null;
  return readDiscountSetting(row);
}

/**
 * คิดราคาหลังหักส่วนลดของสินค้าหนึ่งชิ้น
 * ปัดเศษ 2 ตำแหน่งต่อชิ้น เพื่อให้ (ราคาที่ลูกค้าเห็น x จำนวน) ตรงกับยอดในตะกร้าเสมอ
 *
 * @param {number} basePrice ราคาเต็มจากฐานข้อมูล
 * @param {object} row แถวสินค้า (ต้องมี promotion, discount_type, discount_value และช่วงวันที่)
 * @param {boolean} [applyToPrice=true] false = รายงานส่วนลดที่มีผล แต่คืน price เป็นราคาเต็ม
 *   (หน้าแอดมินต้องใช้แบบนี้ เพราะฟอร์มเขียนราคาที่โหลดมากลับลง DB)
 * @returns {{price: number, originalPrice: number, discountType: "percent"|"amount"|null, discountValue: number, discountAmount: number, promotionStatus: "off"|"scheduled"|"active"|"expired"}}
 */
export function computePricing(basePrice, row, applyToPrice = true) {
  const originalPrice = Number.isFinite(basePrice) ? basePrice : 0;
  const promotionStatus = resolvePromotionStatus(row);
  const discount = promotionStatus === "active" ? readDiscountSetting(row) : null;

  if (!discount) {
    return { price: originalPrice, originalPrice, discountType: null, discountValue: 0, discountAmount: 0, promotionStatus };
  }

  const rawPrice =
    discount.type === "amount"
      ? originalPrice - discount.value
      : originalPrice * (1 - discount.value / 100);
  const discounted = Math.max(0, Math.round(rawPrice * 100) / 100);

  return {
    price: applyToPrice ? discounted : originalPrice,
    originalPrice,
    discountType: discount.type,
    discountValue: discount.value,
    discountAmount: Math.round((originalPrice - discounted) * 100) / 100,
    promotionStatus
  };
}

/**
 * เติมฟิลด์ราคาหลังลดให้ object สินค้า (ไม่แก้ของเดิม)
 * @param {object} product ต้องมี price (ราคาเต็ม) และฟิลด์ส่วนลดของตัวเอง
 * @returns {object}
 */
export function applyDiscount(product) {
  const basePrice = Number(product.originalPrice ?? product.price);
  return { ...product, ...computePricing(basePrice, product) };
}
