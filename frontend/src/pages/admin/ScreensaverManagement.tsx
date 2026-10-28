import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { Screensaver } from "../../types/admin";
import { notify, confirmDialog } from "../../components/notify";
import { AdminLayout } from "../../components/admin/AdminLayout";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  Field,
  IconButton,
  LoadingState,
  NumberInput,
  Toggle,
  formatBahtShort,
  resolveUploadUrl,
} from "../../components/admin/ui";
import { PlaylistTimeline } from "../../components/admin/screensavers/PlaylistTimeline";
import {
  ScreensaverFormModal,
  type ScreensaverDraft,
} from "../../components/admin/screensavers/ScreensaverFormModal";
import { FeaturedProductModal } from "../../components/admin/screensavers/FeaturedProductModal";
import type { Product } from "../../types/admin";

const FEATURED_SLOTS = 4;
const ALLOWED_MAIN_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ScreensaverManagement() {
  const navigate = useNavigate();

  const [screensavers, setScreensavers] = useState<Screensaver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Screensaver | null>(null);
  const [saving, setSaving] = useState(false);

  const [masterEnabled, setMasterEnabled] = useState(true);
  const [masterDuration, setMasterDuration] = useState(10);
  const [mainImage, setMainImage] = useState("");
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [featuredProductIds, setFeaturedProductIds] = useState<number[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredModalOpen, setFeaturedModalOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  /* ------------------------------------------------------------ โหลดข้อมูล */

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/screensavers/config");
      if (!response.ok) return;
      const data = await response.json();
      setMasterEnabled(data.masterEnabled ?? true);
      setMasterDuration(data.masterDuration ?? 10);
      setMainImage(data.mainImage ?? "");
      setFeaturedProductIds(data.featuredProductIds ?? []);
      setFeaturedProducts(data.featuredProducts ?? []);
    } catch (loadError) {
      console.error("Error fetching screensaver config:", loadError);
    }
  }, []);

  const fetchScreensavers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/screensavers", { credentials: "include" });
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลสื่อโฆษณาได้");
      setScreensavers(await response.json());
      setError("");
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/ditc-portal-to-manager");
      return;
    }
    try {
      if (JSON.parse(raw).role !== "admin") {
        navigate("/unauthorized");
        return;
      }
    } catch {
      navigate("/ditc-portal-to-manager");
      return;
    }

    void fetchScreensavers();
    void fetchConfig();
  }, [navigate, fetchScreensavers, fetchConfig]);

  /* ------------------------------------------------------------ หน้าจอหลัก */

  const saveConfig = async (
    productIds: number[] = featuredProductIds,
    image: string = mainImage,
  ) => {
    setSavingConfig(true);
    try {
      const response = await fetch("/api/screensavers/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          masterEnabled,
          masterDuration,
          featuredProductIds: productIds,
          mainImage: image,
        }),
      });
      if (!response.ok) throw new Error("ไม่สามารถบันทึกการตั้งค่าได้");

      notify.success("บันทึกการตั้งค่าหน้าจอหลักแล้ว");
      void fetchConfig();
    } catch (saveError) {
      notify.error((saveError as Error).message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleMainImageChange = async (file: File | null) => {
    if (!file) return;
    if (!ALLOWED_MAIN_IMAGE_TYPES.includes(file.type)) {
      notify.warning("รองรับไฟล์ JPG, PNG และ WebP เท่านั้น");
      return;
    }

    setUploadingMainImage(true);
    try {
      const filename = await uploadImage(file);
      setMainImage(filename);
      await saveConfig(featuredProductIds, filename);
    } catch (uploadError) {
      notify.error((uploadError as Error).message);
    } finally {
      setUploadingMainImage(false);
    }
  };

  /* -------------------------------------------------------------- สื่อโฆษณา */

  const uploadImage = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append("image", file);

    const response = await fetch("/api/screensavers/upload", {
      method: "POST",
      credentials: "include",
      body,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "อัปโหลดรูปภาพไม่สำเร็จ");
    return data.image;
  };

  const handleSubmit = async (draft: ScreensaverDraft) => {
    setSaving(true);
    try {
      const mediaUrl = draft.file ? await uploadImage(draft.file) : draft.mediaUrl;
      if (!mediaUrl) throw new Error("เลือกไฟล์ภาพสำหรับสื่อโฆษณาก่อนบันทึก");

      const payload = {
        title: draft.title,
        mediaUrl,
        duration: draft.duration,
        displayOrder: draft.displayOrder,
        isActive: draft.isActive,
      };

      const response = await fetch(
        editing ? `/api/screensavers/${editing.id}` : "/api/screensavers",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");

      notify.success(editing ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสื่อโฆษณาแล้ว");
      setFormOpen(false);
      setEditing(null);
      void fetchScreensavers();
    } catch (submitError) {
      notify.error((submitError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Screensaver) => {
    const confirmed = await confirmDialog({
      title: "ลบสื่อโฆษณานี้?",
      message: `"${item.title}" จะถูกนำออกจากรอบการเล่นบนตู้ทันที`,
      confirmText: "ลบสื่อโฆษณา",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/screensavers/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ลบไม่สำเร็จ");

      notify.success("ลบสื่อโฆษณาแล้ว");
      void fetchScreensavers();
    } catch (deleteError) {
      notify.error((deleteError as Error).message);
    }
  };

  const handleToggleActive = async (item: Screensaver, next: boolean) => {
    // อัปเดตหน้าจอทันทีเพื่อให้ไทม์ไลน์ขยับตามการกดโดยไม่ต้องรอเซิร์ฟเวอร์
    setScreensavers((previous) =>
      previous.map((entry) =>
        entry.id === item.id ? { ...entry, isActive: next } : entry,
      ),
    );

    try {
      const response = await fetch(`/api/screensavers/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "สลับสถานะไม่สำเร็จ");
      void fetchScreensavers();
    } catch (toggleError) {
      notify.error((toggleError as Error).message);
      void fetchScreensavers();
    }
  };

  const sortedScreensavers = [...screensavers].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const activeCount = screensavers.filter((item) => item.isActive).length;

  return (
    <AdminLayout
      title="หน้าจอพักและโฆษณา"
      description="สื่อที่เล่นวนบนตู้ขณะไม่มีคนใช้งาน"
      actions={
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          เพิ่มสื่อโฆษณา
        </Button>
      }
    >
      {/* ------------------------------------------------ หน้าจอหลักและรอบเล่น */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Card className="flex flex-col gap-5">
          <CardHeader
            title="หน้าจอหลัก"
            description="หน้าจอที่มีนาฬิกาและสินค้าแนะนำ เล่นสลับกับสื่อโฆษณาในรอบเดียวกัน"
            actions={
              <Toggle
                checked={masterEnabled}
                onChange={setMasterEnabled}
                label="เปิดใช้หน้าจอหลักในรอบการเล่น"
              />
            }
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-bo-text">รูปหลักของหน้าจอหลัก</h3>
                <p className="mt-0.5 text-[11px] text-bo-muted">
                  ภาพแรกของรอบ ดูตัวอย่างได้ที่ลำดับ 1 ในลำดับการเล่น
                </p>
              </div>
              <label className="shrink-0">
                <input
                  type="file"
                  accept={ALLOWED_MAIN_IMAGE_TYPES.join(",")}
                  className="sr-only"
                  disabled={uploadingMainImage}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    void handleMainImageChange(file);
                  }}
                />
                <span
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-bo-line bg-white px-3 text-xs font-medium text-bo-text transition-colors hover:bg-slate-50 ${
                    uploadingMainImage ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploadingMainImage ? "กำลังอัปโหลด" : "เปลี่ยนรูป"}
                </span>
              </label>
            </div>
          </div>

          <Field label="ระยะเวลาแสดงผลของหน้าจอหลัก" hint="ตั้งได้ระหว่าง 3 ถึง 60 วินาที">
            {(id) => (
              <NumberInput
                id={id}
                min={3}
                max={60}
                suffix="วินาที"
                className="max-w-48"
                value={masterDuration}
                onChange={(event) =>
                  setMasterDuration(parseInt(event.target.value, 10) || 10)
                }
              />
            )}
          </Field>

          <div className="flex flex-col gap-3 border-t border-bo-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-bo-text">สินค้าแนะนำ</h3>
                <p className="mt-0.5 text-[11px] text-bo-muted">
                  เลือกแล้ว {featuredProductIds.length} จาก {FEATURED_SLOTS} ช่อง
                </p>
              </div>
              <Button
                size="sm"
                icon={Sparkles}
                onClick={() => setFeaturedModalOpen(true)}
              >
                เลือกสินค้า
              </Button>
            </div>

            <ul className="grid grid-cols-2 gap-2">
              {Array.from({ length: FEATURED_SLOTS }, (_, index) => {
                const product = featuredProducts[index];
                return (
                  <li
                    key={index}
                    className={`flex h-14 items-center gap-2.5 rounded-xl border px-2.5 ${
                      product
                        ? "border-bo-line bg-white"
                        : "border-dashed border-slate-300 bg-slate-50"
                    }`}
                  >
                    {product ? (
                      <>
                        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-bo-line bg-slate-50">
                          <img
                            src={resolveUploadUrl(product.image, "products") ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-bo-text">
                            {product.name}
                          </span>
                          <span className="bo-nums block text-[11px] text-bo-muted">
                            {formatBahtShort(product.price)}
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        เติมสินค้าขายดีอัตโนมัติ
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <Button
            variant="primary"
            fullWidth
            disabled={savingConfig}
            onClick={() => void saveConfig()}
            className="mt-auto"
          >
            {savingConfig ? "กำลังบันทึก" : "บันทึกการตั้งค่าหน้าจอหลัก"}
          </Button>
        </Card>

        <Card className="flex flex-col gap-5">
          <CardHeader
            title="ลำดับการเล่น"
            description="ภาพรวมของหนึ่งรอบเต็มที่ลูกค้าจะเห็นเมื่อยืนอยู่หน้าตู้"
            actions={
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bo-accent-soft text-bo-accent">
                <Clock className="h-4 w-4" />
              </span>
            }
          />

          <PlaylistTimeline
            screensavers={screensavers}
            masterEnabled={masterEnabled}
            masterDuration={masterDuration}
            mainImage={mainImage}
          />
        </Card>
      </div>

      {/* ------------------------------------------------------ คลังสื่อโฆษณา */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-bo-text">คลังสื่อโฆษณา</h2>
          <p className="mt-0.5 text-xs text-bo-muted">
            {screensavers.length} ชิ้นในระบบ · เปิดแสดงผลอยู่ {activeCount} ชิ้น
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Card flush>
          <LoadingState label="กำลังโหลดคลังสื่อโฆษณา" />
        </Card>
      ) : screensavers.length === 0 ? (
        <Card flush>
          <EmptyState
            icon={Images}
            title="ยังไม่มีสื่อโฆษณาในระบบ"
            description="ตู้จะแสดงหน้าจอสำรองที่มีภาพศิลปะล้านนาและสินค้าขายดีจนกว่าจะอัปโหลดสื่อชิ้นแรก"
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                เพิ่มสื่อโฆษณา
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedScreensavers.map((item) => (
            <li
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-bo-line bg-white shadow-[0_1px_2px_rgba(23,27,46,0.04)]"
            >
              <div className="relative aspect-video bg-slate-900">
                <img
                  src={resolveUploadUrl(item.mediaUrl, "screensavers") ?? ""}
                  alt={item.title}
                  loading="lazy"
                  className={`h-full w-full object-cover transition-opacity duration-200 ${
                    item.isActive ? "" : "opacity-40"
                  }`}
                />

                <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <span className="bo-nums">ลำดับ {item.displayOrder}</span>
                  <span className="text-white/50">·</span>
                  <span className="bo-nums">{item.duration}s</span>
                </span>

                <span className="absolute top-3 right-3">
                  <Badge tone={item.isActive ? "success" : "neutral"} size="sm" dot>
                    {item.isActive ? "กำลังแสดงผล" : "ปิดอยู่"}
                  </Badge>
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="truncate text-sm font-medium text-bo-text">{item.title}</h3>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-bo-line pt-3">
                  <div className="flex items-center gap-2.5">
                    <Toggle
                      checked={item.isActive}
                      onChange={(next) => void handleToggleActive(item, next)}
                      label={`${item.isActive ? "ปิด" : "เปิด"}การแสดงผลของ ${item.title}`}
                    />
                    <span className="text-[11px] text-bo-muted">
                      {item.isActive ? "อยู่ในรอบการเล่น" : "ไม่อยู่ในรอบการเล่น"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={Pencil}
                      label={`แก้ไข ${item.title}`}
                      onClick={() => {
                        setEditing(item);
                        setFormOpen(true);
                      }}
                    />
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label={`ลบ ${item.title}`}
                      onClick={() => void handleDelete(item)}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ScreensaverFormModal
        open={formOpen}
        editing={editing}
        saving={saving}
        defaultOrder={screensavers.length}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        onInvalidFile={(message) => notify.warning(message)}
      />

      <FeaturedProductModal
        open={featuredModalOpen}
        onClose={() => setFeaturedModalOpen(false)}
        initialSelectedIds={featuredProductIds}
        onSave={(ids) => {
          setFeaturedProductIds(ids);
          void saveConfig(ids);
        }}
      />
    </AdminLayout>
  );
}
