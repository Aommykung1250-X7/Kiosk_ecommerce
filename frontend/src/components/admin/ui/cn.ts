import clsx, { type ClassValue } from "clsx";

/** รวมคลาส Tailwind แบบมีเงื่อนไข ใช้ร่วมกันทุกคอมโพเนนต์ในชุดหลังบ้าน */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
