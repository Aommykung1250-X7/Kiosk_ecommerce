/** เกณฑ์ "ใกล้หมด" ที่ใช้ร่วมกันทั้งพอร์ทัล ให้ตัวเลขบนการ์ดสรุปตรงกับสีในตาราง */
export const LOW_STOCK_THRESHOLD = 5;

/** ชั้นวางเต็มหนึ่งช่อง = 20 ชิ้น ใช้เป็นมาตรวัดให้แท่งสต็อกทุกแถวเทียบกันได้ */
export const SHELF_CAPACITY = 20;

export type StockLevel = "out" | "low" | "healthy" | "preorder";

export function getStockLevel(stock: number, isPreOrder: boolean): StockLevel {
  if (isPreOrder) return "preorder";
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "healthy";
}
