/** เกณฑ์ "ใกล้หมด" ที่ใช้ร่วมกันทั้งพอร์ทัล ให้ตัวเลขบนการ์ดสรุปตรงกับสีในตาราง */
export const LOW_STOCK_THRESHOLD = 5;

export type StockLevel = "out" | "low" | "healthy" | "preorder";

export function getStockLevel(stock: number, isPreOrder: boolean): StockLevel {
  if (isPreOrder) return "preorder";
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "healthy";
}
