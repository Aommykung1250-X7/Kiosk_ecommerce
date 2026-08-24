import type { ReactNode } from "react";
import type { StageTone } from "../../../types/admin";
import { TONE_STYLES, TONE_DOTS } from "./tones";
import { cn } from "./cn";

interface BadgeProps {
  children: ReactNode;
  tone?: StageTone;
  /** จุดสีนำหน้าข้อความ ใช้กับสถานะที่กำลังดำเนินอยู่ */
  dot?: boolean;
  /** จุดกะพริบ บอกว่างานยังค้างอยู่ */
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  pulse = false,
  size = "md",
  className,
  title,
}: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        TONE_STYLES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            TONE_DOTS[tone],
            pulse && "motion-safe:animate-pulse",
          )}
        />
      )}
      {children}
    </span>
  );
}

/**
 * ป้ายกำกับหมวดหมู่ — เรียบกว่า Badge เพราะหมวดหมู่ไม่ใช่สถานะ
 * ไม่ควรแย่งสายตาไปจากป้ายสถานะที่อยู่แถวเดียวกัน
 */
export function CategoryTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}
