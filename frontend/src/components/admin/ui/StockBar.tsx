import { cn } from "./cn";
import { getStockLevel, SHELF_CAPACITY, type StockLevel } from "./stock";

const FILL: Record<StockLevel, string> = {
  out: "bg-rose-500",
  low: "bg-amber-500",
  healthy: "bg-bo-accent",
  preorder: "bg-bo-pink",
};

const TEXT: Record<StockLevel, string> = {
  out: "text-rose-600",
  low: "text-amber-600",
  healthy: "text-bo-text",
  preorder: "text-bo-pink",
};

interface StockBarProps {
  stock: number;
  isPreOrder?: boolean;
  /** ความจุอ้างอิงของแท่ง เปลี่ยนได้เมื่อสินค้ากลุ่มนั้นสต็อกสูงกว่าปกติ */
  capacity?: number;
  className?: string;
}

/**
 * แท่งวัดสต็อก
 * ---------------------------------------------------------------------------
 * ตัวเลขบอกจำนวนที่แน่นอน แท่งด้านล่างบอก "เหลือเยอะแค่ไหน" เทียบกับชั้นวางเต็ม
 * ทำให้กวาดตาลงคอลัมน์เดียวก็รู้ว่าของชิ้นไหนต้องเติมก่อน โดยไม่ต้องอ่านทุกตัวเลข
 */
export function StockBar({
  stock,
  isPreOrder = false,
  capacity = SHELF_CAPACITY,
  className,
}: StockBarProps) {
  const level = getStockLevel(stock, isPreOrder);
  const ratio = Math.max(0, Math.min(1, stock / capacity));
  const percent = stock > 0 ? Math.max(6, ratio * 100) : 0;

  return (
    <div className={cn("flex w-24 flex-col gap-1.5", className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn("bo-nums text-sm font-semibold", TEXT[level])}>{stock}</span>
        <span className="text-[11px] text-bo-muted">ชิ้น</span>
      </div>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-slate-200"
        role="img"
        aria-label={`คงเหลือ ${stock} ชิ้น จากความจุอ้างอิง ${capacity} ชิ้น`}
      >
        {percent > 0 && (
          <div
            className={cn("h-full rounded-full transition-[width] duration-300", FILL[level])}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
