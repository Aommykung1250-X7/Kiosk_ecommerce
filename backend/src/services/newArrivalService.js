// backend/src/services/newArrivalService.js

/**
 * กติกา "สินค้าใหม่"
 * ---------------------------------------------------------------------------
 * สินค้าที่เพิ่งเพิ่มเข้าระบบนับเป็นของใหม่ตามจำนวนวันที่กำหนด แล้วหมดสถานะไปเอง
 *
 * คิดสดจาก products.created_at ทุกครั้งที่อ่าน ไม่เก็บสถานะไว้ในฐานข้อมูล จึงไม่ต้องมี
 * คอลัมน์เพิ่ม ไม่ต้องมี migration และไม่ต้องมีงานตั้งเวลามาคอยล้างสถานะเมื่อครบกำหนด
 * (แนวเดียวกับป้าย HOT NOW ใน Home.jsx ที่คิดสดจากยอดขาย ไม่ใช่การเขียนสถานะกลับลง DB)
 *
 * เรื่องเขตเวลา: Postgres รันเป็น UTC เขียน created_at ด้วย CURRENT_TIMESTAMP และ NOW()
 * ก็ UTC เหมือนกัน การเทียบใน SQL จึงตรง ส่วน node-postgres อ่านคอลัมน์ TIMESTAMP
 * แบบไม่มีโซนเป็น UTC การเทียบด้วย Date ฝั่ง JS จึงตรงเช่นกัน ไม่ต้องชดเชย +7 ชั่วโมง
 */

/** สินค้าใหม่อยู่ได้กี่วัน — แก้ที่นี่ที่เดียว มีผลทั้งการติดป้ายและการเรียงลำดับ */
export const NEW_PRODUCT_DAYS = 3;

/** จำนวนวันคิดเป็นมิลลิวินาที ใช้ฝั่ง JS */
const NEW_PRODUCT_WINDOW_MS = NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;

/**
 * เงื่อนไข SQL ของ "สินค้าใหม่" — ต้องให้ผลตรงกับ isNewProduct() เสมอ
 * วางไว้ไฟล์เดียวกับกติกาฝั่ง JS เพื่อไม่ให้สองที่หลุดจากกันเวลาแก้จำนวนวัน
 * ใช้ alias ตาราง p ตามที่ productRepository.getProducts() ใช้อยู่
 */
export const NEW_PRODUCT_SQL = `(p.created_at > NOW() - INTERVAL '${NEW_PRODUCT_DAYS} days')`;

/**
 * สินค้าชิ้นนี้ยังนับเป็นของใหม่อยู่หรือไม่
 * @param {object} row แถวจากตาราง products (ต้องมี created_at)
 * @param {Date} [now]
 * @returns {boolean} false เมื่อไม่มีวันที่สร้างหรือค่าใช้ไม่ได้
 */
export function isNewProduct(row, now = new Date()) {
  const raw = row?.created_at ?? row?.createdAt;
  if (!raw) return false;

  const createdAt = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(createdAt.getTime())) return false;

  const age = now.getTime() - createdAt.getTime();
  return age >= 0 && age < NEW_PRODUCT_WINDOW_MS;
}
