import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useDialog } from "./useDialog";
import { cn } from "./cn";

type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  children: ReactNode;
  /** แถวปุ่มด้านล่าง ตรึงอยู่กับที่แม้เนื้อหาด้านบนจะเลื่อน */
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const containerRef = useDialog<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bo-ink/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white",
          "shadow-2xl shadow-slate-900/25 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
          SIZES[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-bo-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-bo-text">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-bo-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            title="ปิดหน้าต่าง"
            className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-bo-text"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="bo-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2.5 border-t border-bo-line bg-slate-50/60 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
