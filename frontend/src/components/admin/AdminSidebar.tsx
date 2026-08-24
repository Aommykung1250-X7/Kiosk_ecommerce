import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  LogOut,
  MonitorPlay,
  Package,
  PieChart,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../../types/admin";
import { cn } from "./ui/cn";

export interface SessionUser {
  id: number;
  name?: string;
  username: string;
  role: UserRole;
}

interface NavChild {
  label: string;
  path: string;
}

interface NavEntry {
  label: string;
  path: string;
  icon: LucideIcon;
  adminOnly: boolean;
  children?: NavChild[];
}

/**
 * โครงเมนู — เรียงตามลำดับงานที่พนักงานทำจริงในหนึ่งกะ
 * รับออเดอร์ก่อน แล้วค่อยดูของในคลัง ตามด้วยงานตั้งค่าจอและงานรายงานท้ายวัน
 */
const NAV: NavEntry[] = [
  {
    label: "คำสั่งซื้อ",
    path: "/dashboard/orders",
    icon: ClipboardList,
    adminOnly: false,
  },
  {
    label: "สินค้า",
    path: "/dashboard/products",
    icon: Package,
    adminOnly: true,
    children: [
      { label: "รายการสินค้า", path: "/dashboard/products" },
      { label: "พนักงานและสิทธิ์", path: "/dashboard/products?tab=users" },
      { label: "ตั้งค่าร้าน", path: "/dashboard/products?tab=settings" },
    ],
  },
  {
    label: "หน้าจอพักและโฆษณา",
    path: "/dashboard/screensavers",
    icon: MonitorPlay,
    adminOnly: true,
  },
  {
    label: "รายงาน",
    path: "/dashboard/reports",
    icon: PieChart,
    adminOnly: true,
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  staff: "พนักงานหน้าร้าน",
};

const ROLE_ICON: Record<UserRole, LucideIcon> = {
  admin: LayoutGrid,
  staff: Users,
};

interface AdminSidebarProps {
  user: SessionUser | null;
  onLogout: () => void;
  /** เปิดอยู่บนจอเล็ก — บนจอกว้างแถบนี้ตรึงอยู่ตลอด */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  user,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const items = useMemo(
    () => NAV.filter((entry) => !entry.adminOnly || isAdmin),
    [isAdmin],
  );

  const [expanded, setExpanded] = useState<string | null>(null);

  // เปิดกลุ่มเมนูของหน้าที่กำลังอยู่ให้อัตโนมัติ ผู้ใช้จะเห็นว่าตัวเองอยู่ตรงไหนของโครง
  useEffect(() => {
    const current = NAV.find((entry) => location.pathname === entry.path);
    if (current?.children) setExpanded(current.path);
  }, [location.pathname]);

  const RoleIcon = user ? ROLE_ICON[user.role] : Users;

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-bo-ink/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col lg:sticky lg:top-0 lg:h-screen lg:w-full",
          "transition-transform duration-200 lg:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col bg-bo-ink lg:m-4 lg:h-[calc(100vh-2rem)] lg:rounded-2xl">
          {/* ตราสัญลักษณ์ */}
          <div className="px-6 pt-7 pb-6">
            <p className="text-[19px] leading-none font-semibold tracking-tight text-white">
              DITC Admin
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500">ระบบหลังบ้านตู้จำหน่ายสินค้า</p>
          </div>

          {/* เมนูหลัก */}
          <nav className="bo-rail-scroll flex-1 overflow-y-auto px-3 pb-4">
            <ul className="flex flex-col gap-0.5">
              {items.map((entry) => {
                const Icon = entry.icon;
                const active = location.pathname === entry.path;
                const open = expanded === entry.path;

                return (
                  <li key={entry.path}>
                    <button
                      type="button"
                      onClick={() => {
                        if (entry.children) {
                          setExpanded(open && active ? null : entry.path);
                        }
                        if (!active) navigate(entry.path);
                        onCloseMobile();
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150",
                        active
                          ? "bg-bo-ink-2 font-semibold text-white"
                          : "font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1 text-left">{entry.label}</span>
                      {entry.children && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200",
                            open ? "rotate-180" : "",
                          )}
                        />
                      )}
                    </button>

                    {entry.children && open && (
                      <ul className="mt-0.5 mb-1 flex flex-col gap-0.5 pl-[26px]">
                        {entry.children.map((child) => {
                          // แท็บเริ่มต้นไม่มี ?tab ใน URL จึงต้องเทียบทั้งสองรูปแบบ
                          const current = location.pathname + location.search;
                          const childActive =
                            current === child.path ||
                            (child.path === location.pathname && location.search === "");
                          return (
                            <li key={child.path}>
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(child.path);
                                  onCloseMobile();
                                }}
                                className={cn(
                                  "w-full rounded-lg py-2 pl-4 text-left text-[13px] transition-colors duration-150",
                                  "border-l border-bo-ink-3",
                                  childActive
                                    ? "font-semibold text-white"
                                    : "text-slate-500 hover:text-slate-300",
                                )}
                              >
                                {child.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* บัญชีผู้ใช้ */}
          <div className="border-t border-bo-ink-3 px-3 py-4">
            {user && (
              <div className="mb-2 flex items-center gap-3 px-3 py-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-300">
                  <RoleIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-white">
                    {user.name || user.username}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {ROLE_LABEL[user.role]}
                  </span>
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/5 hover:text-rose-300"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
