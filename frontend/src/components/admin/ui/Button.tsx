import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-bo-accent text-white hover:bg-bo-accent-hover shadow-sm shadow-blue-600/20",
  secondary:
    "bg-white text-bo-text ring-1 ring-inset ring-bo-line hover:bg-slate-50 shadow-xs",
  ghost: "bg-transparent text-bo-muted hover:bg-slate-100 hover:text-bo-text",
  danger: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-100",
  dark: "bg-bo-ink text-white hover:bg-bo-ink-2 shadow-sm",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-sm gap-2",
};

const ICON_SIZES: Record<Size, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-[18px] w-[18px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconNode = Icon ? <Icon className={cn(ICON_SIZES[size], "shrink-0")} /> : null;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold",
        "transition-colors duration-150 motion-safe:active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {iconPosition === "left" && iconNode}
      {children}
      {iconPosition === "right" && iconNode}
    </button>
  );
}

/** ปุ่มไอคอนล้วน สำหรับคอลัมน์จัดการในตารางที่พื้นที่จำกัด */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** ต้องมีเสมอ เพราะปุ่มไม่มีข้อความให้โปรแกรมอ่านหน้าจออ่าน */
  label: string;
  tone?: "neutral" | "danger";
}

export function IconButton({
  icon: Icon,
  label,
  tone = "neutral",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-40",
        tone === "danger"
          ? "text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          : "text-slate-400 hover:bg-slate-100 hover:text-bo-text",
        className,
      )}
      {...rest}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
