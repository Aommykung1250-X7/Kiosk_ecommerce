import { cn } from "../ui";
import { CHART_COUNT } from "./chartTokens";

export interface BarRow {
  id: string | number;
  label: string;
  value: number;
  /** ข้อความที่แสดงแทนตัวเลขดิบ เช่น ยอดเงินที่จัดรูปแบบแล้ว */
  display: string;
  /** บรรทัดรองใต้ชื่อ เช่น หมวดหมู่ */
  meta?: string;
}

interface HorizontalBarListProps {
  rows: BarRow[];
  color?: string;
  className?: string;
}

/**
 * แท่งเรียงแนวนอน
 * ---------------------------------------------------------------------------
 * ใช้กับการเทียบขนาดของรายการที่มีชื่อยาว — ชื่อไทยอ่านง่ายกว่าเมื่อวางแนวนอน
 * เรียงจากมากไปน้อยเสมอ และติดตัวเลขไว้ทุกแท่งเพราะมีไม่กี่แถว
 */
export function HorizontalBarList({
  rows,
  color = CHART_COUNT,
  className,
}: HorizontalBarListProps) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {rows.map((row, index) => (
        <li key={row.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="bo-nums w-4 shrink-0 text-[11px] text-slate-400">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-bo-text">
                  {row.label}
                </span>
                {row.meta && (
                  <span className="block truncate text-[11px] text-bo-muted">
                    {row.meta}
                  </span>
                )}
              </span>
            </span>
            <span className="bo-nums shrink-0 text-sm font-semibold text-bo-text">
              {row.display}
            </span>
          </div>

          <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.max(2, (row.value / max) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
