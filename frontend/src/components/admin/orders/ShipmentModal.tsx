import { useState, type FormEvent } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { Order } from "../../../types/admin";
import { Badge, Button, Field, Modal, Select, TextInput } from "../ui";
import { COURIERS, findCourier } from "./couriers";

export type FulfillmentPortion = "instock" | "preorder" | "combined";

const PORTION_LABEL: Record<FulfillmentPortion, string> = {
  instock: "เฉพาะสินค้าพร้อมส่ง",
  preorder: "เฉพาะสินค้าพรีออเดอร์",
  combined: "รวมทั้งคำสั่งซื้อ",
};

interface ShipmentModalProps {
  order: Order | null;
  portion: FulfillmentPortion;
  onClose: () => void;
  onSubmit: (courier: string, trackingNumber: string) => Promise<void>;
  submitting: boolean;
  initialTracking: string;
}

/**
 * บันทึกการจัดส่ง
 * ---------------------------------------------------------------------------
 * เรียงตามลำดับที่พนักงานทำจริง: คัดลอกที่อยู่ → เปิดหน้าเว็บขนส่ง → เอาเลขพัสดุมากรอก
 * ปุ่มคัดลอกของ Kerry แยกต่างหาก เพราะฟอร์มกรอกอัตโนมัติของเจ้านี้รับคนละรูปแบบ
 */
export function ShipmentModal({
  order,
  portion,
  onClose,
  onSubmit,
  submitting,
  initialTracking,
}: ShipmentModalProps) {
  const [courier, setCourier] = useState("thailandpost");
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [copied, setCopied] = useState<"" | "address" | "kerry">("");

  if (!order) return null;

  const selectedCourier = findCourier(courier);

  const copy = (text: string, key: "address" | "kerry") => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(courier, trackingNumber.trim());
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="บันทึกการจัดส่ง"
      description={`${PORTION_LABEL[portion]} · ${order.id}`}
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            variant="primary"
            type="submit"
            form="shipment-form"
            disabled={submitting || !trackingNumber.trim()}
          >
            {submitting ? "กำลังบันทึก" : "บันทึกและแจ้งลูกค้า"}
          </Button>
        </>
      }
    >
      <form id="shipment-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* ที่อยู่ผู้รับ */}
        <section className="rounded-xl border border-bo-line bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold text-bo-text">ที่อยู่ผู้รับ</h3>

            {courier === "kerry" ? (
              <Button
                size="sm"
                icon={copied === "kerry" ? Check : Copy}
                onClick={() =>
                  copy(
                    `${order.customerName ?? ""} ${order.customerPhone ?? ""}\n${order.customerAddress ?? ""}`,
                    "kerry",
                  )
                }
              >
                {copied === "kerry" ? "คัดลอกแล้ว" : "คัดลอกแบบ Kerry"}
              </Button>
            ) : (
              <Button
                size="sm"
                icon={copied === "address" ? Check : Copy}
                onClick={() =>
                  copy(
                    `ชื่อผู้รับ: ${order.customerName ?? "-"}\nเบอร์โทร: ${order.customerPhone ?? "-"}\nที่อยู่จัดส่ง: ${order.customerAddress ?? "-"}`,
                    "address",
                  )
                }
              >
                {copied === "address" ? "คัดลอกแล้ว" : "คัดลอกที่อยู่"}
              </Button>
            )}
          </div>

          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-bo-muted">ชื่อผู้รับ</dt>
              <dd className="font-medium">{order.customerName || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-bo-muted">เบอร์โทร</dt>
              <dd className="font-bo-mono text-[13px]">{order.customerPhone || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-bo-muted">ที่อยู่</dt>
              <dd className="leading-relaxed">{order.customerAddress || "—"}</dd>
            </div>
          </dl>
        </section>

        <Field label="ผู้ให้บริการขนส่ง">
          {(id) => (
            <div className="flex flex-col gap-2">
              <Select
                id={id}
                value={courier}
                onChange={setCourier}
                options={COURIERS.map((item) => ({ value: item.id, label: item.name }))}
              />
              <a
                href={selectedCourier.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-bo-line bg-bo-accent-soft px-4 py-2.5 text-xs font-semibold text-bo-accent transition-colors hover:bg-blue-100"
              >
                เปิดหน้ากรอกข้อมูลของ {selectedCourier.name}
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          )}
        </Field>

        <Field
          label="เลขพัสดุ"
          required
          hint="ระบบจะส่งอีเมลแจ้งเลขพัสดุนี้ให้ลูกค้าทันทีหลังบันทึก"
        >
          {(id) => (
            <TextInput
              id={id}
              required
              mono
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="TH0123456789"
            />
          )}
        </Field>

        {order.shipments.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-bo-text">พัสดุที่ส่งไปแล้ว</h3>
            <ul className="flex flex-col gap-1.5">
              {order.shipments.map((shipment) => (
                <li
                  key={shipment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-bo-line bg-white px-3 py-2 text-xs"
                >
                  <Badge tone="neutral" size="sm">
                    {shipment.shipment_type === "instock"
                      ? "พร้อมส่ง"
                      : shipment.shipment_type === "preorder"
                        ? "พรีออเดอร์"
                        : "ส่งรวม"}
                  </Badge>
                  <span className="text-bo-muted">{shipment.courier_name || "—"}</span>
                  <span className="font-bo-mono font-semibold">
                    {shipment.tracking_number || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </form>
    </Modal>
  );
}
