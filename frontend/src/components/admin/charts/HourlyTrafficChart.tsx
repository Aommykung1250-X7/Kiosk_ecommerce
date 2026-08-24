import { useState } from "react";
import type { HourlyTrafficRow } from "../../../types/admin";
import { formatBaht } from "../ui";
import { useMeasure } from "./useMeasure";
import { CHART_AXIS_TEXT, CHART_COUNT, CHART_GRID, niceCeiling } from "./chartTokens";

const HEIGHT = 200;
const PADDING = { top: 14, right: 8, bottom: 24, left: 32 };
const BAR_GAP = 2;

/**
 * คำสั่งซื้อตามช่วงเวลาของวัน
 * แสดงจำนวนออเดอร์เป็นแท่ง ส่วนยอดเงินอยู่ในกล่องข้อมูลตอนชี้เมาส์
 * ไม่ทำแกนที่สอง เพราะหน่วยคนละอย่างบนภาพเดียวกันชวนให้อ่านผิด
 */
export function HourlyTrafficChart({ rows }: { rows: HourlyTrafficRow[] }) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxOrders = niceCeiling(Math.max(...rows.map((row) => row.orders), 0));
  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const slotWidth = rows.length > 0 ? plotWidth / rows.length : 0;
  const barWidth = Math.max(3, slotWidth - BAR_GAP * 2);

  const hovered = hoverIndex !== null ? rows[hoverIndex] : null;
  const labelStep = Math.max(1, Math.ceil(rows.length / 8));

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && rows.length > 0 && (
        <>
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label="กราฟจำนวนคำสั่งซื้อตามช่วงเวลาของวัน"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {[0, 0.5, 1].map((fraction) => {
              const y = PADDING.top + plotHeight - fraction * plotHeight;
              return (
                <g key={fraction}>
                  <line
                    x1={PADDING.left}
                    y1={y}
                    x2={width - PADDING.right}
                    y2={y}
                    stroke={CHART_GRID}
                    strokeWidth={1}
                  />
                  <text
                    x={PADDING.left - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize={10}
                    fill={CHART_AXIS_TEXT}
                  >
                    {Math.round(maxOrders * fraction)}
                  </text>
                </g>
              );
            })}

            {rows.map((row, index) => {
              const barHeight =
                maxOrders === 0 ? 0 : (row.orders / maxOrders) * plotHeight;
              const x = PADDING.left + index * slotWidth + BAR_GAP;
              const y = PADDING.top + plotHeight - barHeight;
              const active = hoverIndex === index;

              return (
                <g key={row.hour} onMouseEnter={() => setHoverIndex(index)}>
                  {/* พื้นที่รับเมาส์เต็มความสูง กดโดนง่ายกว่าแท่งที่เตี้ยมาก */}
                  <rect
                    x={PADDING.left + index * slotWidth}
                    y={PADDING.top}
                    width={slotWidth}
                    height={plotHeight}
                    fill="transparent"
                  />
                  {barHeight > 0 && (
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={3}
                      fill={CHART_COUNT}
                      opacity={hoverIndex === null || active ? 1 : 0.45}
                    />
                  )}
                  {(index % labelStep === 0 || index === rows.length - 1) && (
                    <text
                      x={x + barWidth / 2}
                      y={HEIGHT - 7}
                      textAnchor="middle"
                      fontSize={10}
                      fill={CHART_AXIS_TEXT}
                    >
                      {row.hour}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hoverIndex !== null && hovered && (
            <div
              className="pointer-events-none absolute z-10 min-w-32 -translate-x-1/2 rounded-lg border border-bo-line bg-white px-3 py-2 shadow-lg shadow-slate-900/10"
              style={{
                left: Math.min(
                  Math.max(PADDING.left + hoverIndex * slotWidth + slotWidth / 2, 68),
                  width - 68,
                ),
                top: 0,
              }}
            >
              <p className="text-[11px] font-medium text-bo-muted">{hovered.hour}</p>
              <p className="bo-nums mt-0.5 text-sm font-semibold text-bo-text">
                {hovered.orders} คำสั่งซื้อ
              </p>
              <p className="bo-nums mt-0.5 text-[11px] text-bo-muted">
                {formatBaht(hovered.revenue)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
