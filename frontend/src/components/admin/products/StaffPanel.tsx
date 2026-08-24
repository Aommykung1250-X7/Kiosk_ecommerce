import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, UserPlus, Users } from "lucide-react";
import type { StaffUser, UserFormState, UserRole } from "../../../types/admin";
import { notify, confirmDialog } from "../../notify";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  Modal,
  Select,
  TBody,
  Table,
  TableShell,
  Td,
  TextInput,
  Th,
  THead,
  Tr,
  formatThaiDate,
} from "../ui";

const EMPTY_USER: UserFormState = {
  username: "",
  password: "",
  role: "staff",
  name: "",
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  staff: "พนักงานหน้าร้าน",
};

/** บัญชีพนักงานและสิทธิ์การเข้าถึงระบบหลังบ้าน */
export function StaffPanel({ currentUserId }: { currentUserId?: number }) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/users", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ไม่สามารถดึงข้อมูลรายชื่อพนักงานได้");
      setUsers(data);
    } catch (error) {
      notify.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกรายชื่อพนักงาน");

      notify.success("เพิ่มพนักงานแล้ว");
      setModalOpen(false);
      setForm(EMPTY_USER);
      void fetchUsers();
    } catch (error) {
      notify.error((error as Error).message);
    }
  };

  const handleDelete = async (user: StaffUser) => {
    const confirmed = await confirmDialog({
      title: "ลบบัญชีผู้ใช้งาน?",
      message: `บัญชี "${user.name || user.username}" จะเข้าระบบหลังบ้านไม่ได้อีก`,
      confirmText: "ลบบัญชี",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการลบพนักงาน");

      notify.success("ลบบัญชีแล้ว");
      void fetchUsers();
    } catch (error) {
      notify.error((error as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="พนักงานและสิทธิ์"
          description="ผู้ดูแลระบบเข้าได้ทุกหน้า พนักงานหน้าร้านเข้าได้เฉพาะหน้าคำสั่งซื้อ"
          actions={
            <Button variant="primary" icon={UserPlus} onClick={() => setModalOpen(true)}>
              เพิ่มพนักงาน
            </Button>
          }
        />
      </Card>

      <TableShell>
        {loading ? (
          <LoadingState label="กำลังโหลดบัญชีผู้ใช้งาน" />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="ยังไม่มีบัญชีพนักงาน"
            description="เพิ่มบัญชีแรกเพื่อให้พนักงานหน้าร้านเข้ามาจ่ายสินค้าตามคิวได้"
            action={
              <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
                เพิ่มพนักงาน
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <Th>ชื่อ</Th>
              <Th>ชื่อผู้ใช้</Th>
              <Th>สิทธิ์</Th>
              <Th>สร้างเมื่อ</Th>
              <Th align="right">จัดการ</Th>
            </THead>
            <TBody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td className="font-medium">{user.name}</Td>
                  <Td className="font-bo-mono text-[13px] text-bo-muted">{user.username}</Td>
                  <Td>
                    <Badge tone={user.role === "admin" ? "accent" : "neutral"}>
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-bo-muted">{formatThaiDate(user.createdAt)}</Td>
                  <Td align="right">
                    {currentUserId === user.id ? (
                      <span className="text-[11px] text-slate-400">บัญชีของคุณ</span>
                    ) : (
                      <IconButton
                        icon={Trash2}
                        tone="danger"
                        label={`ลบบัญชี ${user.name || user.username}`}
                        onClick={() => void handleDelete(user)}
                      />
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </TableShell>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="เพิ่มพนักงาน"
        description="กำหนดชื่อผู้ใช้ รหัสผ่าน และสิทธิ์การเข้าถึง"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>ยกเลิก</Button>
            <Button variant="primary" type="submit" form="staff-form">
              เพิ่มพนักงาน
            </Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleCreate} className="flex flex-col gap-5">
          <Field label="ชื่อ-นามสกุล" required>
            {(id) => (
              <TextInput
                id={id}
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="เช่น สมชาย ใจดี"
              />
            )}
          </Field>

          <Field label="ชื่อผู้ใช้" required hint="ใช้สำหรับเข้าสู่ระบบหลังบ้าน">
            {(id) => (
              <TextInput
                id={id}
                required
                mono
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="staff3"
              />
            )}
          </Field>

          <Field label="รหัสผ่าน" required>
            {(id) => (
              <TextInput
                id={id}
                required
                type="password"
                minLength={4}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="อย่างน้อย 4 ตัวอักษร"
              />
            )}
          </Field>

          <Field label="สิทธิ์การเข้าถึง">
            {(id) => (
              <Select<UserRole>
                id={id}
                value={form.role}
                onChange={(value) => setForm({ ...form, role: value })}
                options={[
                  { value: "staff", label: "พนักงานหน้าร้าน — เข้าได้เฉพาะหน้าคำสั่งซื้อ" },
                  { value: "admin", label: "ผู้ดูแลระบบ — เข้าได้ทุกหน้า" },
                ]}
              />
            )}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
