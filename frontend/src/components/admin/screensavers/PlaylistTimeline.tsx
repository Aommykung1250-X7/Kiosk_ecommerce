import { Clock, MonitorPlay } from "lucide-react";
import type { Screensaver } from "../../../types/admin";
import { cn } from "../ui";

interface PlaylistTimelineProps {
  screensavers: Screensaver[];
  masterEnabled: boolean;
  masterDuration: number;
}

/**
 * ไทม์ไลน์รอบการเล่น
 * ---------------------------------------------------------------------------
 * แถบเดียวแทนหนึ่งรอบเต็ม ความกว้างของแต่ละช่วง = สัดส่วนเวลาที่สื่อชิ้นนั้นครองจอ
 * ตอบคำถามที่ตารางตอบไม่ได้: "ลูกค้าที่ยืนรออยู่หน้าตู้ จะเห็นอะไรนานแค่ไหน
 * และต้องรอกี่วินาทีกว่าจะวนกลับมาที่ชิ้นเดิม"
 */
export function PlaylistTimeline({
  screensavers,
  masterEnabled,
  masterDuration,
}: PlaylistTimelineProps) {
  const activeSlides = screensavers
    .filter((item) => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const segments = [
    ...(masterEnabled
      ? [{ id: "master", title: "หน้าจอหลัก", duration: masterDuration, master: true }]
      : []),
    ...activeSlides.map((slide) => ({
      id: String(slide.id),
      title: slide.title,
      duration: slide.duration,
      master: false,
    })),
  ];

  const cycleSeconds = segments.reduce((total, segment) => total + segment.duration, 0);

  if (segments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
        <MonitorPlay className="mx-auto h-5 w-5 text-slate-400" />
        <p className="mt-2 text-xs font-medium text-bo-text">ยังไม่มีสื่อที่เปิดแสดงผล</p>
        <p className="mt-0.5 text-[11px] text-bo-muted">
          ตู้จะแสดงหน้าจอสำรองจนกว่าจะเปิดใช้งานสื่ออย่างน้อยหนึ่งชิ้น
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-bo-text">รอบการเล่นบนตู้</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-bo-muted">
          <Clock className="h-3.5 w-3.5" />
          <span className="bo-nums font-semibold text-bo-text">{cycleSeconds}</span> วินาทีต่อรอบ
        </span>
      </div>

      <div className="flex h-9 w-full gap-1 overflow-hidden rounded-lg">
        {segments.map((segment) => (
          <div
            key={segment.id}
            title={`${segment.title} · ${segment.duration} วินาที`}
            style={{ width: `${(segment.duration / cycleSeconds) * 100}%` }}
            className={cn(
              "flex min-w-8 items-center justify-center overflow-hidden rounded-md px-1.5 text-[10px] font-semibold whitespace-nowrap",
              segment.master
                ? "bg-bo-ink text-white"
                : "bg-bo-accent-soft text-bo-accent ring-1 ring-inset ring-blue-200",
            )}
          >
            <span className="truncate">{segment.duration}s</span>
          </div>
        ))}
      </div>

      <ol className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment, index) => (
          <li key={segment.id} className="flex items-center gap-1.5 text-[11px]">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-sm",
                segment.master ? "bg-bo-ink" : "bg-bo-accent",
              )}
            />
            <span className="bo-nums text-slate-400">{index + 1}</span>
            <span className="max-w-40 truncate text-bo-muted">{segment.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
