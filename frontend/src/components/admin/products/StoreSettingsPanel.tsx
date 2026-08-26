import { useCallback, useEffect, useState } from "react";
import { Eye, RotateCcw, Truck, Search, Phone, Trash2 } from "lucide-react";
import type { ContactSettings } from "../../../types/admin";
import { notify, confirmDialog } from "../../notify";
import {
  Button,
  Card,
  CardHeader,
  Field,
  NumberInput,
  TextArea,
  TextInput,
  formatBaht,
} from "../ui";

const DEFAULT_CONTACT: ContactSettings = {
  hotline: "053-942606",
  lineId: "@ditcsupport",
  lineUrl: "https://line.me/ti/p/@ditcsupport",
  lineQrImage: "",
  serviceHours: "เปิดบริการ 08:00 - 20:00 น.",
  website: "www.camt.cmu.ac.th",
  facebook: "CAMT Chiang Mai University",
};

/** ตั้งค่าที่ส่งผลกับหน้าตู้โดยตรง — ค่าจัดส่ง คำค้นหายอดนิยม และช่องทางติดต่อ */
export function StoreSettingsPanel({ onStatsReset }: { onStatsReset: () => void }) {
  const [shippingFee, setShippingFee] = useState("40");
  const [popularTags, setPopularTags] = useState("");
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);

  const [savingTags, setSavingTags] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [shippingRes, tagsRes, contactRes] = await Promise.all([
        fetch("/api/settings/shipping"),
        fetch("/api/settings/search-tags"),
        fetch("/api/settings/contact"),
      ]);

      if (shippingRes.ok) {
        const data = await shippingRes.json();
        setShippingFee(String(data.baseShippingFee));
      }
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        if (Array.isArray(data.popularSearchTags)) {
          setPopularTags(data.popularSearchTags.join(", "));
        }
      }
      if (contactRes.ok) {
        const data = (await contactRes.json()) as Partial<ContactSettings>;
        setContact((previous) => ({ ...previous, ...data }));
      }
    } catch (error) {
      console.error("Error loading store settings:", error);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSaveShipping = async () => {
    const fee = parseFloat(shippingFee);
    if (Number.isNaN(fee) || fee < 0) {
      notify.warning("ค่าจัดส่งต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }

    try {
      const response = await fetch("/api/settings/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          baseShippingFee: fee,
          additionalSplitShippingFee: fee,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกค่าจัดส่งไม่สำเร็จ");

      notify.success("บันทึกค่าจัดส่งแล้ว");
      void loadSettings();
    } catch (error) {
      notify.error((error as Error).message);
    }
  };

  const handleSaveTags = async () => {
    setSavingTags(true);
    try {
      const rawTags = popularTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (rawTags.length > 4) {
        notify.warning("คำค้นหายอดนิยมใส่นำเสนอได้สูงสุด 4 คำเท่านั้น");
      }

      const tagList = rawTags.slice(0, 4);

      const response = await fetch("/api/settings/search-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ popularSearchTags: tagList }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกคำค้นหายอดนิยมไม่สำเร็จ");

      notify.success("บันทึกคำค้นหายอดนิยมแล้ว (สูงสุด 4 คำ)");
      if (Array.isArray(data.popularSearchTags)) {
        setPopularTags(data.popularSearchTags.slice(0, 4).join(", "));
      }
    } catch (error) {
      notify.error((error as Error).message);
    } finally {
      setSavingTags(false);
    }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const response = await fetch("/api/settings/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(contact),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกข้อมูลการติดต่อไม่สำเร็จ");

      notify.success("บันทึกข้อมูลการติดต่อแล้ว");
    } catch (error) {
      notify.error((error as Error).message);
    } finally {
      setSavingContact(false);
    }
  };

  const handleQrUpload = async (file: File) => {
    const body = new FormData();
    body.append("image", file);

    setUploadingQr(true);
    try {
      const response = await fetch("/api/settings/contact/upload-qr", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "อัปโหลดรูปภาพไม่สำเร็จ");

      setContact((previous) => ({ ...previous, lineQrImage: data.url }));
      notify.success("อัปโหลด LINE QR Code แล้ว");
    } catch (error) {
      notify.error((error as Error).message);
    } finally {
      setUploadingQr(false);
    }
  };

  const resetCounter = async (
    endpoint: "reset-visitors" | "reset-product-views",
    title: string,
    message: string,
  ) => {
    const confirmed = await confirmDialog({
      title,
      message,
      confirmText: "รีเซ็ตเป็น 0",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/settings/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "รีเซ็ตไม่สำเร็จ");

      notify.success("รีเซ็ตเรียบร้อย เริ่มนับใหม่จาก 0");
      onStatsReset();
    } catch (error) {
      notify.error((error as Error).message);
    }
  };

  const tagList = popularTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);
  const feeValue = parseFloat(shippingFee) || 0;

  return (
    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {/* ------------------------------------------------------- ค่าจัดส่ง */}
      <Card className="flex flex-col gap-5">
        <CardHeader
          title="ค่าจัดส่ง"
          description="อัตราที่คิดกับลูกค้าเมื่อเลือกให้จัดส่งพัสดุ"
          actions={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bo-accent-soft text-bo-accent">
              <Truck className="h-4 w-4" />
            </span>
          }
        />

        <Field label="ค่าจัดส่งพื้นฐาน">
          {(id) => (
            <NumberInput
              id={id}
              min={0}
              prefix="฿"
              value={shippingFee}
              onChange={(event) => setShippingFee(event.target.value)}
            />
          )}
        </Field>

        <dl className="flex flex-col gap-2 rounded-xl border border-bo-line bg-slate-50/70 p-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-bo-muted">ส่งรอบเดียว</dt>
            <dd className="bo-nums font-semibold">{formatBaht(feeValue)}</dd>
          </div>
          <div className="flex items-start justify-between border-t border-bo-line pt-2">
            <dt className="text-bo-muted">
              แยกส่งสองรอบ
              <span className="mt-0.5 block text-[11px] text-slate-400">
                สินค้าพร้อมส่งกับพรีออเดอร์คนละรอบ
              </span>
            </dt>
            <dd className="bo-nums font-semibold text-amber-700">{formatBaht(feeValue * 2)}</dd>
          </div>
        </dl>

        <Button variant="primary" fullWidth onClick={() => void handleSaveShipping()} className="mt-auto">
          บันทึกค่าจัดส่ง
        </Button>
      </Card>

      {/* --------------------------------------------- คำค้นหายอดนิยม */}
      <Card className="flex flex-col gap-5">
        <CardHeader
          title="คำค้นหายอดนิยม"
          description="ปุ่มค้นหาด่วนที่ขึ้นบนหน้าค้นหาของตู้ (แสดงสูงสุด 4 คำ)"
          actions={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bo-accent-soft text-bo-accent">
              <Search className="h-4 w-4" />
            </span>
          }
        />

        <Field label="คำค้นหา" hint="คั่นแต่ละคำด้วยเครื่องหมายจุลภาค (สูงสุด 4 คำ)">
          {(id) => (
            <TextArea
              id={id}
              rows={3}
              value={popularTags}
              onChange={(event) => setPopularTags(event.target.value)}
              placeholder="น้ำดื่ม, ชาเขียว, ขนม, แก้วน้ำ"
            />
          )}
        </Field>

        <div className="rounded-xl border border-bo-line bg-slate-50/70 p-4">
          <p className="mb-2.5 text-[11px] font-medium text-bo-muted">ตัวอย่างบนหน้าตู้</p>
          <div className="flex flex-wrap gap-1.5">
            {tagList.length > 0 ? (
              tagList.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-bo-line bg-white px-3 py-1 text-xs font-medium text-bo-text"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">ยังไม่มีคำค้นหา</span>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={savingTags}
          onClick={() => void handleSaveTags()}
          className="mt-auto"
        >
          {savingTags ? "กำลังบันทึก" : "บันทึกคำค้นหา"}
        </Button>
      </Card>

      {/* --------------------------------------------------- ช่องทางติดต่อ */}
      <Card className="flex flex-col gap-5">
        <CardHeader
          title="ช่องทางติดต่อเจ้าหน้าที่"
          description="ข้อมูลที่แสดงในศูนย์ช่วยเหลือบนตู้"
          actions={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bo-accent-soft text-bo-accent">
              <Phone className="h-4 w-4" />
            </span>
          }
        />

        <div className="flex flex-col gap-4">
          <Field label="เบอร์ Hotline">
            {(id) => (
              <TextInput
                id={id}
                value={contact.hotline}
                onChange={(event) => setContact({ ...contact, hotline: event.target.value })}
              />
            )}
          </Field>

          <Field label="เวลาทำการ">
            {(id) => (
              <TextInput
                id={id}
                value={contact.serviceHours}
                onChange={(event) =>
                  setContact({ ...contact, serviceHours: event.target.value })
                }
              />
            )}
          </Field>

          <Field label="LINE ID">
            {(id) => (
              <TextInput
                id={id}
                value={contact.lineId}
                onChange={(event) => setContact({ ...contact, lineId: event.target.value })}
              />
            )}
          </Field>

          <Field label="ลิงก์ LINE Official" hint="ระบบสร้าง QR Code จากลิงก์นี้ให้อัตโนมัติ">
            {(id) => (
              <TextInput
                id={id}
                mono
                value={contact.lineUrl}
                onChange={(event) => setContact({ ...contact, lineUrl: event.target.value })}
              />
            )}
          </Field>

          <Field label="เว็บไซต์">
            {(id) => (
              <TextInput
                id={id}
                value={contact.website}
                onChange={(event) => setContact({ ...contact, website: event.target.value })}
              />
            )}
          </Field>

          <Field label="เพจ Facebook">
            {(id) => (
              <TextInput
                id={id}
                value={contact.facebook}
                onChange={(event) => setContact({ ...contact, facebook: event.target.value })}
              />
            )}
          </Field>

          <Field label="รูป LINE QR Code" optionalNote="ไม่บังคับ" hint="อัปโหลดเมื่อต้องการใช้รูปของตัวเองแทน QR ที่ระบบสร้าง">
            {(id) => (
              <div className="flex flex-col gap-2.5">
                <input
                  id={id}
                  type="file"
                  accept="image/*"
                  disabled={uploadingQr}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleQrUpload(file);
                    event.target.value = "";
                  }}
                  className="text-xs text-bo-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-bo-text hover:file:bg-slate-200"
                />

                {contact.lineQrImage && (
                  <div className="flex items-center gap-3 rounded-xl border border-bo-line bg-slate-50/70 p-2.5">
                    <img
                      src={contact.lineQrImage}
                      alt="ตัวอย่าง LINE QR Code"
                      className="h-10 w-10 rounded-lg border border-bo-line bg-white object-contain"
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-bo-muted">
                      {contact.lineQrImage}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      onClick={() => setContact({ ...contact, lineQrImage: "" })}
                    >
                      ลบรูป
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Field>
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={savingContact}
          onClick={() => void handleSaveContact()}
          className="mt-auto"
        >
          {savingContact ? "กำลังบันทึก" : "บันทึกข้อมูลการติดต่อ"}
        </Button>
      </Card>

      {/* ------------------------------------------------------- รีเซ็ตสถิติ */}
      <Card className="flex flex-col gap-5 lg:col-span-2 xl:col-span-3">
        <CardHeader
          title="รีเซ็ตตัวนับสถิติ"
          description="ตั้งค่าตัวนับกลับเป็น 0 เพื่อเริ่มเก็บสถิติรอบใหม่ ข้อมูลที่นับไว้เดิมจะหายถาวร"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            icon={RotateCcw}
            onClick={() =>
              void resetCounter(
                "reset-visitors",
                "รีเซ็ตจำนวนผู้เข้าใช้งาน?",
                "ตัวนับจำนวนครั้งที่ตู้ถูกแตะเริ่มใช้งานจะกลับไปเป็น 0 และย้อนกลับไม่ได้",
              )
            }
          >
            รีเซ็ตจำนวนผู้เข้าใช้งานตู้
          </Button>

          <Button
            icon={Eye}
            onClick={() =>
              void resetCounter(
                "reset-product-views",
                "รีเซ็ตยอดการเข้าชมสินค้า?",
                "ยอดเข้าชมของสินค้าทุกรายการจะกลับไปเป็น 0 และย้อนกลับไม่ได้",
              )
            }
          >
            รีเซ็ตยอดการเข้าชมสินค้า
          </Button>
        </div>
      </Card>
    </div>
  );
}
