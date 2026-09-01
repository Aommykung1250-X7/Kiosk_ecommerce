import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Mail, RefreshCw, Send, Store, Truck } from "lucide-react";
import type { DailyDigest, DailyDigestSettings, DigestOrder } from "../../../types/admin";
import { notify } from "../../notify";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DatePicker,
  EmptyState,
  ErrorBanner,
  Field,
  LoadingState,
  StatCard,
  TextInput,
  Toggle,
  formatBaht,
  formatThaiDate,
  formatTime,
  toLocalDateKey,
} from "../ui";

/**
 * แผงสรุปออเดอร์ค้างรายวัน
 * ---------------------------------------------------------------------------
 * พรีวิวบนหน้าจอกับเนื้ออีเมลมาจาก endpoint เดียวกัน (/daily-digest) แอดมินจึงเห็น
 * สิ่งที่จะถูกส่งออกไปจริงก่อนกดส่ง
 *
 * สรุปนี้เป็น "รายวัน" จึงมีตัวเลือกวันที่ของตัวเอง แยกจากช่วงวันที่ของแท็บอื่นในหน้ารายงาน
 */
export function DailyDigestPanel() {
  const [dateKey, setDateKey] = useState(() => toLocalDateKey(new Date()));
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState<DailyDigestSettings>({
    enabled: false,
    email: "",
    time: "20:00",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/reports/daily-digest?date=${dateKey}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถดึงสรุปออเดอร์ค้างได้");
      }
      setDigest(data.data as DailyDigest);
    } catch (loadError) {
      setError((loadError as Error).message);
      setDigest(null);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/reports/daily-digest/settings", {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.success) setSettings(data.data as DailyDigestSettings);
    } catch (loadError) {
      console.error("Error loading daily digest settings:", loadError);
    }
  }, []);

  useEffect(() => {
    void fetchDigest();
  }, [fetchDigest]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch("/api/admin/reports/daily-digest/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "บันทึกการตั้งค่าไม่สำเร็จ");
      }
      setSettings(data.data as DailyDigestSettings);
      notify.success("บันทึกการตั้งค่ารายงานแล้ว");
    } catch (saveError) {
      notify.error((saveError as Error).message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendNow = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/admin/reports/daily-digest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: dateKey }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "ส่งอีเมลไม่สำเร็จ");
      }
      notify.success(`ส่งสรุปของวันที่ ${formatThaiDate(dateKey)} ไปที่ ${data.data.recipient} แล้ว`);
    } catch (sendError) {
      notify.error((sendError as Error).message);
    } finally {
      setSending(false);
    }
  };

  const channelLabel = (order: DigestOrder) => {
    if (order.deliveryOption !== "delivery") return "รับที่ร้าน";
    return order.shippingOption === "split" ? "จัดส่ง · แยกรอบ" : "จัดส่ง";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ------------------------------------------------------- เลือกวันที่ */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-bo-text">สรุปของวันที่</span>
          <DatePicker
            aria-label="วันที่ของสรุปออเดอร์ค้าง"
            value={dateKey}
            maxDate={toLocalDateKey(new Date())}
            onChange={setDateKey}
            className="w-[160px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={RefreshCw} onClick={() => void fetchDigest()}>
            รีเฟรช
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Send}
            disabled={sending || loading}
            onClick={() => void handleSendNow()}
          >
            {sending ? "กำลังส่ง" : "ส่งอีเมลตอนนี้"}
          </Button>
        </div>
      </Card>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Card flush>
          <LoadingState label="กำลังรวบรวมออเดอร์ค้าง" />
        </Card>
      ) : (
        <>
          {/* --------------------------------------------------- ตัวเลขรวม */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="ออเดอร์ทั้งวัน"
              value={String(digest?.totalOrders ?? 0)}
              icon={ClipboardList}
            />
            <StatCard
              label="เสร็จสิ้นแล้ว"
              value={String(digest?.fulfilledCount ?? 0)}
              icon={Store}
            />
            <StatCard
              emphasis
              label="ยังค้างอยู่"
              value={String(digest?.outstandingCount ?? 0)}
              icon={Truck}
            />
          </div>

          {/* ------------------------------------ รายการค้าง แยกตามสาเหตุ */}
          {digest && digest.groups.length > 0 ? (
            <div className="flex flex-col gap-4">
              {digest.groups.map((group) => (
                <Card key={group.key} className="flex flex-col gap-3">
                  <CardHeader
                    title={group.label}
                    description={`${group.count} ออเดอร์`}
                  />
                  <ul className="flex flex-col gap-2">
                    {group.orders.map((order) => (
                      <li
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bo-line bg-white px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <span className="font-bo-mono block text-[13px] font-semibold">
                            {order.id}
                          </span>
                          <span className="block text-[11px] text-bo-muted">
                            {order.customerName || "ไม่ระบุชื่อ"}
                            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="neutral" size="sm">
                            {channelLabel(order)}
                          </Badge>
                          <span className="bo-nums text-sm font-semibold">
                            {formatBaht(order.totalPrice)}
                          </span>
                          <span className="bo-nums text-[11px] text-bo-muted">
                            สั่ง {formatTime(order.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          ) : (
            <Card flush>
              <EmptyState
                icon={ClipboardList}
                title="ไม่มีออเดอร์ค้างของวันนี้"
                description={
                  digest && digest.totalOrders > 0
                    ? `ออเดอร์ของวันนี้ทั้ง ${digest.totalOrders} ใบดำเนินการครบแล้ว`
                    : "วันที่เลือกยังไม่มีคำสั่งซื้อที่ชำระเงินสำเร็จ"
                }
              />
            </Card>
          )}
        </>
      )}

      {/* ------------------------------------------------ ตั้งค่าการส่งอีเมล */}
      <Card className="flex flex-col gap-5">
        <CardHeader
          title="ส่งอีเมลอัตโนมัติ"
          description="ระบบจะส่งสรุปออเดอร์ค้างของวันนั้นให้ตามเวลาที่ตั้งไว้ วันละครั้ง"
        />

        <div className="flex items-center justify-between rounded-xl border border-bo-line bg-slate-50/70 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-bo-text">เปิดการส่งอัตโนมัติ</p>
            <p className="text-[11px] text-bo-muted">
              ปิดไว้ก็ยังกดปุ่ม “ส่งอีเมลตอนนี้” ได้ตามปกติ
            </p>
          </div>
          <Toggle
            checked={settings.enabled}
            onChange={(next) => setSettings((previous) => ({ ...previous, enabled: next }))}
            label="เปิดการส่งอีเมลสรุปออเดอร์ค้างอัตโนมัติ"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="อีเมลผู้รับ" required={settings.enabled}>
            {(id) => (
              <TextInput
                id={id}
                type="email"
                value={settings.email}
                placeholder="manager@example.com"
                onChange={(event) =>
                  setSettings((previous) => ({ ...previous, email: event.target.value }))
                }
              />
            )}
          </Field>

          <Field label="เวลาส่ง" hint="เวลาประเทศไทย">
            {(id) => (
              <TextInput
                id={id}
                type="time"
                value={settings.time}
                onChange={(event) =>
                  setSettings((previous) => ({ ...previous, time: event.target.value }))
                }
              />
            )}
          </Field>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            icon={Mail}
            disabled={savingSettings}
            onClick={() => void handleSaveSettings()}
          >
            {savingSettings ? "กำลังบันทึก" : "บันทึกการตั้งค่า"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
