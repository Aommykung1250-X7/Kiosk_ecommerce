import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  className = "",
  placeholder = "เลือกวันที่...",
  ...props
}: DatePickerProps) {
  return (
    <div className={`relative flex items-center shrink-0 ${className.includes("w-") ? "" : "w-full"}`}>
      <div className="absolute left-3 text-amber-600 pointer-events-none flex items-center justify-center">
        <CalendarIcon className="w-4 h-4" />
      </div>

      <input
        type="date"
        value={value ? value.substring(0, 10) : ""}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10.5 pl-9 pr-3 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all focus:ring-3 focus:ring-amber-500/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
}
