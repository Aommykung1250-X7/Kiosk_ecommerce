import { Clock, MonitorPlay, RotateCcw } from "lucide-react";
import type { Screensaver } from "../../../types/admin";
import { cn, resolveUploadUrl } from "../ui";

interface PlaylistTimelineProps {
  screensavers: Screensaver[];
  masterEnabled: boolean;
  masterDuration: number;
  /** ชื่อไฟล์รูปหลักของหน้าจอหลัก ใช้เป็นรูปตัวอย่างของลำดับที่ 1 */
  mainImage?: string;
}

/**
 * ลำดับการเล่นบนตู้
 * ---------------------------------------------------------------------------
 * อ่านจากบนลงล่างตามลำดับที่ลูกค้าจะเห็นจริง แต่ละแถวมีรูปตัวอย่างกำกับ
 * เพื่อตอบคำถามที่ตารางด้านล่างตอบไม่ได้: "ยืนอยู่หน้าตู้แล้วจะเห็นอะไร
 * เรียงกันแบบไหน ชิ้นละกี่วินาที และต้องรอนานแค่ไหนกว่าจะวนกลับมาชิ้นเดิม"
 */
export function PlaylistTimeline({
  screensavers,
  masterEnabled,
  masterDuration,
  mainImage,
}: PlaylistTimelineProps) {
  const activeSlides = screensavers
    .filter((item) => item.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const segments = [
    ...(masterEnabled
      ? [
          {
            id: "master",
            title: "หน้าจอหลัก",
            caption: "นาฬิกา + สินค้าแนะนำ",
            duration: masterDuration,
            mediaUrl: (mainImage || null) as string | null,
            master: true,
          },
        ]
      : []),
    ...activeSlides.map((slide) => ({
      id: String(slide.id),
      title: slide.title,
      caption: "สื่อโฆษณา",
      duration: slide.duration,
      mediaUrl: slide.mediaUrl,
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
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 pb-3">
        <span className="text-xs font-medium text-bo-text">รอบการเล่นบนตู้</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-bo-muted">
          <Clock className="h-3.5 w-3.5" />
          <span className="bo-nums font-semibold text-bo-text">{cycleSeconds}</span> วินาทีต่อรอบ
        </span>
      </div>

      <ol className="flex flex-col border-t border-bo-line pt-4">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const share = Math.round((segment.duration / cycleSeconds) * 100);
          const cover = segment.mediaUrl
            ? resolveUploadUrl(segment.mediaUrl, "screensavers")
            : null;

          return (
            <li key={segment.id} className="flex gap-3">
              {/* รางซ้าย: เลขลำดับ + เส้นเชื่อมที่ยืดเองตามความสูงแถว */}
              <div className="flex w-6 shrink-0 flex-col items-center">
                <span
                  className={cn(
                    "bo-nums flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                    segment.master
                      ? "bg-bo-ink text-white"
                      : "bg-bo-accent-soft text-bo-accent ring-1 ring-inset ring-blue-200",
                  )}
                >
                  {index + 1}
                </span>
                {!isLast && <span className="mt-1 w-px flex-1 bg-bo-line" />}
              </div>

              <div className={cn("flex flex-1 items-center gap-3", !isLast && "pb-4")}>
                <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-bo-line bg-slate-100">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : segment.master ? (
                    <div className="flex h-full w-full items-center justify-center bg-bo-ink">
                      <MonitorPlay className="h-4 w-4 text-white/70" />
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-bo-text">{segment.title}</p>
                  <p className="mt-0.5 text-[11px] text-bo-muted">{segment.caption}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="bo-nums text-sm font-semibold text-bo-text">
                    {segment.duration}s
                  </p>
                  <p className="bo-nums mt-0.5 text-[11px] text-bo-muted">{share}%</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 text-[11px] text-bo-muted">
        <span className="flex w-6 shrink-0 justify-center">
          <RotateCcw className="h-3.5 w-3.5" />
        </span>
        <span>วนกลับไปลำดับ 1</span>
      </div>
    </div>
  );
}
