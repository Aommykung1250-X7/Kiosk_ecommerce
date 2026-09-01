import { CalendarCheck, Check, MapPin, Package, Phone, Store, Truck, User } from "lucide-react";
import type { Order, OrderItem } from "../../../types/admin";
import {
  Badge,
  Button,
  Drawer,
  formatBaht,
  formatDateTime,
  formatThaiDate,
  formatTime,
  shortOrderRef,
} from "../ui";
import { getOrderStage, getPaymentBadge } from "./orderStage";
import type { FulfillmentPortion } from "./ShipmentModal";

interface OrderDetailDrawerProps {
  order: Order | null;
  onClose: () => void;
  readOnly: boolean;
  onFulfillItem: (order: Order, item: OrderItem) => void;
  onFulfillAllPickup: (order: Order) => void;
  onOpenShipment: (order: Order, portion: FulfillmentPortion) => void;
}

/**
 * แผงรายละเอียดคำสั่งซื้อ
 * ---------------------------------------------------------------------------
 * เปิดจากแถวในตารางโดยที่ตารางยังอยู่ด้านหลัง พนักงานจึงไม่หลุดจากคิวที่กำลังไล่อยู่
 * รายการสินค้าเรียงตามที่ต้องหยิบจริง และปุ่มยืนยันอยู่ติดกับสินค้าแต่ละชิ้น
 */
export function OrderDetailDrawer({
  order,
  onClose,
  readOnly,
  onFulfillItem,
  onFulfillAllPickup,
  onOpenShipment,
}: OrderDetailDrawerProps) {
  if (!order) return null;

  const stage = getOrderStage(order);
  const payment = getPaymentBadge(order.status);
  const isPickup = order.deliveryOption === "pickup";
  const isSplit = order.shippingOption === "split";
  const allItemsDone = (order.items ?? []).every(
    (item) => item.fulfillmentStatus === "fulfilled",
  );
  const finished = readOnly || stage.key === "fulfilled";

  // คำเรียกเวลาที่ของถึงมือลูกค้า ต่างกันตามช่องทางรับของ
  const handoverLabel = isPickup ? "รับของ" : "จัดส่ง";
  const handoverHeading = isPickup ? "ลูกค้ารับของเรียบร้อยแล้ว" : "จัดส่งเรียบร้อยแล้ว";
  // เวลาที่ของถึงมือลูกค้าจริงในแต่ละรอบ — ออเดอร์ที่มารับสองรอบจะมีมากกว่าหนึ่งเวลา
  // orders.fulfilledAt เก็บได้แค่รอบสุดท้าย จึงต้องดูเวลารายชิ้นประกอบ
  const handoverTimes = [
    ...new Set(
      (order.items ?? [])
        .map((item) => item.fulfilledAt)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const hasSeparateRounds = handoverTimes.length > 1;

  return (
    <Drawer
      open
      onClose={onClose}
      width="lg"
      eyebrow={`คำสั่งซื้อ ${shortOrderRef(order.id)}`}
      title={order.customerName || "ลูกค้าไม่ระบุชื่อ"}
      footer={
        finished ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" />
            ดำเนินการครบทุกรายการแล้ว
          </div>
        ) : isPickup ? (
          <Button
            variant="primary"
            fullWidth
            icon={Check}
            disabled={allItemsDone}
            onClick={() => onFulfillAllPickup(order)}
          >
            {allItemsDone ? "จ่ายของครบแล้ว" : "ยืนยันจ่ายสินค้าที่เหลือทั้งหมด"}
          </Button>
        ) : !order.customerAddress ? (
          <p className="text-center text-xs font-medium text-rose-600">
            ลูกค้ายังไม่กรอกที่อยู่จัดส่ง จึงยังบันทึกการส่งไม่ได้
          </p>
        ) : isSplit ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant={order.fulfillmentStatusInstock === "fulfilled" ? "secondary" : "primary"}
              icon={Truck}
              disabled={order.fulfillmentStatusInstock === "fulfilled"}
              onClick={() => onOpenShipment(order, "instock")}
            >
              {order.fulfillmentStatusInstock === "fulfilled"
                ? "ส่งรอบพร้อมส่งแล้ว"
                : "บันทึกส่งรอบพร้อมส่ง"}
            </Button>
            <Button
              variant={order.fulfillmentStatusPreorder === "fulfilled" ? "secondary" : "primary"}
              icon={Package}
              disabled={order.fulfillmentStatusPreorder === "fulfilled"}
              onClick={() => onOpenShipment(order, "preorder")}
            >
              {order.fulfillmentStatusPreorder === "fulfilled"
                ? "ส่งรอบพรีออเดอร์แล้ว"
                : "บันทึกส่งรอบพรีออเดอร์"}
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            fullWidth
            icon={Truck}
            onClick={() => onOpenShipment(order, "combined")}
          >
            บันทึกการจัดส่ง
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {/* สรุปหัวคำสั่งซื้อ */}
        <section className="flex flex-wrap items-center gap-2">
          <Badge tone={stage.tone} dot pulse={stage.key !== "fulfilled"}>
            {stage.label}
          </Badge>
          <Badge tone={payment.tone}>{payment.label}</Badge>
          <Badge tone={isPickup ? "success" : "info"}>
            {isPickup ? "รับที่ร้าน" : isSplit ? "จัดส่ง · แยกสองรอบ" : "จัดส่ง · ส่งรอบเดียว"}
          </Badge>
        </section>

        <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-bo-line bg-slate-50/70 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-bo-muted">รหัสคำสั่งซื้อ</dt>
            <dd className="font-bo-mono mt-0.5 text-[13px] break-all">{order.id}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-bo-muted">เวลาสั่งซื้อ</dt>
            <dd className="mt-0.5">{formatDateTime(order.createdAt)}</dd>
          </div>
          {stage.key === "fulfilled" && (
            <div>
              <dt className="text-[11px] text-bo-muted">เวลา{handoverLabel}</dt>
              <dd className="mt-0.5 font-medium text-emerald-700">
                {order.fulfilledAt ? formatDateTime(order.fulfilledAt) : "ไม่มีข้อมูลเวลา"}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] text-bo-muted">อ้างอิงการชำระเงิน</dt>
            <dd className="font-bo-mono mt-0.5 text-[13px] break-all">
              {order.paymentGatewayRef || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-bo-muted">ยอดรวม</dt>
            <dd className="bo-nums mt-0.5 text-base font-semibold">
              {formatBaht(order.totalPrice)}
            </dd>
          </div>
        </dl>

        {/* รายการสินค้า */}
        <section className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold text-bo-text">
            รายการสินค้า ({(order.items ?? []).length} รายการ)
          </h3>

          <ul className="flex flex-col gap-2">
            {(order.items ?? []).map((item) => {
              const isPreOrder = item.product?.status === "Pre-Order";
              const releaseDate =
                item.product?.preorderReleaseDate ?? item.product?.preorder_release_date;
              const itemDone =
                item.fulfillmentStatus === "fulfilled" ||
                order.fulfillmentStatus === "fulfilled";

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-bo-line bg-white p-3"
                >
                  <span className="bo-nums mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 px-1.5 text-xs font-semibold text-bo-text">
                    ×{item.quantity}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-bo-text">
                      {item.product?.name || "สินค้า"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {isPreOrder ? (
                        <Badge tone="preorder" size="sm">
                          พรีออเดอร์
                          {releaseDate ? ` · รอของ ${formatThaiDate(releaseDate)}` : ""}
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          พร้อมส่ง
                        </Badge>
                      )}
                      <span className="bo-nums text-[11px] text-bo-muted">
                        {formatBaht(item.price)} / ชิ้น
                      </span>
                    </div>
                    {item.fulfilledAt && (
                      <p className="mt-1 text-[11px] text-emerald-700">
                        {handoverLabel}แล้ว {formatDateTime(item.fulfilledAt)}
                      </p>
                    )}
                  </div>

                  {isPickup && !finished && (
                    <div className="shrink-0">
                      {itemDone ? (
                        <Badge tone="success" size="sm">
                          <Check className="h-3 w-3" />
                          จ่ายแล้ว
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => onFulfillItem(order, item)}>
                          ยืนยันจ่าย
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* ข้อมูลผู้รับ */}
        <section className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold text-bo-text">ข้อมูลผู้รับ</h3>

          <dl className="flex flex-col gap-2.5 rounded-xl border border-bo-line bg-white p-4 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <dt className="sr-only">ชื่อผู้สั่งซื้อ</dt>
                <dd>{order.customerName || "ยังไม่ระบุ"}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <dt className="sr-only">เบอร์โทร</dt>
                <dd className="font-bo-mono text-[13px]">
                  {order.customerPhone || "ยังไม่ระบุ"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              {isPickup ? (
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              )}
              <div>
                <dt className="sr-only">ที่อยู่</dt>
                <dd className={order.customerAddress ? "leading-relaxed" : "text-rose-600"}>
                  {isPickup
                    ? "ลูกค้ามารับเองที่ร้าน"
                    : order.customerAddress || "รอลูกค้ากรอกที่อยู่ผ่านมือถือ"}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        {/* พัสดุ */}
        {order.shipments.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold text-bo-text">เลขพัสดุ</h3>
            <ul className="flex flex-col gap-1.5">
              {order.shipments.map((shipment) => (
                <li
                  key={shipment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-bo-line bg-white px-3 py-2.5 text-sm"
                >
                  <Badge tone="neutral" size="sm">
                    {shipment.shipment_type === "instock"
                      ? "รอบพร้อมส่ง"
                      : shipment.shipment_type === "preorder"
                        ? "รอบพรีออเดอร์"
                        : "ส่งรอบเดียว"}
                  </Badge>
                  <span className="text-xs text-bo-muted">{shipment.courier_name || "—"}</span>
                  <span className="font-bo-mono text-[13px] font-semibold">
                    {shipment.tracking_number || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {stage.key === "fulfilled" && (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex items-start gap-3">
              <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold">{handoverHeading}</p>
                {order.fulfilledAt ? (
                  <p className="mt-1 text-base leading-snug font-semibold">
                    {formatThaiDate(order.fulfilledAt)}
                    <span className="ml-2 font-normal">เวลา {formatTime(order.fulfilledAt)}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm">ไม่มีข้อมูลเวลา{handoverLabel}</p>
                )}

                {hasSeparateRounds && (
                  <ul className="mt-2 flex flex-col gap-0.5 border-t border-emerald-200 pt-2 text-xs">
                    {handoverTimes.map((time, index) => (
                      <li key={time}>
                        รอบที่ {index + 1}: {formatDateTime(time)}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-2 text-xs">
                  ผู้ดำเนินการล่าสุด: {order.handlerName || "ไม่ระบุพนักงาน"}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}
