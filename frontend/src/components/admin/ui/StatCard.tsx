import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

type Accent =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "preorder"
  | "lowstock";

const ACCENT_ICON: Record<Accent, string> = {
  neutral: "bg-slate-100 text-slate-500",
  accent: "bg-bo-accent-soft text-bo-accent",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
  preorder: "bg-bo-preorder-soft text-amber-700",
  lowstock: "bg-bo-lowstock-soft text-bo-lowstock",
};

const ACCENT_VALUE: Record<Accent, string> = {
  neutral: "text-bo-text",
  accent: "text-bo-accent",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
  preorder: "text-amber-600",
  lowstock: "text-bo-lowstock",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** หน่วยที่ต่อท้ายตัวเลข เช่น "รายการ" — เล็กกว่าและจางกว่าตัวเลขเสมอ */
  unit?: string;
  hint?: ReactNode;
  icon?: LucideIcon;
  accent?: Accent;
  /** การ์ดใบเด่นของแถว ใช้พื้นเข้มเพื่อดึงสายตามาที่ตัวเลขสำคัญที่สุด */
  emphasis?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  accent = "neutral",
  emphasis = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-[0_1px_2px_rgba(23,27,46,0.04)]",
        emphasis ? "border-bo-ink bg-bo-ink" : "border-bo-line bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "text-xs font-medium",
            emphasis ? "text-slate-400" : "text-bo-muted",
          )}
        >
          {label}
        </span>
        {Icon && (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              emphasis ? "bg-white/10 text-white" : ACCENT_ICON[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "bo-nums text-[26px] leading-none font-semibold tracking-tight",
              emphasis ? "text-white" : ACCENT_VALUE[accent],
            )}
          >
            {value}
          </span>
          {unit && (
            <span
              className={cn(
                "text-xs font-medium",
                emphasis ? "text-slate-400" : "text-bo-muted",
              )}
            >
              {unit}
            </span>
          )}
        </div>
        {hint && (
          <p
            className={cn(
              "mt-1.5 text-[11px]",
              emphasis ? "text-slate-400" : "text-bo-muted",
            )}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
