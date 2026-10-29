import { useEffect, useState } from "react";
import { resolveUploadUrl } from "./admin/ui/format";
import { isVideoMedia } from "../utils/adMedia";

interface AdvertisementMediaProps {
  mediaUrl: string;
  mediaType?: "image" | "video";
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
}

export function AdvertisementMedia({ mediaUrl, mediaType, alt = "", className = "", autoPlay = false, controls = false }: AdvertisementMediaProps) {
  const src = mediaUrl.startsWith("blob:") ? mediaUrl : resolveUploadUrl(mediaUrl, "screensavers") || "";
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-slate-900 p-2 text-center text-xs text-white/70 ${className}`}>ไม่สามารถแสดงสื่อได้</div>;
  }
  if (isVideoMedia(mediaUrl, mediaType)) {
    return <video key={src} src={src} aria-label={alt} className={className} autoPlay={autoPlay} controls={controls} muted playsInline loop={autoPlay} preload="metadata" onError={() => setFailed(true)} />;
  }
  return <img src={src} alt={alt} loading={autoPlay ? "eager" : "lazy"} className={className} onError={() => setFailed(true)} />;
}
