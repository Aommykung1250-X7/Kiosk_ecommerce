import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { useId } from "react";
import { cn } from "./cn";

const CONTROL_BASE =
  "w-full rounded-xl border border-bo-line bg-white px-3.5 text-sm text-bo-text " +
  "placeholder:text-slate-400 transition-colors duration-150 outline-none " +
  "hover:border-slate-300 focus:border-bo-accent focus:ring-4 focus:ring-bo-accent/10 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  /** ข้อความบอกว่าไม่ต้องกรอกก็ได้ วางชิดขวาของป้ายชื่อ */
  optionalNote?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
  className?: string;
}

/** ห่อ label + ตัวควบคุม + คำอธิบายใต้ช่อง ให้ผูก id/for ถูกต้องอัตโนมัติ */
export function Field({
  label,
  hint,
  optionalNote,
  required = false,
  children,
  className,
}: FieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-bo-text">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
        {optionalNote && (
          <span className="text-[11px] text-bo-muted">{optionalNote}</span>
        )}
      </div>
      {children(id)}
      {hint && <p className="text-[11px] leading-relaxed text-bo-muted">{hint}</p>}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** ใช้ฟอนต์ mono สำหรับรหัส เลขพัสดุ และคีย์ภาษาอังกฤษ */
  mono?: boolean;
}

export function TextInput({ mono = false, className, ...rest }: TextInputProps) {
  return (
    <input
      className={cn(CONTROL_BASE, "h-10", mono && "font-bo-mono text-[13px]", className)}
      {...rest}
    />
  );
}

export function TextArea({
  className,
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(CONTROL_BASE, "resize-none py-2.5 leading-relaxed", className)}
      {...rest}
    />
  );
}

/** ช่องกรอกเงิน/จำนวน — ตัวเลขชิดขวาและกว้างเท่ากันทุกหลัก อ่านง่ายกว่าเมื่อวางเรียงกัน */
export function NumberInput({
  className,
  prefix,
  suffix,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }) {
  return (
    <div className={cn("relative w-full", className)}>
      {prefix && (
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-bo-muted">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        className={cn(
          CONTROL_BASE,
          "bo-nums h-10",
          prefix && "pl-8",
          suffix && "pr-16",
        )}
        {...rest}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-7 -translate-y-1/2 text-xs text-bo-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** ตัวเลือกแบบวงกลม ตามที่ปรากฏในแบบร่างของหน้าฟอร์มสินค้า */
interface RadioOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  className,
  labelledBy,
}: {
  name: string;
  value: T;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  /** id ของหัวข้อกลุ่ม ให้โปรแกรมอ่านหน้าจอประกาศชื่อกลุ่มก่อนตัวเลือก */
  labelledBy?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap gap-6", className)}
      role="radiogroup"
      aria-labelledby={labelledBy}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 select-none"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                checked ? "border-bo-accent" : "border-slate-300",
              )}
            >
              {checked && <span className="h-2.5 w-2.5 rounded-full bg-bo-accent" />}
            </span>
            <span className="text-sm font-medium text-bo-text">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** สวิตช์เปิด/ปิด ใช้กับการมองเห็นของสินค้าและสื่อโฆษณา */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-bo-accent" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#2B6BF0]"
      />
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm font-medium text-bo-text">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] text-bo-muted">{description}</span>
        )}
      </label>
    </div>
  );
}
