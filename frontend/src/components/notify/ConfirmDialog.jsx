import { useId } from "react";
import {
  ExclamationTriangleIcon,
  TrashIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";
import { useFocusTrap } from "./useFocusTrap";

/**
 * รูปแบบของกล่องยืนยันแต่ละชนิด
 * ใช้โครงหน้าตาเดียวกับโมดัลเดิมของโปรเจกต์ (SupportModal): หัวสีเข้ม + การ์ดขาวมุมมน 3xl
 */
const VARIANTS = {
  danger: {
    Icon: TrashIcon,
    iconWrap: "bg-danger text-white",
    confirmButton: "bg-danger hover:bg-[#C62828] text-white",
  },
  warning: {
    Icon: ExclamationTriangleIcon,
    iconWrap: "bg-warning text-white",
    confirmButton: "bg-warning hover:bg-[#BF360C] text-white",
  },
  primary: {
    Icon: QuestionMarkCircleIcon,
    iconWrap: "bg-brand text-surface-dark",
    confirmButton: "bg-brand hover:bg-brand-hover text-surface-dark",
  },
  info: {
    Icon: InformationCircleIcon,
    iconWrap: "bg-info text-white",
    confirmButton: "bg-info hover:bg-[#4CA294] text-white",
  },
};

export default function ConfirmDialog({ dialog, onResolve }) {
  const { title, message, confirmText, cancelText, variant, dismissOnBackdrop } = dialog;
  const config = VARIANTS[variant] ?? VARIANTS.danger;
  const { Icon } = config;

  const titleId = useId();
  const messageId = useId();

  // ขังโฟกัสไว้ในกล่อง และปิดด้วย ESC (ผลลัพธ์เป็น false เหมือนกดยกเลิก)
  const containerRef = useFocusTrap(true, () => onResolve(false));

  const handleBackdropClick = (event) => {
    // ปิดเฉพาะเมื่อคลิกที่ฉากหลังจริงๆ ไม่ใช่คลิกทะลุมาจากตัวการ์ด
    if (event.target !== event.currentTarget) return;
    if (!dismissOnBackdrop) return;
    onResolve(false);
  };

  return (
    <div
      onMouseDown={handleBackdropClick}
      style={{ zIndex: 70 }}
      className="notify-backdrop-enter fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Prompt']"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        tabIndex={-1}
        className="notify-dialog-enter bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 outline-none"
      >
        {/* หัวกล่อง ใช้โทนเข้มเหมือนโมดัลอื่นในระบบ */}
        <div className="bg-surface-dark text-white p-5 flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${config.iconWrap}`}
            aria-hidden="true"
          >
            <Icon className="w-6 h-6" />
          </div>
          <h2 id={titleId} className="text-lg font-extrabold tracking-tight leading-snug">
            {title}
          </h2>
        </div>

        {/* เนื้อหา */}
        {message && (
          <div className="p-6">
            <p id={messageId} className="text-sm text-ink leading-relaxed font-medium">
              {message}
            </p>
            {variant === "danger" && (
              <p className="text-xs text-danger font-bold mt-3">
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            )}
          </div>
        )}

        {/* ปุ่มดำเนินการ */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="px-5 py-3 bg-white border border-gray-300 text-ink text-sm font-extrabold rounded-2xl hover:bg-gray-100 active:scale-[0.99] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={`px-5 py-3 text-sm font-extrabold rounded-2xl active:scale-[0.99] transition-all cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink/40 ${config.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
