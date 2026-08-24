import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  /** ตัวเลขท้ายรายการ เช่น จำนวนสินค้าในหมวดนั้น */
  count?: number;
  disabled?: boolean;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  menuClassName?: string;
}

/**
 * รายการให้เลือกแบบกำหนดเอง
 * ใช้แทน <select> เพราะต้องแสดงจำนวนต่อท้ายและคุมสไตล์ให้ตรงกับส่วนอื่น
 * ปิดด้วย Escape และคลิกนอกกรอบ เลื่อนด้วยลูกศรขึ้น/ลงได้
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = "เลือกรายการ",
  disabled = false,
  id,
  className,
  menuClassName,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => {
          const step = event.key === "ArrowDown" ? 1 : -1;
          const next = (current + step + options.length) % options.length;
          return next;
        });
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const option = options[activeIndex];
        if (option && !option.disabled) {
          onChange(option.value);
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, options, activeIndex, onChange]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(event) => {
          if (disabled) return;
          // อ่าน element ไว้ก่อน เพราะ React ล้าง currentTarget ทิ้งหลังจบ handler
          const trigger = event.currentTarget;
          setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
          setOpen((current) => {
            // ในโมดัลที่เนื้อหาเลื่อนได้ เมนูอาจถูกตัดขอบล่าง
            // เลื่อนตัวช่องเข้ามาในสายตาก่อน เมนูจึงกางได้เต็ม
            if (!current) trigger.scrollIntoView({ block: "nearest" });
            return !current;
          });
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-sm",
          "transition-colors duration-150 outline-none",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          open
            ? "border-bo-accent ring-4 ring-bo-accent/10"
            : "border-bo-line hover:border-slate-300",
        )}
      >
        <span
          className={cn(
            "truncate",
            selected ? "font-medium text-bo-text" : "text-slate-400",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180 text-bo-accent",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "bo-scroll absolute top-[calc(100%+6px)] right-0 left-0 z-30 max-h-60 overflow-y-auto",
            "rounded-xl border border-bo-line bg-white p-1.5 shadow-lg shadow-slate-900/8",
            menuClassName,
          )}
        >
          {options.length === 0 ? (
            <p className="px-3 py-2.5 text-center text-xs text-bo-muted">ไม่มีตัวเลือก</p>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm",
                    "transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40",
                    isSelected
                      ? "bg-bo-accent-soft font-semibold text-bo-accent"
                      : index === activeIndex
                        ? "bg-slate-50 text-bo-text"
                        : "text-bo-text",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {option.count !== undefined && (
                      <span className="bo-nums rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                        {option.count}
                      </span>
                    )}
                    {isSelected && <Check className="h-4 w-4" />}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
