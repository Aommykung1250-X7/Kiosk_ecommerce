// frontend/src/components/admin/AdminNavbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function AdminNavbar({ title, subtitle, icon: IconComponent }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const userString = localStorage.getItem("user");
      if (userString) {
        setCurrentUser(JSON.parse(userString));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    localStorage.removeItem("user");
    navigate("/ditc-portal-to-manager");
  };

  const navItems = [
    {
      label: "คลังสินค้า",
      path: "/dashboard/products",
      icon: Squares2X2Icon,
      adminOnly: true,
    },
    {
      label: "จัดการคิว",
      path: "/dashboard/orders",
      icon: ClipboardDocumentListIcon,
      adminOnly: false,
    },
    {
      label: "จัดการโฆษณา",
      path: "/dashboard/screensavers",
      icon: PhotoIcon,
      adminOnly: true,
    },
    {
      label: "ออกรายงานสรุป",
      path: "/dashboard/reports",
      icon: DocumentChartBarIcon,
      adminOnly: true,
    },
  ];

  const isAdmin = currentUser?.role === "admin";
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs sticky top-0 z-30 font-['Prompt']">
      {/* Brand & Page Info */}
      <div className="flex items-center gap-3">
        {IconComponent && (
          <div className="w-10 h-10 bg-[#F8C032]/15 text-[#2B2B2B] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
            <IconComponent className="w-6 h-6 text-[#2B2B2B]" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-[#2B2B2B] leading-tight">
            {title || "ระบบจัดการหลังบ้าน"}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Navigation Buttons & Actions */}
      <div className="flex items-center flex-wrap gap-2 md:gap-2.5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-150 rounded-2xl">
          {visibleNavItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  if (!isActive) {
                    navigate(item.path);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#F8C032] text-[#2B2B2B] font-bold shadow-xs border border-amber-400/40"
                    : "text-gray-600 hover:text-[#2B2B2B] hover:bg-gray-200/80 font-medium"
                }`}
                title={item.label}
              >
                <ItemIcon className={`w-4.5 h-4.5 ${isActive ? "text-[#2B2B2B]" : "text-gray-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Info (Hidden on small screens) */}
        {currentUser && (
          <div className="hidden xl:flex flex-col text-right px-2">
            <span className="text-xs font-bold text-gray-700 leading-tight truncate max-w-[120px]">
              {currentUser.name || currentUser.username}
            </span>
            <span className="text-[10px] text-gray-400 font-medium uppercase">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-red-600 font-semibold bg-red-50 hover:bg-red-100/80 border border-red-150 rounded-xl transition-all duration-150 cursor-pointer ml-1"
          title="ออกจากระบบ"
        >
          <ArrowRightOnRectangleIcon className="w-4.5 h-4.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </nav>
  );
}
