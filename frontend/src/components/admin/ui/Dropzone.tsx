import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "./cn";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  busy?: boolean;
  /** อัตราส่วนของกรอบพรีวิว ให้ตรงกับหน้าจอที่สื่อจะไปแสดงจริง */
  aspect?: "16/9" | "4/3" | "1/1";
  title: string;
  hint: string;
  disabled?: boolean;
}

const ASPECT: Record<NonNullable<DropzoneProps["aspect"]>, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-4/3",
  "1/1": "aspect-square",
};

/** พื้นที่ลากไฟล์มาวาง กรอบเป็นอัตราส่วนเดียวกับจอปลายทาง จึงเห็นสัดส่วนจริงก่อนอัปโหลด */
export function Dropzone({
  onFiles,
  accept = "image/*",
  multiple = false,
  busy = false,
  aspect = "16/9",
  title,
  hint,
  disabled = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled || busy) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed",
          "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
          ASPECT[aspect],
          dragging
            ? "border-bo-accent bg-bo-accent-soft"
            : "border-slate-300 bg-slate-50 hover:border-bo-accent hover:bg-bo-accent-soft/50",
        )}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-bo-accent" />
        ) : (
          <ImagePlus
            className={cn("h-6 w-6", dragging ? "text-bo-accent" : "text-slate-400")}
          />
        )}
        <span className="text-sm font-medium text-bo-text">
          {busy ? "กำลังอัปโหลด" : title}
        </span>
        <span className="max-w-[80%] text-center text-[11px] leading-relaxed text-bo-muted">
          {hint}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          event.target.value = "";
        }}
      />
    </>
  );
}
