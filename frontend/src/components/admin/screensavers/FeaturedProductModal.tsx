import { useCallback, useEffect, useState } from "react";
import { Check, ImageOff, Package, X } from "lucide-react";
import type { Product } from "../../../types/admin";
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  Modal,
  SearchInput,
  Select,
  cn,
  formatBahtShort,
  resolveUploadUrl,
} from "../ui";

const SLOT_COUNT = 4;

interface FeaturedProductModalProps {
  open: boolean;
  onClose: () => void;
  initialSelectedIds: number[];
  onSave: (ids: number[]) => void;
}

/**
 * เลือกสินค้าแนะนำสำหรับหน้าจอพักหลัก
 * ---------------------------------------------------------------------------
 * ช่องทั้งสี่คือตำแหน่งจริงบนจอ ไม่ใช่แค่รายการที่เลือกไว้ — ลำดับที่เลือกคือลำดับที่แสดง
 * ช่องที่เว้นไว้ ระบบจะเติมสินค้าขายดีให้เอง จึงบอกไว้ตรงหัวช่องเลย
 */
export function FeaturedProductModal({
  open,
  onClose,
  initialSelectedIds,
  onSave,
}: FeaturedProductModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [slots, setSlots] = useState<(Product | null)[]>(Array(SLOT_COUNT).fill(null));

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลสินค้าได้");
      const data: Product[] = await response.json();
      setProducts(data);

      const nextSlots: (Product | null)[] = Array(SLOT_COUNT).fill(null);
      initialSelectedIds.slice(0, SLOT_COUNT).forEach((id, index) => {
        nextSlots[index] = data.find((item) => Number(item.id) === Number(id)) ?? null;
      });
      setSlots(nextSlots);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [initialSelectedIds]);

  useEffect(() => {
    if (open) void loadProducts();
  }, [open, loadProducts]);

  if (!open) return null;

  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean)),
  ) as string[];

  const filtered = products.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.category ?? "").toLowerCase().includes(query);
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  const isSelected = (id: number) =>
    slots.some((slot) => slot && Number(slot.id) === Number(id));

  const toggleProduct = (product: Product) => {
    if (isSelected(product.id)) {
      setSlots((previous) =>
        previous.map((slot) =>
          slot && Number(slot.id) === Number(product.id) ? null : slot,
        ),
      );
      return;
    }

    const emptyIndex = slots.findIndex((slot) => slot === null);
    if (emptyIndex === -1) return;
    setSlots((previous) => {
      const next = [...previous];
      next[emptyIndex] = product;
      return next;
    });
  };

  const filledCount = slots.filter(Boolean).length;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="สินค้าแนะนำบนหน้าจอพัก"
      description={`เลือกได้สูงสุด ${SLOT_COUNT} รายการ ช่องที่เว้นไว้ระบบจะเติมสินค้าขายดีให้อัตโนมัติ`}
      footer={
        <>
          <span className="mr-auto text-xs text-bo-muted">
            เลือกแล้ว {filledCount} จาก {SLOT_COUNT} ช่อง
          </span>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            variant="primary"
            icon={Check}
            onClick={() => {
              onSave(slots.filter(Boolean).map((product) => Number(product!.id)));
              onClose();
            }}
          >
            บันทึกสินค้าแนะนำ
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* ช่องบนหน้าจอ */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-3",
                slot ? "border-bo-line bg-white" : "border-dashed border-slate-300 bg-slate-50",
              )}
            >
              <span className="text-[11px] font-medium text-bo-muted">
                ช่องที่ {index + 1}
              </span>

              {slot ? (
                <div className="flex items-center gap-2.5">
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-bo-line bg-slate-50">
                    {slot.image ? (
                      <img
                        src={resolveUploadUrl(slot.image, "products") ?? ""}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff className="m-2 h-5 w-5 text-slate-300" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-bo-text">
                      {slot.name}
                    </span>
                    <span className="bo-nums block text-[11px] text-bo-muted">
                      {formatBahtShort(slot.price)}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSlots((previous) =>
                        previous.map((item, position) =>
                          position === index ? null : item,
                        ),
                      )
                    }
                    aria-label={`นำ ${slot.name} ออกจากช่องที่ ${index + 1}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <span className="py-1.5 text-xs text-slate-400">เติมสินค้าขายดีอัตโนมัติ</span>
              )}
            </div>
          ))}
        </div>

        {/* ค้นหา */}
        <div className="flex flex-col gap-3 border-t border-bo-line pt-5 sm:flex-row">
          <SearchInput
            className="flex-1"
            value={search}
            onChange={setSearch}
            placeholder="ค้นหาชื่อสินค้า"
            aria-label="ค้นหาสินค้าแนะนำ"
          />
          <Select
            className="sm:w-44"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "ทุกหมวดหมู่" },
              ...categories.map((item) => ({ value: item, label: item })),
            ]}
          />
        </div>

        {/* รายการสินค้า */}
        {loading ? (
          <LoadingState label="กำลังโหลดรายการสินค้า" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="ไม่พบสินค้าที่ตรงกับการค้นหา"
            description="ลองค้นด้วยคำอื่น หรือเปลี่ยนหมวดหมู่ที่เลือกไว้"
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => {
              const selected = isSelected(product.id);
              const full = filledCount >= SLOT_COUNT && !selected;

              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => toggleProduct(product)}
                    className={cn(
                      "relative flex w-full flex-col gap-2 rounded-xl border p-2.5 text-left transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                      selected
                        ? "border-bo-accent bg-bo-accent-soft"
                        : "border-bo-line bg-white hover:border-slate-300",
                    )}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bo-accent text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}

                    <span className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                      {product.image ? (
                        <img
                          src={resolveUploadUrl(product.image, "products") ?? ""}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageOff className="h-6 w-6 text-slate-300" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-bo-text">
                        {product.name}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="bo-nums text-xs font-semibold text-bo-text">
                          {formatBahtShort(product.price)}
                        </span>
                        {product.status === "Pre-Order" && (
                          <Badge tone="preorder" size="sm">
                            พรีออเดอร์
                          </Badge>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
