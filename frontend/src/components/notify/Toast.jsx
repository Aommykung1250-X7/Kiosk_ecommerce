import { useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

/**
 * รูปแบบสีและไอคอนของ toast แต่ละชนิด
 * ใช้ token จาก @theme ใน index.css เท่านั้น (brand / ink / danger / warning / success / info)
 */
const VARIANTS = {
  success: {
    Icon: CheckCircleIcon,
    accent: "border-l-success",
    iconWrap: "bg-success/10 text-success",
    progress: "bg-success",
    defaultTitle: "สำเร็จ",
  },
  error: {
    Icon: XCircleIcon,
    accent: "border-l-danger",
    iconWrap: "bg-danger/10 text-danger",
    progress: "bg-danger",
    defaultTitle: "เกิดข้อผิดพลาด",
  },
  warning: {
    Icon: ExclamationTriangleIcon,
    accent: "border-l-warning",
    iconWrap: "bg-warning/10 text-warning",
    progress: "bg-warning",
    defaultTitle: "โปรดตรวจสอบ",
  },
  info: {
    Icon: InformationCircleIcon,
    accent: "border-l-info",
    iconWrap: "bg-info/10 text-info",
    progress: "bg-info",
    defaultTitle: "ข้อมูล",
  },
};

// เลือกคลาสแอนิเมชันขาเข้าให้สอดคล้องกับมุมที่ toast โผล่ออกมา
function enterAnimationClass(position) {
  if (position.endsWith("center")) return "notify-toast-enter-center";
  if (position.endsWith("left")) return "notify-toast-enter-left";
  return "notify-toast-enter";
}

export default function Toast({ toast, position, onDismiss }) {
  const { id, type, message, title, duration, leaving } = toast;
  const variant = VARIANTS[type] ?? VARIANTS.info;
  const { Icon } = variant;

  const [paused, setPaused] = useState(false);

  // เวลาที่เหลือก่อนปิดอัตโนมัติ ลดลงทุกครั้งที่ผู้ใช้เอาเมาส์ไปวางแล้วเอาออก
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);

  useEffect(() => {
    // duration <= 0 หมายถึงค้างไว้จนกว่าผู้ใช้จะกดปิดเอง
    if (leaving || paused || duration <= 0) return;

    startedAtRef.current = Date.now();
    const timer = setTimeout(() => onDismiss(id), remainingRef.current);

    return () => {
      clearTimeout(timer);
      // เก็บเวลาที่เหลือไว้ เพื่อให้นับต่อจากเดิมเมื่อเลิก hover
      remainingRef.current -= Date.now() - startedAtRef.current;
    };
  }, [id, duration, paused, leaving, onDismiss]);

  // ข้อความแสดงข้อผิดพลาดต้องประกาศทันที ส่วนชนิดอื่นรอให้อ่านจบก่อน
  const isAssertive = type === "error";

  return (
    <div
      role="status"
      aria-live={isAssertive ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={[
        "pointer-events-auto relative w-full overflow-hidden",
        "bg-white/95 backdrop-blur-md",
        "border border-gray-200 border-l-4",
        variant.accent,
        "rounded-2xl shadow-2xl",
        "flex items-start gap-3.5 p-4 pr-11",
        "font-['Prompt'] text-left",
        leaving ? "notify-toast-leave" : enterAnimationClass(position),
      ].join(" ")}
    >
      {/* ไอคอนประจำชนิดของข้อความ */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variant.iconWrap}`}
        aria-hidden="true"
      >
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-sm font-extrabold text-surface-dark leading-snug">
          {title ?? variant.defaultTitle}
        </h4>
        <p className="text-xs text-ink/70 font-medium mt-0.5 leading-relaxed break-words">
          {message}
        </p>
      </div>

      {/* ปุ่มปิดด้วยตนเอง */}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="ปิดการแจ้งเตือน"
        className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-surface-dark hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      {/* แถบแสดงเวลาที่เหลือ หยุดเดินเมื่อผู้ใช้เอาเมาส์ไปวาง */}
      {duration > 0 && !leaving && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100" aria-hidden="true">
          <div
            className={`notify-progress-bar h-full ${variant.progress}`}
            style={{
              animationDuration: `${duration}ms`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}
