import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category, Product } from "../../../types/admin";
import { Button, Field, IconButton, Modal, TextInput } from "../ui";

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onCreate: (id: string, name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * จัดการหมวดหมู่
 * แยกออกมาจากฟอร์มสินค้า เพราะเป็นงานคนละจังหวะกัน — ตั้งหมวดหมู่ทีเดียว
 * แล้วใช้ซ้ำกับสินค้าหลายร้อยรายการ ไม่ควรเบียดพื้นที่ของฟอร์มที่ใช้บ่อยกว่า
 */
export function CategoryManagerModal({
  open,
  onClose,
  categories,
  products,
  onCreate,
  onRename,
  onDelete,
}: CategoryManagerModalProps) {
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const countFor = (categoryId: string) =>
    products.filter((product) => product.category === categoryId).length;

  const handleCreate = async () => {
    await onCreate(newKey.trim().toLowerCase(), newName.trim());
    setNewName("");
    setNewKey("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="หมวดหมู่สินค้า"
      description="ลบได้เฉพาะหมวดหมู่ที่ยังไม่มีสินค้าใช้อยู่"
      footer={<Button onClick={onClose}>เสร็จสิ้น</Button>}
    >
      <div className="flex flex-col gap-6">
        <ul className="flex flex-col gap-1.5">
          {categories.map((category) => {
            const used = countFor(category.id);
            const isEditing = editingId === category.id;

            return (
              <li
                key={category.id}
                className="flex items-center gap-2 rounded-xl border border-bo-line bg-white px-3 py-2"
              >
                {isEditing ? (
                  <>
                    <TextInput
                      autoFocus
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void onRename(category.id, editingName.trim()).then(() =>
                            setEditingId(null),
                          );
                        } else if (event.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      className="h-8 flex-1"
                    />
                    <IconButton
                      icon={Check}
                      label="บันทึกชื่อหมวดหมู่"
                      onClick={() =>
                        void onRename(category.id, editingName.trim()).then(() =>
                          setEditingId(null),
                        )
                      }
                    />
                    <IconButton
                      icon={X}
                      label="ยกเลิกการแก้ไข"
                      onClick={() => setEditingId(null)}
                    />
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm font-medium text-bo-text">
                      {category.name}
                    </span>
                    <span className="font-bo-mono text-[11px] text-slate-400">
                      {category.id}
                    </span>
                    <span className="bo-nums rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                      {used}
                    </span>
                    <IconButton
                      icon={Pencil}
                      label={`เปลี่ยนชื่อหมวดหมู่ ${category.name}`}
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                    />
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      disabled={used > 0 || categories.length <= 1}
                      label={
                        used > 0
                          ? `ลบไม่ได้ มีสินค้าใช้หมวดหมู่นี้อยู่ ${used} รายการ`
                          : `ลบหมวดหมู่ ${category.name}`
                      }
                      onClick={() => void onDelete(category.id)}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-4 rounded-xl border border-bo-line bg-slate-50/70 p-4">
          <p className="text-xs font-semibold text-bo-text">เพิ่มหมวดหมู่ใหม่</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ชื่อที่แสดง">
              {(id) => (
                <TextInput
                  id={id}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="เช่น ของเล่น"
                />
              )}
            </Field>

            <Field label="คีย์ภาษาอังกฤษ" hint="ใช้ในระบบ เปลี่ยนภายหลังไม่ได้">
              {(id) => (
                <TextInput
                  id={id}
                  mono
                  value={newKey}
                  onChange={(event) => setNewKey(event.target.value)}
                  placeholder="toys"
                />
              )}
            </Field>
          </div>

          <Button
            variant="primary"
            icon={Plus}
            disabled={!newName.trim() || !newKey.trim()}
            onClick={() => void handleCreate()}
            className="self-start"
          >
            เพิ่มหมวดหมู่
          </Button>
        </div>
      </div>
    </Modal>
  );
}
