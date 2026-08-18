import { useEffect, useRef } from "react";

// ตัวเลือกที่โฟกัสได้ทั้งหมดภายในกล่อง
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap
 * ---------------------------------------------------------------------------
 * ขังโฟกัสของคีย์บอร์ดไว้ภายในกล่องที่กำหนด และคืนโฟกัสกลับไปยังอิลิเมนต์
 * ที่ผู้ใช้กดก่อนเปิดกล่อง เมื่อกล่องถูกปิด
 *
 * @param {boolean}  active     เปิดใช้งานหรือไม่
 * @param {Function} onEscape   ฟังก์ชันที่เรียกเมื่อผู้ใช้กด ESC
 */
export function useFocusTrap(active, onEscape) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  // เก็บ callback ล่าสุดไว้ใน ref เพื่อไม่ให้ effect ผูกใหม่ทุกครั้งที่ re-render
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // จำอิลิเมนต์ที่โฟกัสอยู่ก่อนเปิดกล่อง เพื่อคืนโฟกัสตอนปิด
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // ย้ายโฟกัสเข้าไปในกล่อง โดยเลือกตัวแรกที่โฟกัสได้
    const focusables = container.querySelectorAll(FOCUSABLE);
    const first = focusables[0];
    if (first instanceof HTMLElement) {
      first.focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      // คำนวณรายการที่โฟกัสได้ใหม่ทุกครั้ง เผื่อเนื้อหาในกล่องเปลี่ยนไป
      const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (el) => el instanceof HTMLElement && el.offsetParent !== null
      );
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      // วนโฟกัสกลับหัว-ท้าย ไม่ให้หลุดออกนอกกล่อง
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    // ล็อกการเลื่อนหน้าจอด้านหลังขณะเปิดกล่อง
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;

      // คืนโฟกัสกลับไปยังปุ่มที่ผู้ใช้กดตอนแรก
      const previous = previousFocusRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [active]);

  return containerRef;
}
