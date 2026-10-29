export const AD_MEDIA_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "video/mp4", "video/webm"];
export const MAX_AD_MEDIA_BYTES = 50 * 1024 * 1024;

export function isVideoMedia(mediaUrl = "", mediaType) {
  return mediaType === "video" || /\.(mp4|webm)(?:[?#]|$)/i.test(mediaUrl);
}
