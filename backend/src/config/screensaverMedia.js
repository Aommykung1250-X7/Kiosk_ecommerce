import path from "node:path";
import fs from "node:fs/promises";

const extensions = {
  "image/jpeg": [".jpg", ".jpeg"], "image/jpg": [".jpg", ".jpeg"],
  "image/png": [".png"], "image/webp": [".webp"],
  "video/mp4": [".mp4"], "video/webm": [".webm"],
};

export function getScreensaverMediaType(filename) {
  if (typeof filename !== "string") return null;
  const ext = path.extname(filename.split(/[?#]/)[0]).toLowerCase();
  if ([".mp4", ".webm"].includes(ext)) return "video";
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return "image";
  return null;
}

export function isAllowedScreensaverUpload(file) {
  return extensions[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase()) || false;
}

export async function hasScreensaverSignature(file) {
  const handle = await fs.open(file.path, "r");
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const header = buffer.subarray(0, bytesRead);
    switch (file.mimetype) {
      case "image/jpeg": case "image/jpg": return header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
      case "image/png": return header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      case "image/webp": return header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";
      case "video/mp4": return bytesRead >= 12 && header.toString("ascii", 4, 8) === "ftyp";
      case "video/webm": return header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
      default: return false;
    }
  } finally { await handle.close(); }
}
