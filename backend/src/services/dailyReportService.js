// backend/src/services/dailyReportService.js
import pool from "../data/db.js";
import orderRepository from "../repositories/orderRepository.js";
import emailService from "./emailService.js";
import {
  getOrderStage,
  STAGE_SUMMARY_LABEL,
  OUTSTANDING_STAGE_ORDER
} from "./orderStageService.js";

/** คีย์ใน system_settings ที่ฟีเจอร์นี้ใช้ */
const KEYS = {
  enabled: "daily_report_enabled",
  email: "daily_report_email",
  time: "daily_report_time",
  lastSent: "daily_report_last_sent_date"
};

const DEFAULTS = {
  [KEYS.enabled]: "false",
  [KEYS.email]: "",
  [KEYS.time]: "20:00",
  [KEYS.lastSent]: ""
};

/** รูปแบบเวลา HH:MM แบบ 24 ชั่วโมง */
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * วันที่/เวลาปัจจุบันตามเขตเวลาไทย
 * ---------------------------------------------------------------------------
 * คิดจาก Asia/Bangkok ตรงๆ ไม่พึ่ง timezone ของเครื่องที่รันเซิร์ฟเวอร์
 * เพราะ Postgres รันเป็น UTC และเครื่อง deploy อาจไม่ได้ตั้งเป็นเวลาไทย
 * @returns {{dateKey: string, timeKey: string}} เช่น { dateKey: "2026-09-01", timeKey: "20:00" }
 */
export function nowInBangkok() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    timeKey: `${get("hour")}:${get("minute")}`
  };
}

/** วันนี้ตามเวลาไทย รูปแบบ YYYY-MM-DD */
export function todayInBangkok() {
  return nowInBangkok().dateKey;
}

/**
 * อ่านค่าตั้งค่าของรายงานรายวันจาก system_settings (เติมค่าเริ่มต้นให้คีย์ที่ยังไม่มี)
 * @returns {Promise<{enabled: boolean, email: string, time: string, lastSentDate: string}>}
 */
export async function getSettings() {
  const res = await pool.query(
    "SELECT key, value FROM system_settings WHERE key = ANY($1)",
    [Object.values(KEYS)]
  );

  const stored = { ...DEFAULTS };
  for (const row of res.rows) {
    stored[row.key] = row.value ?? "";
  }

  return {
    enabled: stored[KEYS.enabled] === "true",
    email: stored[KEYS.email] || "",
    time: TIME_PATTERN.test(stored[KEYS.time]) ? stored[KEYS.time] : DEFAULTS[KEYS.time],
    lastSentDate: stored[KEYS.lastSent] || ""
  };
}

/** เขียนค่าลง system_settings ทีละคีย์ */
async function writeSetting(key, value) {
  await pool.query(
    "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
    [key, value]
  );
}

/**
 * บันทึกค่าตั้งค่าที่แอดมินแก้จากหน้าจอ
 * @param {{enabled: boolean, email: string, time: string}} input
 */
export async function saveSettings({ enabled, email, time }) {
  await writeSetting(KEYS.enabled, enabled ? "true" : "false");
  await writeSetting(KEYS.email, (email || "").trim());
  await writeSetting(KEYS.time, time);
  return getSettings();
}

/**
 * ประกอบสรุปออเดอร์ค้างของวันหนึ่ง
 *
 * @param {string} dateKey YYYY-MM-DD ตามเวลาไทย
 * @returns {Promise<object>} ข้อมูลที่ใช้ได้ทั้งพรีวิวบนหน้าจอและตัวอีเมล
 */
export async function buildDigest(dateKey) {
  const { orders, totalOrders, fulfilledCount } =
    await orderRepository.getDayOrdersWithOutstanding(dateKey);

  const outstanding = orders.filter((order) => order.isOutstanding);

  // จัดกลุ่มตาม key ของขั้น แล้วเรียงกลุ่มตามลำดับความเร่งด่วนที่กำหนดไว้
  const buckets = new Map();
  for (const order of outstanding) {
    const stage = getOrderStage(order);
    if (!buckets.has(stage.key)) buckets.set(stage.key, []);
    buckets.get(stage.key).push({
      id: order.id,
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      totalPrice: order.totalPrice,
      deliveryOption: order.deliveryOption,
      shippingOption: order.shippingOption,
      createdAt: order.createdAt,
      stageLabel: stage.label
    });
  }

  const groups = OUTSTANDING_STAGE_ORDER
    .filter((key) => buckets.has(key))
    .map((key) => ({
      key,
      label: STAGE_SUMMARY_LABEL[key] || key,
      count: buckets.get(key).length,
      orders: buckets.get(key)
    }));

  return {
    dateKey,
    totalOrders,
    fulfilledCount,
    outstandingCount: outstanding.length,
    groups
  };
}

/**
 * ประกอบสรุปแล้วส่งอีเมล
 * @param {string} dateKey
 * @param {string} [recipient] ไม่ระบุ = ใช้อีเมลที่ตั้งไว้ในระบบ
 * @returns {Promise<{sent: boolean, recipient: string, digest: object}>}
 */
export async function sendDigest(dateKey, recipient) {
  const settings = await getSettings();
  const to = (recipient || settings.email || "").trim();

  if (!to || !to.includes("@")) {
    const error = new Error("ยังไม่ได้ตั้งอีเมลผู้รับรายงาน");
    error.statusCode = 400;
    throw error;
  }

  const digest = await buildDigest(dateKey);
  await emailService.sendDailyOrderDigest(digest, to);
  return { sent: true, recipient: to, digest };
}

/**
 * ตัวตั้งเวลาส่งรายงานประจำวัน
 * ---------------------------------------------------------------------------
 * เช็คทุกนาทีตามแบบงานเบื้องหลังที่ orderService.js ใช้อยู่ จึงไม่ต้องเพิ่ม dependency
 * กันส่งซ้ำด้วย daily_report_last_sent_date ใน system_settings — เก็บไว้ใน DB ไม่ใช่ในหน่วยความจำ
 * เพื่อให้รีสตาร์ทเซิร์ฟเวอร์กลางวันแล้วไม่ยิงอีเมลของวันนั้นซ้ำอีกรอบ
 */
export function startScheduler() {
  const tick = async () => {
    try {
      const settings = await getSettings();
      if (!settings.enabled || !settings.email) return;

      const { dateKey, timeKey } = nowInBangkok();
      if (settings.lastSentDate === dateKey) return;
      if (timeKey < settings.time) return;

      // จองวันไว้ก่อนส่ง กัน tick ถัดไปยิงซ้ำถ้าการส่งใช้เวลานาน
      await writeSetting(KEYS.lastSent, dateKey);
      await sendDigest(dateKey, settings.email);
      console.log(`[DailyReport] ส่งสรุปออเดอร์ค้างของวันที่ ${dateKey} ไปที่ ${settings.email} แล้ว`);
    } catch (error) {
      console.error("[DailyReport] ส่งรายงานประจำวันไม่สำเร็จ:", error);
    }
  };

  setInterval(tick, 60 * 1000);
  console.log("[DailyReport] เปิดตัวตั้งเวลาส่งสรุปออเดอร์ค้างรายวันแล้ว (ตรวจทุก 1 นาที)");
}

export default {
  getSettings,
  saveSettings,
  buildDigest,
  sendDigest,
  startScheduler,
  todayInBangkok,
  nowInBangkok,
  TIME_PATTERN
};
