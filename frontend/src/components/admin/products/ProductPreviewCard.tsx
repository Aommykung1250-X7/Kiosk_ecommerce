import { ImageOff } from "lucide-react";
import type { ProductFormState, Category } from "../../../types/admin";
import { formatBaht, formatThaiDate, resolveUploadUrl } from "../ui";

interface ProductPreviewCardProps {
  form: ProductFormState;
  categories: Category[];
}

/**
 * ตัวอย่างการแสดงผลหน้าร้าน
 * ---------------------------------------------------------------------------
 * การ์ดนี้จำลองสิ่งที่ลูกค้าจะเห็นบนตู้ ขณะที่แอดมินยังกรอกฟอร์มอยู่
 * มีไว้เพื่อตอบคำถามเดียว: "กรอกแบบนี้แล้วลูกค้าเห็นอะไร"
 * สีเหลืองปรากฏเฉพาะของที่ยังไม่พร้อมส่ง — พรีออเดอร์และการจำกัดสิทธิ์ซื้อ
 */
export function ProductPreviewCard({ form, categories }: ProductPreviewCardProps) {
  const cover = resolveUploadUrl(form.images?.[0] ?? form.image, "products");
  const isPreOrder = form.status === "Pre-Order";
  const categoryName = categories.find((item) => item.id === form.category)?.name;
  const price = typeof form.price === "string" ? parseFloat(form.price) : form.price;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-bo-muted">ตัวอย่างการแสดงผลหน้าร้าน</p>

      <div className="overflow-hidden rounded-2xl border border-bo-line bg-white shadow-[0_1px_2px_rgba(23,27,46,0.04)]">
        <div className="relative aspect-square bg-slate-50">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
              <ImageOff className="h-7 w-7" />
              <span className="text-[11px] text-slate-400">ยังไม่มีรูปสินค้า</span>
            </div>
          )}

          {isPreOrder && (
            <span className="absolute top-3 right-3 rounded-full bg-bo-preorder px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Pre-order
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-4">
          <h4 className="truncate text-sm font-semibold text-bo-text">
            {form.name.trim() || "ชื่อสินค้า"}
          </h4>

          <p className="text-xs text-bo-muted">
            {isPreOrder
              ? form.preorderReleaseDate
                ? `พร้อมจัดส่ง ${formatThaiDate(form.preorderReleaseDate)}`
                : "ยังไม่ระบุวันที่พร้อมจัดส่ง"
              : (categoryName ?? "ยังไม่เลือกหมวดหมู่")}
          </p>

          <p className="bo-nums mt-1 text-lg font-semibold text-bo-text">
            {formatBaht(Number.isNaN(price) ? 0 : price)}
          </p>

          {form.purchaseLimit !== "" && Number(form.purchaseLimit) > 0 && (
            <span className="mt-1 w-max rounded-full bg-bo-preorder-soft px-2.5 py-1 text-[11px] font-semibold text-amber-800">
              จำกัดการสั่งซื้อ {form.purchaseLimit} ชิ้น / รายการ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
