import { useMemo, useState } from "react";
import type { DailyTrendRow } from "../../../types/admin";
import { formatBaht } from "../ui";
import { useMeasure } from "./useMeasure";
import {
  CHART_AXIS_TEXT,
  CHART_GRID,
  CHART_MONEY,
  CHART_PADDING,
  compactNumber,
  niceCeiling,
} from "./chartTokens";

const HEIGHT = 240;
const GRID_LINES = 4;

interface RevenueTrendChartProps {
  rows: DailyTrendRow[];
}

/**
 * แนวโน้มยอดขายรายวัน
 * ---------------------------------------------------------------------------
 * ชุดข้อมูลเดียว (ยอดขาย) จึงใช้สีเดียวและไม่มีกล่องคำอธิบายสี
 * จำนวนออเดอร์ของแต่ละวันอยู่ในกล่องข้อมูลตอนชี้เมาส์ ไม่ทำเป็นแกนที่สอง
 * เพราะสองแกนคนละหน่วยบนกราฟเดียวกันอ่านผิดได้ง่าย
 */
export function RevenueTrendChart({ rows }: RevenueTrendChartProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = useMemo(
    () =>
      rows.map((row) => ({
        date: row.date,
        revenue:
          typeof row.daily_revenue === "string"
            ? parseFloat(row.daily_revenue)
            : row.daily_revenue,
        orders: row.orders_count,
      })),
    [rows],
  );

  const maxRevenue = niceCeiling(Math.max(...points.map((p) => p.revenue), 0));
  const plotWidth = Math.max(0, width - CHART_PADDING.left - CHART_PADDING.right);
  const plotHeight = HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const xAt = (index: number) =>
    CHART_PADDING.left +
    (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const yAt = (value: number) =>
    CHART_PADDING.top + plotHeight - (value / maxRevenue) * plotHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index)},${yAt(point.revenue)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L${xAt(points.length - 1)},${CHART_PADDING.top + plotHeight} L${xAt(0)},${CHART_PADDING.top + plotHeight} Z`
      : "";

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  // ป้ายวันที่บนแกนนอน แสดงห่างๆ ไม่ให้ตัวหนังสือทับกันเมื่อช่วงเวลายาว
  const labelStep = Math.max(1, Math.ceil(points.length / 7));

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && points.length > 0 && (
        <>
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`กราฟแนวโน้มยอดขายรายวัน ${points.length} วัน`}
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const offsetX = event.clientX - bounds.left - CHART_PADDING.left;
              const ratio = plotWidth === 0 ? 0 : offsetX / plotWidth;
              const index = Math.round(ratio * (points.length - 1));
              setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
            }}
          >
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_MONEY} stopOpacity="0.18" />
                <stop offset="100%" stopColor={CHART_MONEY} stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* เส้นกริดแนวนอนพร้อมค่าบนแกนตั้ง */}
            {Array.from({ length: GRID_LINES + 1 }, (_, step) => {
              const value = (maxRevenue / GRID_LINES) * step;
              const y = yAt(value);
              return (
                <g key={step}>
                  <line
                    x1={CHART_PADDING.left}
                    y1={y}
                    x2={width - CHART_PADDING.right}
                    y2={y}
                    stroke={CHART_GRID}
                    strokeWidth={1}
                  />
                  <text
                    x={CHART_PADDING.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize={10}
                    fill={CHART_AXIS_TEXT}
                  >
                    {compactNumber(value)}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill="url(#revenue-fill)" />
            <path
              d={linePath}
              fill="none"
              stroke={CHART_MONEY}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* ป้ายวันที่ */}
            {points.map((point, index) =>
              index % labelStep === 0 || index === points.length - 1 ? (
                <text
                  key={point.date}
                  x={xAt(index)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill={CHART_AXIS_TEXT}
                >
                  {point.date.slice(5)}
                </text>
              ) : null,
            )}

            {/* เส้นชี้ตำแหน่งและจุดของวันที่กำลังชี้อยู่ */}
            {hoverIndex !== null && hovered && (
              <g>
                <line
                  x1={xAt(hoverIndex)}
                  y1={CHART_PADDING.top}
                  x2={xAt(hoverIndex)}
                  y2={CHART_PADDING.top + plotHeight}
                  stroke={CHART_MONEY}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xAt(hoverIndex)}
                  cy={yAt(hovered.revenue)}
                  r={5}
                  fill={CHART_MONEY}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>

          {hoverIndex !== null && hovered && (
            <div
              className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-lg border border-bo-line bg-white px-3 py-2 shadow-lg shadow-slate-900/10"
              style={{
                left: Math.min(Math.max(xAt(hoverIndex), 76), width - 76),
                top: Math.max(yAt(hovered.revenue) - 66, 0),
              }}
            >
              <p className="text-[11px] font-medium text-bo-muted">{hovered.date}</p>
              <p className="bo-nums mt-0.5 text-sm font-semibold text-bo-text">
                {formatBaht(hovered.revenue)}
              </p>
              <p className="bo-nums mt-0.5 text-[11px] text-bo-muted">
                {hovered.orders} คำสั่งซื้อ
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
