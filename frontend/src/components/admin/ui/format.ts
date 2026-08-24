/** ตัวจัดรูปแบบที่ใช้ร่วมกันทั้งหลังบ้าน เพื่อให้ยอดเงินและวันที่หน้าตาเหมือนกันทุกหน้า */

export function formatBaht(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (Number.isNaN(amount)) return "฿0.00";
  return `฿${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** ยอดเงินแบบไม่มีทศนิยม ใช้ในตารางที่แน่นและราคาลงตัวอยู่แล้ว */
export function formatBahtShort(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (Number.isNaN(amount)) return "฿0";
  return `฿${amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;
}

export function formatCount(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("th-TH");
}

export function formatThaiDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatThaiDate(value)} ${formatTime(value)}`;
}

/** YYYY-MM-DD ตามเวลาเครื่อง ใช้เทียบกับค่าจาก <input type="date"> */
export function toLocalDateKey(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

/** เติมโฟลเดอร์ปลายทางให้ชื่อไฟล์รูป ถ้ายังไม่ใช่ URL เต็ม */
export function resolveUploadUrl(
  file: string | null | undefined,
  folder: "products" | "screensavers",
): string | null {
  if (!file) return null;
  if (file.startsWith("http") || file.startsWith("/") || file.startsWith("blob:")) {
    return file;
  }
  return `/uploads/${folder}/${file}`;
}

/** ย่อรหัสคำสั่งซื้อยาวๆ ให้เหลือหางที่พนักงานใช้เรียกกันหน้าร้าน */
export function shortOrderRef(orderId: string): string {
  return orderId.slice(-6).toUpperCase();
}
