/**
 * notifyStore
 * ---------------------------------------------------------------------------
 * คลังเก็บสถานะกลางของระบบแจ้งเตือน (toast + confirm dialog)
 *
 * ตั้งใจให้เป็น store นอก React เพื่อให้เรียกใช้ได้จากทุกที่ เช่นภายใน
 * .catch() ของ promise chain หรือฟังก์ชันที่ไม่ใช่ component โดยไม่ต้องใช้ hook
 * ฝั่ง React จะ subscribe ผ่าน useSyncExternalStore ใน NotificationProvider
 */

// ระยะเวลาแสดง toast เริ่มต้น (มิลลิวินาที)
const DEFAULT_DURATION = 4000;

// ระยะเวลาของแอนิเมชันตอน toast หายไป ต้องตรงกับ .notify-toast-leave ใน index.css
const LEAVE_ANIMATION_MS = 200;

// จำนวน toast สูงสุดที่แสดงพร้อมกัน หากเกินจะดันตัวเก่าสุดออก
const MAX_VISIBLE_TOASTS = 4;

let toasts = [];
let dialog = null;
let idCounter = 0;

let config = {
  position: "top-right",       // top-right | top-left | top-center | bottom-right | bottom-left | bottom-center
  duration: DEFAULT_DURATION,
  offset: { top: 96, bottom: 24, side: 16 }, // เว้นระยะ 96px ด้านบนเพื่อไม่ให้ทับ Header (88px) และแถบนำทางแอดมิน
};

const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return toasts;
}

export function getDialog() {
  return dialog;
}

export function getConfig() {
  return config;
}

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/* -------------------------------------------------------------------------
   Toast
------------------------------------------------------------------------- */

function pushToast(type, message, options = {}) {
  // ป้องกันกรณีส่ง Error object หรือค่าที่ไม่ใช่ string เข้ามาโดยตรง
  const text =
    message instanceof Error
      ? message.message
      : typeof message === "string"
        ? message
        : String(message ?? "");

  if (!text.trim()) return null;

  const id = options.id ?? nextId("toast");

  const toast = {
    id,
    type,
    message: text,
    title: options.title ?? null,
    duration: options.duration ?? config.duration,
    leaving: false,
  };

  // ถ้ามี id ซ้ำ ให้แทนที่ตัวเดิมแทนการเพิ่มใหม่ (ใช้กับข้อความที่อัปเดตซ้ำๆ ได้)
  const existingIndex = toasts.findIndex((t) => t.id === id);
  if (existingIndex >= 0) {
    toasts = toasts.map((t, i) => (i === existingIndex ? toast : t));
  } else {
    toasts = [...toasts, toast];
  }

  // จำกัดจำนวนที่แสดงพร้อมกัน โดยตัดตัวที่เก่าที่สุดซึ่งยังไม่ได้กำลังปิดตัวออก
  const active = toasts.filter((t) => !t.leaving);
  if (active.length > MAX_VISIBLE_TOASTS) {
    const overflow = active.slice(0, active.length - MAX_VISIBLE_TOASTS);
    for (const t of overflow) dismissToast(t.id);
  }

  emit();
  return id;
}

export function dismissToast(id) {
  const target = toasts.find((t) => t.id === id);
  if (!target || target.leaving) return;

  // ทำสองจังหวะ: ทำเครื่องหมายว่ากำลังปิดเพื่อเล่นแอนิเมชัน แล้วค่อยลบออกจริง
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, LEAVE_ANIMATION_MS);
}

export function dismissAllToasts() {
  for (const t of toasts) dismissToast(t.id);
}

/* -------------------------------------------------------------------------
   Confirm dialog
------------------------------------------------------------------------- */

/**
 * เปิดกล่องยืนยัน และคืนค่าเป็น Promise<boolean>
 * ใช้แทน window.confirm() ได้โดยตรง เพียงแต่ต้องใส่ await
 *
 * @param {object}  options
 * @param {string}  options.title        หัวข้อของกล่อง (ใช้เป็น aria-label ด้วย)
 * @param {string}  options.message      ข้อความอธิบาย
 * @param {string} [options.confirmText] ข้อความปุ่มยืนยัน
 * @param {string} [options.cancelText]  ข้อความปุ่มยกเลิก
 * @param {'danger'|'warning'|'primary'|'info'} [options.variant]
 * @returns {Promise<boolean>}
 */
export function confirmDialog(options = {}) {
  // หากมีกล่องเดิมค้างอยู่ ให้ปิดด้วยผลลัพธ์ false ก่อน เพื่อไม่ให้ promise ค้าง
  if (dialog) dialog.resolve(false);

  return new Promise((resolve) => {
    const variant = options.variant ?? "danger";

    // กัน promise ถูก resolve ซ้ำสองครั้ง (เช่นกด ESC พร้อมกับคลิกปุ่ม)
    let settled = false;

    dialog = {
      id: nextId("dialog"),
      title: options.title ?? "ยืนยันการทำรายการ",
      message: options.message ?? "",
      confirmText: options.confirmText ?? "ยืนยัน",
      cancelText: options.cancelText ?? "ยกเลิก",
      variant,
      // การกระทำที่ย้อนกลับไม่ได้ ต้องกดปุ่มเท่านั้น คลิกฉากหลังปิดไม่ได้
      dismissOnBackdrop: options.dismissOnBackdrop ?? variant !== "danger",
      resolve: (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      },
    };

    emit();
  });
}

export function closeDialog(result) {
  if (!dialog) return;
  const current = dialog;
  dialog = null;
  emit();
  current.resolve(result);
}

/* -------------------------------------------------------------------------
   API สาธารณะ
------------------------------------------------------------------------- */

export const notify = {
  success: (message, options) => pushToast("success", message, options),
  error: (message, options) => pushToast("error", message, options),
  warning: (message, options) => pushToast("warning", message, options),
  info: (message, options) => pushToast("info", message, options),

  dismiss: dismissToast,
  dismissAll: dismissAllToasts,

  /** ปรับตำแหน่ง / ระยะเวลา / ระยะขอบของ toast ทั้งระบบ */
  configure: (next = {}) => {
    config = {
      ...config,
      ...next,
      offset: { ...config.offset, ...(next.offset ?? {}) },
    };
    emit();
  },
};

export { confirmDialog as confirm };
