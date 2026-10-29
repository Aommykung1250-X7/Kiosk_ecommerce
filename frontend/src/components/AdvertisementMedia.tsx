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
  ambient?: boolean;
}

export function AdvertisementMedia({
  mediaUrl,
  mediaType,
  alt = "",
  className = "",
  autoPlay = false,
  controls = false,
  ambient = false,
}: AdvertisementMediaProps) {
  const src = mediaUrl.startsWith("blob:") ? mediaUrl : resolveUploadUrl(mediaUrl, "screensavers") || "";
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-slate-900 p-2 text-center text-xs text-white/70 ${className}`}
      >
        ไม่สามารถแสดงสื่อได้
      </div>
    );
  }

  const isVideo = isVideoMedia(mediaUrl, mediaType);

  if (ambient) {
    return (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#070b14]">
        {/* 1. YouTube-style Atmospheric Ambient Glow (ละอองแสงฟุ้งสีสดใส) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          {isVideo ? (
            <video
              src={src}
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-[75px] saturate-[2.4] brightness-110 scale-150 opacity-80 pointer-events-none select-none"
              autoPlay
              muted
              playsInline
              loop
            />
          ) : (
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover filter blur-[75px] saturate-[2.4] brightness-110 scale-150 opacity-80 pointer-events-none select-none"
            />
          )}

          {/* Soft vignette to blend light smoothly into the frame */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>

        {/* 2. Floating OLED Screen Effect with Ambient Drop Shadow */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-1 sm:p-2 pointer-events-none">
          {isVideo ? (
            <video
              key={src}
              src={src}
              aria-label={alt}
              className={`max-w-full max-h-full w-auto h-auto object-contain rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_24px_rgba(0,0,0,0.4)] ring-1 ring-white/10 pointer-events-auto ${className}`}
              autoPlay={autoPlay}
              controls={controls}
              muted
              playsInline
              loop={autoPlay}
              preload="metadata"
              onError={() => setFailed(true)}
            />
          ) : (
            <img
              src={src}
              alt={alt}
              loading={autoPlay ? "eager" : "lazy"}
              className={`max-w-full max-h-full w-auto h-auto object-contain rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_24px_rgba(0,0,0,0.4)] ring-1 ring-white/10 pointer-events-auto ${className}`}
              onError={() => setFailed(true)}
            />
          )}
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        key={src}
        src={src}
        aria-label={alt}
        className={className}
        autoPlay={autoPlay}
        controls={controls}
        muted
        playsInline
        loop={autoPlay}
        preload="metadata"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={autoPlay ? "eager" : "lazy"}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
