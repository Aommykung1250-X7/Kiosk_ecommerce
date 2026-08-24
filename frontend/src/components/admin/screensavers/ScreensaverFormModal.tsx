import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import type { Screensaver } from "../../../types/admin";
import {
  Button,
  Checkbox,
  Dropzone,
  Field,
  Modal,
  NumberInput,
  TextInput,
  resolveUploadUrl,
} from "../ui";

export interface ScreensaverDraft {
  title: string;
  duration: number;
  displayOrder: number;
  isActive: boolean;
  mediaUrl: string;
  file: File | null;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface ScreensaverFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: ScreensaverDraft) => Promise<void>;
  editing: Screensaver | null;
  defaultOrder: number;
  saving: boolean;
  onInvalidFile: (message: string) => void;
}

/** ฟอร์มเพิ่ม/แก้ไขสื่อโฆษณา พร้อมกรอบพรีวิว 16:9 เท่าสัดส่วนจอตู้จริง */
export function ScreensaverFormModal({
  open,
  onClose,
  onSubmit,
  editing,
  defaultOrder,
  saving,
  onInvalidFile,
}: ScreensaverFormModalProps) {
  const [draft, setDraft] = useState<ScreensaverDraft>({
    title: "",
    duration: 10,
    displayOrder: defaultOrder,
    isActive: true,
    mediaUrl: "",
    file: null,
  });
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft({
      title: editing?.title ?? "",
      duration: editing?.duration ?? 10,
      displayOrder: editing?.displayOrder ?? defaultOrder,
      isActive: editing?.isActive ?? true,
      mediaUrl: editing?.mediaUrl ?? "",
      file: null,
    });
    setLocalPreview(null);
  }, [open, editing, defaultOrder]);

  // ปล่อย object URL ของไฟล์ที่เลือกไว้ ไม่ให้ค้างในหน่วยความจำ
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      onInvalidFile("รองรับเฉพาะไฟล์ JPEG, PNG และ WebP");
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setDraft((previous) => ({ ...previous, file }));
  };

  const preview = localPreview ?? resolveUploadUrl(draft.mediaUrl, "screensavers");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(draft);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "แก้ไขสื่อโฆษณา" : "เพิ่มสื่อโฆษณา"}
      description="ภาพจะแสดงเต็มจอตู้ในอัตราส่วน 16:9"
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            variant="primary"
            type="submit"
            form="screensaver-form"
            disabled={saving || (!draft.file && !draft.mediaUrl)}
          >
            {saving ? "กำลังบันทึก" : editing ? "บันทึกการแก้ไข" : "เพิ่มสื่อโฆษณา"}
          </Button>
        </>
      }
    >
      <form id="screensaver-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {preview ? (
          <div className="flex flex-col gap-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-bo-line bg-slate-900">
              <img src={preview} alt="ตัวอย่างสื่อโฆษณา" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-bo-muted">
                {draft.file ? draft.file.name : "ภาพปัจจุบัน"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon={Trash2}
                onClick={() => {
                  if (localPreview) URL.revokeObjectURL(localPreview);
                  setLocalPreview(null);
                  setDraft((previous) => ({ ...previous, file: null, mediaUrl: "" }));
                }}
              >
                เลือกภาพใหม่
              </Button>
            </div>
          </div>
        ) : (
          <Dropzone
            aspect="16/9"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onFiles={handleFiles}
            title="ลากภาพมาวาง หรือคลิกเพื่อเลือกไฟล์"
            hint="รองรับ JPEG, PNG และ WebP · แนะนำขนาด 1920 × 1080 พิกเซล"
          />
        )}

        <Field label="ชื่อสื่อ" required hint="ใช้อ้างอิงในหลังบ้านเท่านั้น ลูกค้าไม่เห็นข้อความนี้">
          {(id) => (
            <TextInput
              id={id}
              required
              value={draft.title}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, title: event.target.value }))
              }
              placeholder="เช่น โปรโมชั่นเทศกาลเชียงใหม่"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ระยะเวลาแสดงผล" required hint="ตั้งได้ระหว่าง 3 ถึง 60 วินาที">
            {(id) => (
              <NumberInput
                id={id}
                required
                min={3}
                max={60}
                suffix="วินาที"
                value={draft.duration}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    duration: parseInt(event.target.value, 10) || 10,
                  }))
                }
              />
            )}
          </Field>

          <Field label="ลำดับในรอบการเล่น" required hint="เลขน้อยเล่นก่อน">
            {(id) => (
              <NumberInput
                id={id}
                required
                min={0}
                value={draft.displayOrder}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    displayOrder: parseInt(event.target.value, 10) || 0,
                  }))
                }
              />
            )}
          </Field>
        </div>

        <div className="rounded-xl border border-bo-line bg-slate-50/70 px-4 py-3.5">
          <Checkbox
            checked={draft.isActive}
            onChange={(next) => setDraft((previous) => ({ ...previous, isActive: next }))}
            label="เปิดแสดงผลบนตู้ทันที"
            description="ปิดไว้ได้หากยังไม่ถึงกำหนดเริ่มแคมเปญ"
          />
        </div>
      </form>
    </Modal>
  );
}
