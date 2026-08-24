import { cn } from "./cn";
import { getStockLevel, type StockLevel } from "./stock";

const TEXT: Record<StockLevel, string> = {
  out: "text-rose-600",
  low: "text-bo-lowstock",
  healthy: "text-bo-text",
  preorder: "text-bo-preorder",
};

interface StockCellProps {
  stock: number;
  isPreOrder?: boolean;
  className?: string;
}

/**
 * จำนวนคงเหลือในตารางคลังสินค้า
 * ---------------------------------------------------------------------------
 * ตัวเลขบอกจำนวนที่แน่นอน สีของตัวเลขบอกว่าต้องรีบเติมหรือยัง
 * ไม่มีแท่งวัดอีกแล้ว เพราะแท่งเทียบกับความจุสมมติ ทำให้ของ 20 ชิ้นกับ 500 ชิ้น
 * ดูเต็มเท่ากัน — ตัวเลขตอบคำถาม "เหลือเท่าไร" ได้ตรงกว่า
 */
export function StockCell({ stock, isPreOrder = false, className }: StockCellProps) {
  const level = getStockLevel(stock, isPreOrder);

  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      <span
        className={cn("bo-nums text-sm font-semibold", TEXT[level])}
        aria-label={`คงเหลือ ${stock} ชิ้น`}
      >
        {stock}
      </span>
      <span className="text-[11px] text-bo-muted">ชิ้น</span>
    </div>
  );
}
