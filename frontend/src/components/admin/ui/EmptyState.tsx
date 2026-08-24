import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** บอกวิธีทำให้หน้าจอนี้มีข้อมูล ไม่ใช่แค่บอกว่าว่าง */
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-bo-text">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-bo-muted">
          {description}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** สถานะกำลังโหลดของพื้นที่เนื้อหา ใช้คู่กับ EmptyState เพื่อไม่ให้หน้าจอกระพริบเป็นค่าว่าง */
export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-bo-accent" />
      <p className="text-xs font-medium text-bo-muted">{label}</p>
    </div>
  );
}

/** แถบแจ้งข้อผิดพลาดระดับหน้า บอกสิ่งที่เกิดขึ้นตรงๆ ไม่ต้องขอโทษ */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}
