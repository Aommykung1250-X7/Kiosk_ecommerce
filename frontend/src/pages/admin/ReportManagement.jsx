import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentChartBarIcon,
  Squares2X2Icon,
  CalendarIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  TvIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import AdminNavbar from "../../components/admin/AdminNavbar";

export default function ReportManagement() {
  const navigate = useNavigate();

  // Helper สำหรับดึงวันที่รูปแบบ YYYY-MM-DD ตามเวลาท้องถิ่น
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State สำหรับการกรองข้อมูล
  const [activeTab, setActiveTab] = useState("sales"); // 'sales' | 'products' | 'kiosk'
  const [datePreset, setDatePreset] = useState("30days"); // 'today' | '7days' | '30days' | 'all' | 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State ข้อมูลสรุป KPI และ Data Preview
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  // State สำหรับการเปิด/ปิด Dropdown รายการออเดอร์ในตารางแนวโน้ม
  const [expandedDates, setExpandedDates] = useState(new Set());

  const toggleDateExpand = (date) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  // ตรวจสอบสิทธิ์ผู้ดูแลระบบ (Admin)
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role !== "admin") {
          navigate("/unauthorized");
        }
      } catch {
        navigate("/ditc-portal-to-manager");
      }
    } else {
      navigate("/ditc-portal-to-manager");
    }
  }, [navigate]);

  // ปรับตั้งค่า วันที่ตาม Preset เลือกด่วน
  useEffect(() => {
    const today = new Date();

    if (datePreset === "today") {
      const todayStr = getLocalDateString(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (datePreset === "7days") {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setStartDate(getLocalDateString(past7));
      setEndDate(getLocalDateString(today));
    } else if (datePreset === "30days") {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      setStartDate(getLocalDateString(past30));
      setEndDate(getLocalDateString(today));
    } else if (datePreset === "all") {
      setStartDate("");
      setEndDate("");
    }
  }, [datePreset]);

  // ดึงข้อมูลสถิติภาพรวมเมื่อมีการเปลี่ยนตัวกรอง
  useEffect(() => {
    fetchSummaryStats();
  }, [startDate, endDate]);

  const fetchSummaryStats = async () => {
    setLoading(true);
    setError("");
    try {
      let query = "";
      if (startDate && endDate) {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(`/api/admin/reports/summary${query}`, {
        credentials: "include"
      });

      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลรายงานได้");
      const result = await res.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching report stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการ Export รายงาน
  const handleExport = (exportFormat) => {
    let url = `/api/admin/reports/export?type=${activeTab}&format=${exportFormat}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    if (exportFormat === "pdf") {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Prompt'] flex flex-col">
      {/* Top Navbar */}
      <AdminNavbar
        title="รายงานสรุปและการวิเคราะห์ข้อมูล"
        subtitle="ระบบส่งออกรายงานสรุปสำหรับหน่วยงานและผู้บริหาร"
        icon={DocumentChartBarIcon}
      />

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {/* Section 1: Filter & Action Header Bar */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <AdjustmentsHorizontalIcon className="w-4 h-4" /> ช่วงเวลา:
            </span>
            <button
              onClick={() => setDatePreset("today")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                datePreset === "today"
                  ? "bg-[#1B1B1C] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => setDatePreset("7days")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                datePreset === "7days"
                  ? "bg-[#1B1B1C] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              7 วันล่าสุด
            </button>
            <button
              onClick={() => setDatePreset("30days")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                datePreset === "30days"
                  ? "bg-[#1B1B1C] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              30 วันล่าสุด
            </button>
            <button
              onClick={() => setDatePreset("all")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                datePreset === "all"
                  ? "bg-[#1B1B1C] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
          </div>

          {/* Date Picker Custom */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-2xl text-xs font-medium text-gray-700">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="bg-transparent outline-none cursor-pointer"
              />
              <span className="text-gray-400">ถึง</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="bg-transparent outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={fetchSummaryStats}
              title="รีเฟรชข้อมูล"
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all cursor-pointer"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Section 2: Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-[#1B1B1C] to-gray-800 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">รายได้รวมทั้งหมด</span>
              <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <BanknotesIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-emerald-400">
                ฿{stats ? stats.totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "0.00"}
              </span>
              <p className="text-[11px] text-gray-400 mt-1">ยอดโอนสำเร็จผ่าน Payment Gateway</p>
            </div>
          </div>

          {/* Paid Orders Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ออเดอร์ชำระเงินสำเร็จ</span>
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <ShoppingBagIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-[#1B1B1C]">
                {stats ? stats.paidOrdersCount.toLocaleString() : "0"} <span className="text-sm font-normal text-gray-400">รายการ</span>
              </span>
              <p className="text-[11px] text-gray-400 mt-1">รายการสั่งซื้อที่ชำระเงินเรียบร้อยแล้ว</p>
            </div>
          </div>

          {/* Kiosk Wakeups Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">จำนวนผู้เปิดใช้งานตู้</span>
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <TvIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-[#1B1B1C]">
                {stats ? stats.totalWakeups.toLocaleString() : "0"} <span className="text-sm font-normal text-gray-400">ครั้ง</span>
              </span>
              <p className="text-[11px] text-gray-400 mt-1">จำนวนครั้งที่ตู้ Kiosk ถูกแตะเริ่มใช้งาน</p>
            </div>
          </div>

          {/* Products Stock Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">รายการสินค้าในคลัง</span>
              <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Squares2X2Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-[#1B1B1C]">
                {stats ? stats.totalProducts : "0"} <span className="text-sm font-normal text-gray-400">รายการ</span>
              </span>
              <p className="text-[11px] text-gray-500 font-bold mt-1">
                {stats && stats.lowStockCount > 0 ? (
                  <span className="text-red-500 font-extrabold">⚠️ สินค้าใกล้หมด {stats.lowStockCount} รายการ</span>
                ) : (
                  <span className="text-emerald-600">✓ ระดับสต็อกสินค้าปกติ</span>
                )}
              </p>
            </div>
          </div>

        </div>

        {/* Section 3: Report Category Tabs & Export Buttons */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveTab("sales")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "sales"
                    ? "bg-white text-[#1B1B1C] shadow-xs"
                    : "text-gray-500 hover:text-[#1B1B1C]"
                }`}
              >
                📊 สรุปยอดขายและการเงิน
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "products"
                    ? "bg-white text-[#1B1B1C] shadow-xs"
                    : "text-gray-500 hover:text-[#1B1B1C]"
                }`}
              >
                📦 ประสิทธิภาพสินค้า & สต็อก
              </button>

              <button
                onClick={() => setActiveTab("kiosk")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "kiosk"
                    ? "bg-white text-[#1B1B1C] shadow-xs"
                    : "text-gray-500 hover:text-[#1B1B1C]"
                }`}
              >
                🖥️ สถิติการใช้งานตู้ Kiosk
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleExport("excel")}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>ดาวน์โหลด Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => handleExport("csv")}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>ดาวน์โหลด CSV (.csv)</span>
              </button>

              <button
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <DocumentChartBarIcon className="w-4 h-4" />
                <span>พิมพ์ PDF Report</span>
              </button>
            </div>

          </div>

          {/* Section 4: Data Preview Area */}
          <div>
            {loading ? (
              <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-[#5EBAA8]" />
                <span className="text-xs font-bold">กำลังประมวลผลข้อมูลรายงาน...</span>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-500 text-xs font-bold">{error}</div>
            ) : (
              <div>
                {/* Tab 1: Sales Preview */}
                {activeTab === "sales" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1B1B1C]">สรุปสถิติช่องทางการรับสินค้า (Fulfillment Breakdown)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats && stats.deliveryBreakdown && stats.deliveryBreakdown.length > 0 ? (
                        stats.deliveryBreakdown.map((item, idx) => (
                          <div key={idx} className="p-5 bg-gray-50/80 rounded-2xl border border-gray-200 flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                                item.delivery_option === "delivery" ? "bg-blue-100/70 text-blue-700" : "bg-emerald-100/70 text-emerald-700"
                              }`}>
                                {item.delivery_option === "delivery" ? "🚚" : "🏪"}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                                  {item.delivery_option === "delivery" ? "จัดส่งพัสดุ (Delivery)" : "รับสินค้าที่นี่ (Pick Up)"}
                                </span>
                                <span className="text-xl font-black text-[#1B1B1C] mt-0.5 block">
                                  ฿{parseFloat(item.total_amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-gray-700 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs inline-block">
                                {item.order_count} ออเดอร์
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                          ยังไม่มีรายการชำระเงินสำเร็จในช่วงเวลานี้
                        </div>
                      )}
                    </div>

                    {/* Daily Revenue Trend Table Preview */}
                    <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="bg-gray-100 px-5 py-3.5 border-b border-gray-200 font-bold text-xs text-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>แนวโน้มยอดขายรายวัน (Daily Revenue)</span>
                          <span className="text-[10px] text-gray-400 font-normal hidden sm:inline">(คลิกที่แถวเพื่อดูรายการออเดอร์)</span>
                        </div>
                        <span className="text-gray-500">จำนวนวันที่มีข้อมูล: {stats && stats.dailyTrend ? stats.dailyTrend.length : 0} วัน</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase sticky top-0 z-10">
                            <tr>
                              <th className="py-3 px-3 w-10 text-center"></th>
                              <th className="py-3 px-4 text-left">วันที่</th>
                              <th className="py-3 px-4 text-center w-48">จำนวนคำสั่งซื้อ</th>
                              <th className="py-3 px-6 text-right w-48">ยอดขายรวม (บาท)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {stats && stats.dailyTrend && stats.dailyTrend.length > 0 ? (
                              stats.dailyTrend.map((row, i) => {
                                const isExpanded = expandedDates.has(row.date);
                                const orderList = Array.isArray(row.orders) ? row.orders : [];

                                return (
                                  <React.Fragment key={row.date || i}>
                                    <tr
                                      onClick={() => toggleDateExpand(row.date)}
                                      className={`cursor-pointer transition-colors select-none ${
                                        isExpanded ? "bg-amber-50/60 font-semibold" : "hover:bg-gray-50"
                                      }`}
                                    >
                                      <td className="py-3.5 px-3 text-center text-gray-400">
                                        {isExpanded ? (
                                          <ChevronDownIcon className="w-4 h-4 text-amber-600 transition-transform duration-200 mx-auto" />
                                        ) : (
                                          <ChevronRightIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-transform duration-200 mx-auto" />
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 font-bold text-gray-800 flex items-center gap-2">
                                        <span>{row.date}</span>
                                        {isExpanded && (
                                          <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                                            กำลังแสดงรายละเอียด
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 text-center">
                                        <span className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold min-w-[72px]">
                                          {row.orders_count} รายการ
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-6 text-right font-black text-emerald-600 text-sm">
                                        ฿{parseFloat(row.daily_revenue).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>

                                    {/* Expanded Sub-table */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan="4" className="p-0 bg-gray-50/80 border-b border-gray-200">
                                          <div className="p-4 space-y-2.5">
                                            <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
                                              <span className="flex items-center gap-1.5 text-gray-700">
                                                <span>📋 รายการคำสั่งซื้อวันที่ {row.date}</span>
                                                <span className="text-gray-400 font-normal">({orderList.length} ออเดอร์)</span>
                                              </span>
                                            </div>

                                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                                              <table className="w-full text-xs">
                                                <thead className="bg-gray-100/90 text-gray-600 font-bold border-b border-gray-200">
                                                  <tr>
                                                    <th className="py-3 px-5 text-left w-3/12">รหัสคำสั่งซื้อ (Order ID)</th>
                                                    <th className="py-3 px-4 text-center w-3/12">เวลาสั่งซื้อ</th>
                                                    <th className="py-3 px-4 text-center w-3/12">รูปแบบการรับของ</th>
                                                    <th className="py-3 px-6 text-right w-3/12">ยอดเงิน (บาท)</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                  {orderList.length > 0 ? (
                                                    orderList.map((ord, ordIdx) => (
                                                      <tr key={ord.id || ordIdx} className="hover:bg-amber-50/30 transition-colors">
                                                        <td className="py-3 px-5 font-mono font-bold text-gray-800">
                                                          <span className="truncate max-w-[280px] block" title={ord.id}>{ord.id}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-gray-500 font-medium">
                                                          {ord.created_at
                                                            ? new Date(ord.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
                                                            : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                          <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                            ord.delivery_option === 'delivery'
                                                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                              : 'bg-green-50 text-green-700 border border-green-200'
                                                          }`}>
                                                            {ord.delivery_option === 'delivery' ? '🚚 จัดส่งพัสดุ' : '🏪 รับที่นี่'}
                                                          </span>
                                                        </td>
                                                        <td className="py-3 px-6 text-right font-bold text-emerald-600 text-sm">
                                                          ฿{parseFloat(ord.total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                      </tr>
                                                    ))
                                                  ) : (
                                                    <tr>
                                                      <td colSpan="4" className="py-4 text-center text-gray-400">
                                                        ไม่พบรายการคำสั่งซื้อ
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                                  ไม่มีรายการยอดขายในช่วงเวลานี้
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Product Performance Preview Table */}
                {activeTab === "products" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1B1B1C]">ตารางสรุปประสิทธิภาพและการขายสินค้า (Product Sales & Conversion)</h3>
                    </div>

                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold uppercase sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-center w-16">ID</th>
                              <th className="px-5 py-3 text-left">ชื่อสินค้า</th>
                              <th className="px-4 py-3 text-center w-28">หมวดหมู่</th>
                              <th className="px-4 py-3 text-right w-24">ราคา (บาท)</th>
                              <th className="px-4 py-3 text-center w-24">คงเหลือ (ชิ้น)</th>
                              <th className="px-4 py-3 text-center w-24">ยอดดู (Views)</th>
                              <th className="px-4 py-3 text-center w-24">ขายได้ (ชิ้น)</th>
                              <th className="px-5 py-3 text-right w-32">รายได้รวม (บาท)</th>
                              <th className="px-4 py-3 text-center w-24">Conversion</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {stats && stats.productReportList && stats.productReportList.length > 0 ? (
                              stats.productReportList.map((prod) => (
                                <tr key={prod.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2.5 text-center font-bold text-gray-500">{prod.id}</td>
                                  <td className="px-5 py-2.5 font-bold text-gray-900">{prod.name}</td>
                                  <td className="px-4 py-2.5 text-center text-gray-500">{prod.category}</td>
                                  <td className="px-4 py-2.5 text-right font-medium">฿{prod.price.toFixed(2)}</td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] inline-block ${
                                      prod.stock <= 0 ? "bg-red-100 text-red-700" : prod.stock <= 5 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
                                    }`}>
                                      {prod.stock}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-gray-600">{prod.views}</td>
                                  <td className="px-4 py-2.5 text-center font-bold text-[#1B1B1C]">{prod.unitsSold}</td>
                                  <td className="px-5 py-2.5 text-right font-black text-emerald-600">
                                    ฿{prod.totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-2.5 text-center font-bold text-blue-600">{prod.conversionRate}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                                  ไม่มีข้อมูลสินค้าในระบบ
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Kiosk Traffic Preview Table */}
                {activeTab === "kiosk" && (
                  <div className="space-y-6">
                    {/* Tags section */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                        <TagIcon className="w-4 h-4 text-amber-500" /> คำค้นหายอดนิยมบนหน้าตู้ (Popular Search Tags)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {stats && stats.popularTags && stats.popularTags.length > 0 ? (
                          stats.popularTags.map((tag, idx) => (
                            <span key={idx} className="bg-white border border-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded-xl shadow-2xs">
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">ไม่มีข้อมูลคำค้นหา</span>
                        )}
                      </div>
                    </div>

                    {/* Hourly distribution table */}
                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="bg-gray-100 px-5 py-3.5 border-b border-gray-200 font-bold text-xs text-gray-700">
                        สถิติคำสั่งซื้อและการชำระเงินตามช่วงเวลาของวัน (Hourly Traffic Distribution)
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-left w-1/3">ช่วงเวลา (ชั่วโมง)</th>
                              <th className="px-6 py-3 text-center w-1/3">จำนวนคำสั่งซื้อ</th>
                              <th className="px-6 py-3 text-right w-1/3">ยอดเงินรวม (บาท)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {stats && stats.hourlyDistribution && stats.hourlyDistribution.length > 0 ? (
                              stats.hourlyDistribution.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-6 py-3 font-bold text-gray-800 text-left">{item.hour}</td>
                                  <td className="px-6 py-3 text-center font-bold text-[#1B1B1C]">{item.orders} รายการ</td>
                                  <td className="px-6 py-3 text-right font-black text-emerald-600">
                                    ฿{item.revenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-gray-400">
                                  ไม่มีรายการชำระเงินตามช่วงเวลาสำหรับวันที่เลือก
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
