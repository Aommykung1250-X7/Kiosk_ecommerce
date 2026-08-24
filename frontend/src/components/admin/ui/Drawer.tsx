import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useDialog } from "./useDialog";
import { cn } from "./cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** ข้อความรองใต้หัวเรื่อง เช่น รหัสคำสั่งซื้อ */
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg";
}

/**
 * แผงเลื่อนจากขอบขวา
 * ใช้กับรายละเอียดที่ต้องดูควบคู่กับรายการด้านหลัง เช่น รายการสินค้าในคำสั่งซื้อ
 * ต่างจากโมดัลตรงที่ผู้ใช้ยังเห็นตารางที่ค้างอยู่ ไม่หลุดบริบท
 */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = "md",
}: DrawerProps) {
  const containerRef = useDialog<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-bo-ink/40 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "bo-drawer-enter flex h-full w-full flex-col bg-white shadow-2xl",
          width === "lg" ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-bo-line px-6 py-5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-bo-mono text-[11px] tracking-wide text-bo-muted uppercase">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-0.5 text-base font-semibold text-bo-text">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดแผงรายละเอียด"
            title="ปิดแผงรายละเอียด"
            className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-bo-text"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="bo-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="border-t border-bo-line bg-slate-50/60 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
