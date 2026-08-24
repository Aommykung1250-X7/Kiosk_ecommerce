import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * ตารางความหนาแน่นสูงของหลังบ้าน
 * แถวคั่นด้วยเส้นบางแทนแถบสลับสี เพื่อให้ป้ายสถานะสีต่างๆ ในแถวยังเด่นอยู่
 */
export function TableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-bo-line bg-white shadow-[0_1px_2px_rgba(23,27,46,0.04)]",
        className,
      )}
    >
      <div className="bo-scroll overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full border-collapse text-left text-sm">{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-bo-line bg-slate-50/80">
      <tr>{children}</tr>
    </thead>
  );
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export function Th({ children, align = "left", className, ...rest }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-[11px] font-semibold tracking-wide text-bo-muted uppercase",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-bo-line">{children}</tbody>;
}

export function Tr({
  children,
  onClick,
  selected = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors duration-100",
        onClick && "cursor-pointer",
        selected ? "bg-bo-accent-soft/60" : onClick && "hover:bg-slate-50",
        !onClick && "hover:bg-slate-50/60",
        className,
      )}
    >
      {children}
    </tr>
  );
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export function Td({ children, align = "left", className, ...rest }: TdProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-bo-text",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}
