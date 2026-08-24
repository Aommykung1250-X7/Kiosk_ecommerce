import { useState, type FormEvent } from "react";
import { Plus, Settings2, Star, X } from "lucide-react";
import type { Category, ProductFormState, ProductStatus } from "../../../types/admin";
import {
  Button,
  Checkbox,
  Field,
  Modal,
  NumberInput,
  RadioGroup,
  Select,
  TextArea,
  TextInput,
  UnderlineTabs,
  resolveUploadUrl,
  type TabItem,
} from "../ui";
import { ProductPreviewCard } from "./ProductPreviewCard";

type FormTab = "general" | "details" | "pricing" | "shipping";

const FORM_TABS: TabItem<FormTab>[] = [
  { key: "general", label: "ข้อมูลทั่วไป" },
  { key: "details", label: "รายละเอียดสินค้า" },
  { key: "pricing", label: "สต็อกและราคา" },
  { key: "shipping", label: "การจัดส่ง" },
];

export const MAX_PRODUCT_IMAGES = 5;

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  form: ProductFormState;
  setForm: (updater: (previous: ProductFormState) => ProductFormState) => void;
  categories: Category[];
  editing: boolean;
  uploading: boolean;
  onUploadImages: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  onManageCategories: () => void;
}

/**
 * ฟอร์มเพิ่ม/แก้ไขสินค้า
 * ---------------------------------------------------------------------------
 * แบ่งเป็นสี่แท็บตามลำดับที่คนกรอกจริง และวางตัวอย่างหน้าร้านไว้ข้างๆ ตลอดเวลา
 * ทุกแท็บอยู่ในฟอร์มเดียวกัน กดบันทึกจากแท็บไหนก็ส่งข้อมูลครบทั้งชุด
 */
export function ProductFormModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  categories,
  editing,
  uploading,
  onUploadImages,
  onRemoveImage,
  onManageCategories,
}: ProductFormModalProps) {
  const [tab, setTab] = useState<FormTab>("general");
  const images = form.images ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
      description="ข้อมูลที่บันทึกจะขึ้นบนตู้ทันทีหลังกดบันทึก"
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button variant="primary" type="submit" form="product-form">
            {editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
          </Button>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
        <form id="product-form" onSubmit={onSubmit} className="flex min-w-0 flex-col gap-5">
          <UnderlineTabs items={FORM_TABS} value={tab} onChange={setTab} />

          {/* ---------------------------------------------------- ข้อมูลทั่วไป */}
          {tab === "general" && (
            <div className="flex flex-col gap-5">
              <Field label="ชื่อสินค้า" required>
                {(id) => (
                  <TextInput
                    id={id}
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, name: event.target.value }))
                    }
                    placeholder="เช่น น้ำดื่มตราช้าง 600 มล."
                  />
                )}
              </Field>

              <Field
                label="หมวดหมู่"
                hint="ใช้จัดกลุ่มสินค้าบนหน้าตู้ และเป็นตัวกรองในตารางคลังสินค้า"
              >
                {(id) => (
                  <div className="flex gap-2">
                    <Select
                      id={id}
                      className="flex-1"
                      value={form.category}
                      placeholder="เลือกหมวดหมู่"
                      options={categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      }))}
                      onChange={(value) =>
                        setForm((previous) => ({ ...previous, category: value }))
                      }
                    />
                    <Button icon={Settings2} onClick={onManageCategories}>
                      จัดการหมวดหมู่
                    </Button>
                  </div>
                )}
              </Field>

              <Field
                label="จุดรับสินค้า"
                optionalNote="ไม่บังคับ"
                hint="ข้อความนี้จะแสดงให้ลูกค้าเห็นเมื่อเลือกรับของที่ร้าน"
              >
                {(id) => (
                  <TextInput
                    id={id}
                    value={form.pickupLocation}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        pickupLocation: event.target.value,
                      }))
                    }
                    placeholder="เช่น ตู้จำหน่ายสินค้า A ชั้น 1"
                  />
                )}
              </Field>

              <div className="rounded-xl border border-bo-line bg-slate-50/70 px-4 py-3.5">
                <Checkbox
                  checked={form.promotion}
                  onChange={(next) =>
                    setForm((previous) => ({ ...previous, promotion: next }))
                  }
                  label="แสดงในหมวดโปรโมชั่น"
                  description="สินค้าจะขึ้นในแถบโปรโมชั่นหน้าแรกของตู้"
                />
              </div>
            </div>
          )}

          {/* ----------------------------------------------- รายละเอียดสินค้า */}
          {tab === "details" && (
            <div className="flex flex-col gap-5">
              <Field label="รายละเอียดสินค้า" hint="ข้อความสั้นๆ ที่ลูกค้าเห็นในหน้าสินค้า">
                {(id) => (
                  <TextArea
                    id={id}
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    placeholder="เช่น น้ำดื่มบรรจุขวด สะอาด ผ่านการกรอง 5 ขั้นตอน"
                  />
                )}
              </Field>

              <Field
                label="ข้อมูลเพิ่มเติม"
                optionalNote="ไม่บังคับ"
                hint="ข้อควรระวัง เงื่อนไขการจัดส่ง หรือคุณสมบัติที่ต้องบอกลูกค้าก่อนซื้อ"
              >
                {(id) => (
                  <TextArea
                    id={id}
                    rows={3}
                    value={form.additional_info}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        additional_info: event.target.value,
                        additionalInfo: event.target.value,
                      }))
                    }
                    placeholder="เช่น เก็บในที่แห้ง หลีกเลี่ยงแสงแดดโดยตรง"
                  />
                )}
              </Field>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-bo-text">
                    รูปภาพสินค้า<span className="ml-0.5 text-rose-500">*</span>
                  </span>
                  <span className="bo-nums text-[11px] text-bo-muted">
                    {images.length} / {MAX_PRODUCT_IMAGES} รูป
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {images.map((filename, index) => (
                    <div
                      key={`${filename}-${index}`}
                      className="group relative h-20 w-20 overflow-hidden rounded-xl border border-bo-line bg-slate-50"
                    >
                      <img
                        src={resolveUploadUrl(filename, "products") ?? ""}
                        alt={`รูปสินค้าที่ ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-bo-ink/80 py-0.5 text-[9px] font-semibold text-white">
                          <Star className="h-2.5 w-2.5" />
                          รูปหลัก
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        aria-label={`ลบรูปที่ ${index + 1}`}
                        title="ลบรูปนี้"
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:bg-rose-500 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {images.length < MAX_PRODUCT_IMAGES && (
                    <label
                      className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors ${
                        uploading
                          ? "border-bo-accent bg-bo-accent-soft"
                          : "border-slate-300 bg-slate-50 hover:border-bo-accent hover:bg-bo-accent-soft/50"
                      }`}
                    >
                      <Plus className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px] font-medium text-bo-muted">
                        {uploading ? "กำลังอัปโหลด" : "เพิ่มรูป"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          if (files.length > 0) onUploadImages(files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>

                <p className="text-[11px] text-bo-muted">
                  รูปแรกคือรูปที่ลูกค้าเห็นในรายการสินค้า ลบรูปแรกแล้วรูปถัดไปจะขึ้นมาแทน
                </p>
              </div>
            </div>
          )}

          {/* ------------------------------------------------- สต็อกและราคา */}
          {tab === "pricing" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="ราคาขาย" required>
                {(id) => (
                  <NumberInput
                    id={id}
                    required
                    min={0}
                    step="0.01"
                    prefix="฿"
                    value={form.price}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, price: event.target.value }))
                    }
                  />
                )}
              </Field>

              <Field label="จำนวนคงเหลือ" required hint="ระบบเตือน “ใกล้หมด” เมื่อเหลือ 5 ชิ้นหรือน้อยกว่า">
                {(id) => (
                  <NumberInput
                    id={id}
                    required
                    min={0}
                    suffix="ชิ้น"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, stock: event.target.value }))
                    }
                  />
                )}
              </Field>

              <Field
                label="จำกัดการสั่งซื้อต่อรายการ"
                optionalNote="ไม่บังคับ"
                className="sm:col-span-2"
                hint="เว้นว่างไว้หากไม่จำกัดจำนวนต่อการสั่งซื้อหนึ่งครั้ง"
              >
                {(id) => (
                  <NumberInput
                    id={id}
                    min={1}
                    suffix="ชิ้น"
                    placeholder="ไม่จำกัด"
                    value={form.purchaseLimit}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        purchaseLimit: event.target.value
                          ? parseInt(event.target.value, 10)
                          : "",
                      }))
                    }
                  />
                )}
              </Field>
            </div>
          )}

          {/* ---------------------------------------------------- การจัดส่ง */}
          {tab === "shipping" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2.5">
                <p id="product-status-label" className="text-xs font-medium text-bo-text">
                  ประเภทสินค้า
                </p>
                <RadioGroup<ProductStatus>
                  name="product-status"
                  labelledBy="product-status-label"
                  value={form.status}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, status: value }))
                  }
                  options={[
                    { value: "In Stock", label: "In-stock" },
                    { value: "Pre-Order", label: "Pre-order" },
                  ]}
                />
              </div>

              {form.status === "Pre-Order" && (
                <>
                  <Field
                    label="วันที่สินค้าพร้อมจัดส่ง"
                    required
                    hint="ลูกค้าจะเห็นวันที่นี้บนหน้าสินค้า"
                  >
                    {(id) => (
                      <TextInput
                        id={id}
                        type="date"
                        required
                        value={form.preorderReleaseDate.substring(0, 10)}
                        onChange={(event) =>
                          setForm((previous) => ({
                            ...previous,
                            preorderReleaseDate: event.target.value,
                          }))
                        }
                      />
                    )}
                  </Field>

                  <p className="rounded-xl border border-bo-line bg-bo-preorder-soft/60 px-4 py-3 text-[11px] leading-relaxed text-bo-text">
                    เมื่อถึงวันที่พร้อมจัดส่ง ระบบจะเปลี่ยนสินค้าเป็น In-stock ให้อัตโนมัติ
                  </p>
                </>
              )}

              {form.status === "In Stock" && (
                <p className="rounded-xl border border-bo-line bg-slate-50 px-4 py-3 text-[11px] leading-relaxed text-bo-muted">
                  สินค้า In-stock ที่คงเหลือเป็น 0 ชิ้น จะแสดงเป็น “หมดสต็อก” บนตู้โดยอัตโนมัติ
                </p>
              )}
            </div>
          )}
        </form>

        <div className="lg:border-l lg:border-bo-line lg:pl-6">
          <ProductPreviewCard form={form} categories={categories} />
        </div>
      </div>
    </Modal>
  );
}
