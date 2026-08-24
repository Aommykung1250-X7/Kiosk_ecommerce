import { useEffect, useRef, useState } from "react";

/**
 * วัดความกว้างจริงของกล่องที่ครอบกราฟ
 * วาด SVG ตามพิกเซลจริงแทนการยืด viewBox เส้นและตัวอักษรจึงคมและไม่บิดสัดส่วน
 */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.clientWidth);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
