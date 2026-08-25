import { useEffect, useState } from "react";
import type { DiscountType, Product } from "../../../types/admin";
import { notify } from "../../notify";
import {
  Button,
  Field,
  Modal,
  NumberInput,
  RadioGroup,
  TextInput,
  formatBaht,
} from "../ui";

/** เพดานส่วนลดแบบเปอร์เซ็นต์ ต้องตรงกับ MAX_DISCOUNT_PERCENT ใน backend/src/services/promotionService.js */
const MAX_PERCENT = 90;

const TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
  { value: "percent", label: "ลดเป็นเปอร์เซ็นต์" },
  { value: "amount", label: "ลดเป็นจำนวนเงิน" },
];

export interface PromotionDraft {
  promotionType: DiscountType;
  promotionValue: number;
  promotionStartDate: string;
  promotionEndDate: string;
}

/**
 * คิดราคาหลังลดด้วยสูตรเดียวกับ computePricing ฝั่ง backend
 * เพื่อให้ตัวอย่างในหน้าจอตรงกับราคาที่ลูกค้าจะเห็นจริง
 */
function previewDiscountedPrice(
  fullPrice: number,
  type: DiscountType,
  value: number,
): number {
  const raw = type === "amount" ? fullPrice - value : fullPrice * (1 - value / 100);
  return Math.max(0, Math.round(raw * 100) / 100);
}

/**
 * หน้าต่างตั้งส่วนลดของสินค้าชิ้นเดียว เด้งขึ้นตอนแอดมินเปิดสวิตช์โปรโมชั่นในตาราง
 */
export function ProductPromotionModal({
  product,
  saving,
  onCancel,
  onConfirm,
}: {
  product: Product | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (draft: PromotionDraft) => void;
}) {
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("10");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // เปิดสินค้าชิ้นใหม่ทีไร ให้ดึงค่าที่เคยตั้งไว้ของชิ้นนั้นมาแสดง
  useEffect(() => {
    if (!product) return;
    const nextType = product.promotionType === "amount" ? "amount" : "percent";
    setType(nextType);
    setValue(String(product.promotionValue || (nextType === "amount" ? "" : 10)));
    setStartDate(product.promotionStartDate ?? "");
    setEndDate(product.promotionEndDate ?? "");
  }, [product]);

  if (!product) return null;

  const numericValue = parseFloat(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const fullPrice = product.originalPrice ?? product.price;
  const previewPrice = previewDiscountedPrice(fullPrice, type, safeValue);

  const handleConfirm = () => {
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      notify.warning(
        type === "amount" ? "ส่วนลดต้องมากกว่า 0 บาท" : "เปอร์เซ็นต์ส่วนลดต้องมากกว่า 0",
      );
      return;
    }
    if (type === "percent" && numericValue > MAX_PERCENT) {
      notify.warning(`เปอร์เซ็นต์ส่วนลดต้องไม่เกิน ${MAX_PERCENT}`);
      return;
    }
    if (type === "amount" && numericValue >= fullPrice) {
      notify.warning(`ส่วนลดต้องน้อยกว่าราคาสินค้า (${fullPrice} บาท)`);
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      notify.warning("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");
      return;
    }
    onConfirm({
      promotionType: type,
      promotionValue: numericValue,
      promotionStartDate: startDate,
      promotionEndDate: endDate,
    });
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title="ตั้งส่วนลดสินค้า"
      description={product.name}
      size="md"
      footer={
        <>
          <Button onClick={onCancel} disabled={saving}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={saving}>
            {saving ? "กำลังบันทึก" : "เปิดโปรโมชั่น"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-xl border border-bo-line bg-slate-50 px-4 py-3">
          <span className="text-xs text-bo-muted">ราคาหลังลด</span>
          <span className="flex items-baseline gap-2">
            <span className="bo-nums text-sm text-bo-muted line-through">
              {formatBaht(fullPrice)}
            </span>
            <span className="bo-nums text-lg font-semibold text-bo-text">
              {formatBaht(previewPrice)}
            </span>
          </span>
        </div>

        <Field label="รูปแบบส่วนลด">
          {(id) => (
            <RadioGroup
              name="promotion-type"
              labelledBy={id}
              value={type}
              options={TYPE_OPTIONS}
              onChange={setType}
              className="pt-1"
            />
          )}
        </Field>

        <Field
          label={type === "amount" ? "ลดกี่บาท" : "ลดกี่เปอร์เซ็นต์"}
          hint={
            type === "amount"
              ? `กรอกได้ไม่เกินราคาสินค้า (${formatBaht(fullPrice)})`
              : `กรอกได้ 1 - ${MAX_PERCENT}%`
          }
          required
        >
          {(id) => (
            <NumberInput
              id={id}
              prefix={type === "amount" ? "฿" : undefined}
              suffix={type === "amount" ? undefined : "%"}
              min={1}
              max={type === "amount" ? undefined : MAX_PERCENT}
              step={type === "amount" ? 1 : 1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="วันเริ่ม" optionalNote="ไม่ใส่ = เริ่มทันที">
            {(id) => (
              <TextInput
                id={id}
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            )}
          </Field>
          <Field label="วันสิ้นสุด" optionalNote="ไม่ใส่ = ไม่หมดอายุ">
            {(id) => (
              <TextInput
                id={id}
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            )}
          </Field>
        </div>

        <p className="text-[11px] leading-relaxed text-bo-muted">
          เมื่อพ้นวันสิ้นสุดแล้วราคาจะกลับเป็นปกติเองโดยอัตโนมัติ
        </p>
      </div>
    </Modal>
  );
}
