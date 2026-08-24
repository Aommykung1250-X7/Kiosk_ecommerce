import type { ReactNode } from "react";
import { cn } from "./cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** ตัดขอบในออก ใช้เมื่อเนื้อหาเป็นตารางที่ต้องชนขอบการ์ด */
  flush?: boolean;
}

/** พื้นผิวสีขาวมาตรฐานของหลังบ้าน — เงาบางมาก ให้เส้นขอบเป็นตัวแบ่งพื้นที่แทน */
export function Card({ children, className, flush = false }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-bo-line bg-white shadow-[0_1px_2px_rgba(23,27,46,0.04)]",
        !flush && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, actions, className }: CardHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-bo-text">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-bo-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** หัวข้อระดับหน้า วางเหนือการ์ดทั้งหมด ตามโครงของแบบร่าง */
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-bo-text">{title}</h1>
        {description && <p className="mt-1 text-sm text-bo-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
