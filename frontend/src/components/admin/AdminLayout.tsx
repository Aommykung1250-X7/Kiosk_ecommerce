import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { AdminSidebar, type SessionUser } from "./AdminSidebar";
import { PageHeading } from "./ui";

function readSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

interface AdminLayoutProps {
  title: string;
  description?: string;
  /** ปุ่มระดับหน้า วางชิดขวาของหัวเรื่อง */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * โครงหน้าของระบบหลังบ้าน
 * แถบเมนูสีเข้มตรึงซ้าย เนื้อหาอยู่บนพื้นสีอ่อน — โครงเดียวกับแบบร่างที่ได้รับ
 */
export function AdminLayout({ title, description, actions, children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setUser(readSessionUser());
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ออกจากระบบฝั่งหน้าเว็บต่อได้แม้เรียก API ไม่สำเร็จ
    }
    localStorage.removeItem("user");
    navigate("/ditc-portal-to-manager");
  };

  return (
    <div className="bo-root font-bo min-h-screen bg-bo-canvas text-bo-text lg:grid lg:grid-cols-[272px_1fr]">
      <AdminSidebar
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-col">
        {/* แถบเปิดเมนูสำหรับจอเล็ก */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-bo-line bg-bo-canvas/90 px-5 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="เปิดเมนู"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-bo-line bg-white text-bo-text"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">DITC Admin</span>
        </div>

        <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
          <PageHeading title={title} description={description} actions={actions} />
          {children}
        </main>
      </div>
    </div>
  );
}
