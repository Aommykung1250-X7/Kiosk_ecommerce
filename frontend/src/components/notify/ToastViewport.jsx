import { useEffect, useLayoutEffect, useState } from "react";
import Toast from "./Toast";

// ตัวตู้คีออสบนจอเดสก์ท็อปถูกจำกัดความกว้างไว้ 600px และจัดกึ่งกลาง
// จึงต้องวัดขนาดกล่องนี้เพื่อให้ toast ลอยอยู่ในกรอบหน้าจอตู้ ไม่หลุดไปอยู่พื้นหลังสีเข้ม
const KIOSK_SELECTOR = ".kiosk-app-container";

/**
 * useHostRect
 * ---------------------------------------------------------------------------
 * เฝ้าดูกรอบของตู้คีออส หากหน้าปัจจุบันมีกล่องนี้อยู่ (หน้า Home)
 * จะคืนค่าพิกัดของกล่องเพื่อนำไปวาง toast ให้ตรงกรอบ
 * ส่วนหน้าอื่น (แอดมิน / มือถือ) จะคืน null แล้วใช้เต็มหน้าจอแทน
 */
function useHostRect(active) {
  const [rect, setRect] = useState(null);

  // ใช้ useLayoutEffect เพื่อวัดกรอบให้เสร็จก่อนเบราว์เซอร์วาดจริง
  // ไม่เช่นนั้น toast จะกระพริบที่ตำแหน่งเดิมหนึ่งเฟรมก่อนเด้งเข้ากรอบตู้
  useLayoutEffect(() => {
    // วัดเฉพาะตอนที่มี toast แสดงอยู่จริง จะได้ไม่ต้องเฝ้า DOM ตลอดเวลา
    if (!active) return;

    let frame = 0;

    const measure = () => {
      const host = document.querySelector(KIOSK_SELECTOR);
      if (!host) {
        setRect((prev) => (prev === null ? prev : null));
        return;
      }

      const next = host.getBoundingClientRect();
      setRect((prev) => {
        // เทียบค่าก่อนอัปเดต เพื่อไม่ให้ re-render ถี่เกินจำเป็น
        if (
          prev &&
          prev.left === next.left &&
          prev.top === next.top &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return { left: next.left, top: next.top, width: next.width, height: next.height };
      });
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();

    window.addEventListener("resize", scheduleMeasure);

    // ติดตามการเปลี่ยนขนาดของตัวกล่องเอง
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const host = document.querySelector(KIOSK_SELECTOR);
    if (host) resizeObserver.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleMeasure);
      resizeObserver.disconnect();
    };
  }, [active]);

  return rect;
}

/** แปลงค่า position เป็นสไตล์การวางตำแหน่ง โดยอิงกรอบที่วัดได้ */
function buildPositionStyle(position, offset, rect) {
  const [vertical, horizontal] = position.split("-");

  // พื้นที่อ้างอิง: กรอบตู้คีออสถ้ามี ไม่มีก็ใช้ทั้งหน้าจอ
  const area = rect ?? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

  // บนจอแคบให้ toast กว้างเต็มพื้นที่โดยเว้นขอบซ้ายขวาไว้
  const isNarrow = area.width < 640;
  const maxWidth = isNarrow ? area.width - offset.side * 2 : 400;

  const style = {
    position: "fixed",
    width: `${Math.max(200, maxWidth)}px`,
    maxHeight: `${area.height - offset.top - offset.bottom}px`,
  };

  if (vertical === "top") {
    style.top = `${area.top + offset.top}px`;
  } else {
    style.bottom = `${window.innerHeight - (area.top + area.height) + offset.bottom}px`;
  }

  if (horizontal === "center" || isNarrow) {
    // จอแคบบังคับให้อยู่กึ่งกลางเสมอ เพื่อให้ได้ความกว้างเต็มพร้อมระยะขอบเท่ากัน
    style.left = `${area.left + area.width / 2}px`;
    style.transform = "translateX(-50%)";
  } else if (horizontal === "left") {
    style.left = `${area.left + offset.side}px`;
  } else {
    style.left = `${area.left + area.width - maxWidth - offset.side}px`;
  }

  return style;
}

export default function ToastViewport({ toasts, config, onDismiss }) {
  const rect = useHostRect(toasts.length > 0);
  const { position, offset } = config;

  // เก็บขนาดหน้าจอไว้ใน state เพื่อให้คำนวณตำแหน่งใหม่เมื่อจอเปลี่ยนขนาด
  const [, setViewportTick] = useState(0);
  useEffect(() => {
    const onResize = () => setViewportTick((n) => n + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (toasts.length === 0) return null;

  const style = buildPositionStyle(position, offset, rect);

  // toast ที่มาใหม่ควรอยู่ใกล้ขอบจอที่สุดเสมอ
  const ordered = position.startsWith("top") ? toasts : [...toasts].reverse();

  return (
    <div
      style={{ ...style, zIndex: 80 }}
      className="pointer-events-none flex flex-col gap-3 overflow-hidden"
    >
      {ordered.map((toast) => (
        <Toast key={toast.id} toast={toast} position={position} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
