import { Search, X } from "lucide-react";
import { cn } from "./cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "ค้นหา",
  className,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        aria-label={ariaLabel ?? placeholder}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-xl border border-bo-line bg-white pr-10 pl-10 text-sm text-bo-text",
          "placeholder:text-slate-400 transition-colors duration-150 outline-none",
          "hover:border-slate-300 focus:border-bo-accent focus:ring-4 focus:ring-bo-accent/10",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="ล้างคำค้นหา"
          title="ล้างคำค้นหา"
          className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-bo-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
