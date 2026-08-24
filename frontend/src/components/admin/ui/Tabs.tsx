import { cn } from "./cn";

export interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

/**
 * แท็บขีดเส้นใต้ — โครงเดียวกับแบบร่าง
 * ใช้กับการสลับ "มุมมองของหน้าเดียวกัน" เช่น ขั้นตอนของคำสั่งซื้อ
 */
export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "bo-rail-scroll flex gap-6 overflow-x-auto border-b border-bo-line",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm whitespace-nowrap",
              "transition-colors duration-150",
              active
                ? "border-bo-accent font-semibold text-bo-text"
                : "border-transparent font-medium text-bo-muted hover:text-bo-text",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "bo-nums rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  active ? "bg-bo-accent-soft text-bo-accent" : "bg-slate-100 text-slate-500",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * กลุ่มปุ่มในกรอบเดียว — ใช้กับตัวเลือกที่ "กรอง" ข้อมูลชุดเดิม
 * แยกจากแท็บขีดเส้นใต้โดยตั้งใจ เพื่อให้ผู้ใช้แยกออกว่าอันไหนเปลี่ยนมุมมอง อันไหนกรอง
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-bo-line bg-slate-50 p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150",
              active
                ? "bg-white text-bo-text shadow-xs"
                : "text-bo-muted hover:text-bo-text",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** ชิปกรองพร้อมจำนวน วางเรียงหลายบรรทัดได้ */
export function FilterChips<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              "transition-colors duration-150",
              active
                ? "bg-bo-ink text-white"
                : "bg-white text-bo-muted ring-1 ring-inset ring-bo-line hover:bg-slate-50 hover:text-bo-text",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "bo-nums rounded px-1 text-[11px] font-semibold",
                  active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
