import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarCheck, ClipboardList, RefreshCw, Store, Truck, X } from "lucide-react";
import type { Order, OrderItem, OrderStageKey } from "../../types/admin";
import { notify, confirmDialog } from "../../components/notify";
import { AdminLayout } from "../../components/admin/AdminLayout";
import {
  Badge,
  Button,
  Card,
  DatePicker,
  EmptyState,
  ErrorBanner,
  FilterChips,
  LoadingState,
  SearchInput,
  SegmentedControl,
  TBody,
  Table,
  TableShell,
  Td,
  Th,
  THead,
  Tr,
  UnderlineTabs,
  addDays,
  formatBaht,
  formatThaiDate,
  formatTime,
  shortOrderRef,
  toLocalDateKey,
  type TabItem,
} from "../../components/admin/ui";
import {
  getOrderStage,
  getPaymentBadge,
  countItems,
} from "../../components/admin/orders/orderStage";
import { OrderDetailDrawer } from "../../components/admin/orders/OrderDetailDrawer";
import {
  ShipmentModal,
  type FulfillmentPortion,
} from "../../components/admin/orders/ShipmentModal";

type ChannelTab = "all" | "pickup" | "delivery" | "history";
type DatePreset = "today" | "yesterday" | "all";

const CHANNEL_LABEL: Record<ChannelTab, string> = {
  all: "ทั้งหมด",
  pickup: "รับที่ร้าน",
  delivery: "จัดส่งพัสดุ",
  history: "เสร็จสิ้นแล้ว",
};

const STAGE_FILTERS: { key: OrderStageKey | "all"; label: string }[] = [
  { key: "all", label: "ทุกสถานะ" },
  { key: "waiting_pickup", label: "รอลูกค้ามารับ" },
  { key: "ready_to_ship", label: "รอการจัดส่ง" },
  { key: "waiting_preorder", label: "รอสินค้าพรีออเดอร์" },
  { key: "partially_shipped", label: "ส่งแล้วบางส่วน" },
  { key: "waiting_address", label: "รอลูกค้าระบุที่อยู่" },
  { key: "fulfilled", label: "เสร็จสิ้น" },
];

const REFRESH_INTERVAL_MS = 5000;

/** เสียงแจ้งเตือนสองโน้ตสั้นๆ เมื่อมีออเดอร์ใหม่เข้าคิว */
function playArrivalChime() {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;

    const context = new AudioCtor();
    const now = context.currentTime;

    [
      { frequency: 587.33, start: 0, stop: 0.4 },
      { frequency: 659.25, start: 0.12, stop: 0.55 },
    ].forEach(({ frequency, start, stop }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + start);
      gain.gain.setValueAtTime(0.08, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stop);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + start);
      oscillator.stop(now + stop);
    });
  } catch (error) {
    console.warn("Browser blocked audio play:", error);
  }
}

interface ArrivalToast {
  id: number;
  order: Order;
}

export default function OrderQueue() {
  const [queueOrders, setQueueOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [channel, setChannel] = useState<ChannelTab>("all");
  const [stageFilter, setStageFilter] = useState<OrderStageKey | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(toLocalDateKey(new Date()));

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [shipmentTarget, setShipmentTarget] = useState<{
    order: Order;
    portion: FulfillmentPortion;
  } | null>(null);
  const [submittingShipment, setSubmittingShipment] = useState(false);

  const [arrivals, setArrivals] = useState<ArrivalToast[]>([]);
  const knownOrderIds = useRef<Set<string>>(new Set());

  /* ------------------------------------------------------------ โหลดข้อมูล */

  const fetchData = useCallback(async () => {
    try {
      const [queueResponse, historyResponse] = await Promise.all([
        fetch("/api/orders/queue", { credentials: "include" }),
        fetch("/api/orders/history", { credentials: "include" }),
      ]);

      if (!queueResponse.ok || !historyResponse.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลคิวสั่งซื้อได้");
      }

      setQueueOrders(await queueResponse.json());
      setHistoryOrders(await historyResponse.json());
      setError("");
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const timer = window.setInterval(() => void fetchData(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [fetchData]);

  // แจ้งเตือนเฉพาะออเดอร์ที่เพิ่งเข้าคิวหลังจากโหลดรอบแรกไปแล้ว
  useEffect(() => {
    if (queueOrders.length === 0) return;

    const currentIds = queueOrders.map((order) => order.id);
    if (knownOrderIds.current.size === 0) {
      knownOrderIds.current = new Set(currentIds);
      return;
    }

    const newArrivals = queueOrders.filter(
      (order) => !knownOrderIds.current.has(order.id),
    );

    if (newArrivals.length > 0) {
      playArrivalChime();
      newArrivals.forEach((order) => {
        knownOrderIds.current.add(order.id);
        const toastId = Date.now() + Math.random();
        setArrivals((previous) => [...previous, { id: toastId, order }]);
        window.setTimeout(
          () => setArrivals((previous) => previous.filter((item) => item.id !== toastId)),
          6000,
        );
      });
    }

    const currentIdSet = new Set(currentIds);
    knownOrderIds.current.forEach((id) => {
      if (!currentIdSet.has(id)) knownOrderIds.current.delete(id);
    });
  }, [queueOrders]);

  /* -------------------------------------------------------------- ตัวกรอง */

  const matchesSearch = useCallback(
    (order: Order) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [order.id, order.customerName, order.customerPhone, order.customerEmail]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query));
    },
    [search],
  );

  const matchesDate = useCallback(
    (order: Order) =>
      !selectedDate || toLocalDateKey(order.createdAt) === selectedDate,
    [selectedDate],
  );

  const isPending = (order: Order) =>
    order.fulfillmentStatusInstock === "pending" ||
    order.fulfillmentStatusPreorder === "pending" ||
    order.fulfillmentStatus === "pending";

  const channelLists = useMemo(() => {
    const all = [...queueOrders, ...historyOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(matchesSearch)
      .filter(matchesDate);

    return {
      all,
      pickup: queueOrders
        .filter((order) => order.deliveryOption === "pickup" && isPending(order))
        .filter(matchesSearch)
        .filter(matchesDate),
      delivery: queueOrders
        .filter((order) => order.deliveryOption === "delivery" && isPending(order))
        .filter(matchesSearch)
        .filter(matchesDate),
      history: historyOrders.filter(matchesSearch).filter(matchesDate),
    };
  }, [queueOrders, historyOrders, matchesSearch, matchesDate]);

  const baseOrders = channelLists[channel];

  const stageCounts = useMemo(() => {
    const counts = new Map<OrderStageKey | "all", number>([["all", baseOrders.length]]);
    baseOrders.forEach((order) => {
      const key = getOrderStage(order).key;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [baseOrders]);

  const visibleOrders = useMemo(
    () =>
      stageFilter === "all"
        ? baseOrders
        : baseOrders.filter((order) => getOrderStage(order).key === stageFilter),
    [baseOrders, stageFilter],
  );

  const selectedOrder = useMemo(
    () =>
      [...queueOrders, ...historyOrders].find((order) => order.id === selectedOrderId) ??
      null,
    [queueOrders, historyOrders, selectedOrderId],
  );

  const channelTabs: TabItem<ChannelTab>[] = (
    ["all", "pickup", "delivery", "history"] as ChannelTab[]
  ).map((key) => ({
    key,
    label: CHANNEL_LABEL[key],
    count: channelLists[key].length,
  }));

  const datePreset: DatePreset | "custom" =
    selectedDate === toLocalDateKey(new Date())
      ? "today"
      : selectedDate === addDays(-1)
        ? "yesterday"
        : selectedDate === ""
          ? "all"
          : "custom";

  /* ----------------------------------------------------------- การจัดจ่าย */

  const handleFulfillItem = async (order: Order, item: OrderItem) => {
    const itemName = item.product?.name || "สินค้า";
    const confirmed = await confirmDialog({
      title: "ยืนยันการจ่ายสินค้า?",
      message: `จ่าย "${itemName}" จำนวน ${item.quantity} ชิ้น ให้ลูกค้าของคำสั่งซื้อ ${shortOrderRef(order.id)}`,
      confirmText: "ยืนยันการจ่าย",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/orders/items/${item.id}/fulfill`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ยืนยันการจ่ายสินค้าไม่สำเร็จ");

      void fetchData();
      notify.success(`จ่าย "${itemName}" แล้ว`);
    } catch (fulfillError) {
      notify.error((fulfillError as Error).message);
    }
  };

  const handleFulfillAllPickup = async (order: Order) => {
    const confirmed = await confirmDialog({
      title: "ยืนยันจ่ายสินค้าที่เหลือ?",
      message: `สินค้าที่ยังไม่ได้จ่ายทั้งหมดของคำสั่งซื้อ ${shortOrderRef(order.id)} จะถูกทำเครื่องหมายว่าจ่ายแล้ว`,
      confirmText: "ยืนยันการจ่าย",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/fulfill`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ยืนยันการจ่ายสินค้าไม่สำเร็จ");

      void fetchData();
      notify.success("จ่ายสินค้าหน้าร้านครบแล้ว");
    } catch (fulfillError) {
      notify.error((fulfillError as Error).message);
    }
  };

  const handleSubmitShipment = async (courier: string, trackingNumber: string) => {
    if (!shipmentTarget) return;

    setSubmittingShipment(true);
    try {
      const response = await fetch(
        `/api/orders/${shipmentTarget.order.id}/fulfill/${shipmentTarget.portion}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ courier, trackingNumber }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกการจัดส่งไม่สำเร็จ");

      void fetchData();
      setShipmentTarget(null);
      notify.success("บันทึกการจัดส่งและส่งอีเมลแจ้งเลขพัสดุให้ลูกค้าแล้ว");
    } catch (shipmentError) {
      notify.error((shipmentError as Error).message);
    } finally {
      setSubmittingShipment(false);
    }
  };

  /* -------------------------------------------------------------- แสดงผล */

  return (
    <AdminLayout
      title="คำสั่งซื้อ"
      description="คิวจ่ายสินค้าหน้าร้านและงานจัดส่งพัสดุ อัปเดตอัตโนมัติทุก 5 วินาที"
      actions={
        <Button icon={RefreshCw} onClick={() => void fetchData()}>
          รีเฟรช
        </Button>
      }
    >
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            className="flex-1"
            value={search}
            onChange={setSearch}
            placeholder="ค้นหารหัสคำสั่งซื้อ ชื่อลูกค้า เบอร์โทร หรืออีเมล"
            aria-label="ค้นหาคำสั่งซื้อ"
          />

          {/* ช่องใส่วันที่อยู่ซ้าย และปุ่มเลือกวันด่วน (วันนี้, เมื่อวาน, ทุกวัน) อยู่ถัดมาขวามือในบรรทัดเดียวกัน */}
          <div className="flex items-center flex-nowrap shrink-0 gap-2.5">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              className="w-[155px] sm:w-[165px]"
            />

            <SegmentedControl<DatePreset | "custom">
              value={datePreset}
              onChange={(key) =>
                setSelectedDate(
                  key === "today"
                    ? toLocalDateKey(new Date())
                    : key === "yesterday"
                      ? addDays(-1)
                      : "",
                )
              }
              items={[
                { key: "today", label: "วันนี้" },
                { key: "yesterday", label: "เมื่อวาน" },
                { key: "all", label: "ทุกวัน" },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bo-line pt-4">
          <FilterChips<OrderStageKey | "all">
            value={stageFilter}
            onChange={setStageFilter}
            items={STAGE_FILTERS.filter(
              (filter) => filter.key === "all" || (stageCounts.get(filter.key) ?? 0) > 0,
            ).map((filter) => ({
              key: filter.key,
              label: filter.label,
              count: stageCounts.get(filter.key) ?? 0,
            }))}
          />

          {(search || stageFilter !== "all") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStageFilter("all");
              }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </Card>

      <UnderlineTabs
        items={channelTabs}
        value={channel}
        onChange={(key) => {
          setChannel(key);
          setStageFilter("all");
        }}
      />

      {error && <ErrorBanner message={error} />}

      <TableShell>
        {loading ? (
          <LoadingState label="กำลังโหลดคิวคำสั่งซื้อ" />
        ) : visibleOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={
              channel === "history"
                ? "ยังไม่มีคำสั่งซื้อที่ดำเนินการเสร็จ"
                : "ไม่มีคำสั่งซื้อค้างในมุมมองนี้"
            }
            description={
              stageFilter !== "all" || search
                ? "ลองล้างตัวกรอง หรือเลือกวันที่อื่นเพื่อดูรายการเพิ่มเติม"
                : "คำสั่งซื้อที่ชำระเงินสำเร็จจะเข้ามาที่นี่โดยอัตโนมัติ"
            }
          />
        ) : (
          <Table>
            <THead>
              <Th>คำสั่งซื้อ</Th>
              <Th>เวลาสั่ง / รับของ</Th>
              <Th>ลูกค้า</Th>
              <Th>ช่องทางรับของ</Th>
              <Th>การชำระเงิน</Th>
              <Th align="center">จำนวน</Th>
              <Th align="right">ยอดรวม</Th>
              <Th>สถานะ</Th>
            </THead>

            <TBody>
              {visibleOrders.map((order) => {
                const stage = getOrderStage(order);
                const payment = getPaymentBadge(order.status);
                const isPickup = order.deliveryOption === "pickup";

                return (
                  <Tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    selected={selectedOrderId === order.id}
                  >
                    <Td>
                      <span className="font-bo-mono block text-[13px] font-semibold">
                        {shortOrderRef(order.id)}
                      </span>
                      <span
                        className="block max-w-[190px] truncate text-[11px] text-slate-400"
                        title={order.id}
                      >
                        {order.id}
                      </span>
                    </Td>

                    <Td className="whitespace-nowrap">
                      <span className="block text-sm text-bo-muted">
                        {formatTime(order.createdAt)}
                      </span>
                      {stage.key === "fulfilled" && (
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <CalendarCheck className="h-3 w-3 shrink-0" />
                          {order.fulfilledAt
                            ? `${formatThaiDate(order.fulfilledAt)} ${formatTime(order.fulfilledAt)}`
                            : "ไม่มีข้อมูลเวลา"}
                        </span>
                      )}
                    </Td>

                    <Td>
                      <span className="block max-w-[160px] truncate text-sm font-medium">
                        {order.customerName || "ไม่ระบุชื่อ"}
                      </span>
                      <span className="font-bo-mono block text-[11px] text-slate-400">
                        {order.customerPhone || "—"}
                      </span>
                    </Td>

                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        {isPickup ? (
                          <Store className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Truck className="h-3.5 w-3.5 text-sky-600" />
                        )}
                        {isPickup
                          ? "รับที่ร้าน"
                          : order.shippingOption === "split"
                            ? "จัดส่ง · แยกรอบ"
                            : "จัดส่ง"}
                      </span>
                    </Td>

                    <Td>
                      <Badge tone={payment.tone} size="sm">
                        {payment.label}
                      </Badge>
                      {order.paymentGatewayRef && (
                        <span
                          className="font-bo-mono mt-1 block max-w-[130px] truncate text-[11px] text-slate-400"
                          title={order.paymentGatewayRef}
                        >
                          {order.paymentGatewayRef}
                        </span>
                      )}
                    </Td>

                    <Td align="center" className="bo-nums text-sm">
                      {countItems(order)}
                    </Td>

                    <Td align="right" className="bo-nums font-semibold whitespace-nowrap">
                      {formatBaht(order.totalPrice)}
                    </Td>

                    <Td>
                      <Badge tone={stage.tone} dot pulse={stage.key !== "fulfilled"}>
                        {stage.label}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </TableShell>

      {!loading && visibleOrders.length > 0 && (
        <p className="text-xs text-bo-muted">
          คลิกที่แถวเพื่อดูรายการสินค้าและยืนยันการจ่ายของ · แสดง {visibleOrders.length} จาก{" "}
          {baseOrders.length} รายการ
        </p>
      )}

      {/* ขณะเปิดหน้าต่างบันทึกการจัดส่ง ให้ซ่อนแผงรายละเอียดไว้ก่อน
          กล่องซ้อนสองชั้นจะแย่งกันขังโฟกัสและปิดพร้อมกันเมื่อกด Escape */}
      <OrderDetailDrawer
        order={shipmentTarget ? null : selectedOrder}
        readOnly={channel === "history"}
        onClose={() => setSelectedOrderId(null)}
        onFulfillItem={(order, item) => void handleFulfillItem(order, item)}
        onFulfillAllPickup={(order) => void handleFulfillAllPickup(order)}
        onOpenShipment={(order, portion) => setShipmentTarget({ order, portion })}
      />

      {shipmentTarget && (
        <ShipmentModal
          order={shipmentTarget.order}
          portion={shipmentTarget.portion}
          submitting={submittingShipment}
          initialTracking={
            shipmentTarget.portion === "preorder"
              ? (shipmentTarget.order.trackingNumber2 ?? "")
              : (shipmentTarget.order.trackingNumber1 ?? "")
          }
          onClose={() => setShipmentTarget(null)}
          onSubmit={handleSubmitShipment}
        />
      )}

      {/* แจ้งเตือนออเดอร์ใหม่ — มุมล่างขวา เพื่อไม่ชนกับระบบแจ้งเตือนกลางที่มุมบนขวา */}
      <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex w-full max-w-sm flex-col gap-2.5">
        {arrivals.map((arrival) => (
          <div
            key={arrival.id}
            className="bo-drawer-enter pointer-events-auto flex items-start gap-3 rounded-xl border border-bo-line bg-white p-4 shadow-lg shadow-slate-900/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bo-accent-soft text-bo-accent">
              <Bell className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-bo-text">มีคำสั่งซื้อใหม่</p>
              <p className="font-bo-mono mt-0.5 text-[11px] text-bo-muted">
                {shortOrderRef(arrival.order.id)}
              </p>
              <p className="bo-nums mt-1 text-sm font-semibold">
                {formatBaht(arrival.order.totalPrice)}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setArrivals((previous) =>
                  previous.filter((item) => item.id !== arrival.id),
                )
              }
              aria-label="ปิดการแจ้งเตือน"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-bo-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
