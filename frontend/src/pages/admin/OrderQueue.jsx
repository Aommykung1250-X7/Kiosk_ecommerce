import React, { useState, useEffect, useRef } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  ClockIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { notify, confirmDialog } from "../../components/notify";
import AdminNavbar from "../../components/admin/AdminNavbar";
import CustomDropdown from "../../components/admin/CustomDropdown";

export const getOrderStatusInfo = (order) => {
  if (!order) {
    return {
      key: "pending",
      label: "รอดำเนินการ",
      badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
      dotColor: "bg-gray-400",
      emoji: "⏳"
    };
  }

  // 1. จัดการครบถ้วนแล้ว
  if (
    order.fulfillmentStatus === "fulfilled" ||
    (order.fulfillmentStatusInstock === "fulfilled" &&
      (order.fulfillmentStatusPreorder === "fulfilled" || order.fulfillmentStatusPreorder === "none"))
  ) {
    return {
      key: "fulfilled",
      label: order.deliveryOption === "delivery" ? "จัดส่งแล้ว" : "จ่ายของครบแล้ว",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotColor: "bg-emerald-500",
      emoji: "✅"
    };
  }

  // 2. รับหน้าร้าน (Pickup)
  if (order.deliveryOption === "pickup") {
    if (order.fulfillmentStatusInstock === "pending") {
      return {
        key: "waiting_pickup",
        label: "รอลูกค้ามารับ",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        dotColor: "bg-blue-500",
        emoji: "🏪"
      };
    }
    if (order.fulfillmentStatusPreorder === "pending") {
      return {
        key: "waiting_preorder",
        label: "รอสินค้าพรีออเดอร์",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        dotColor: "bg-purple-500",
        emoji: "📦"
      };
    }
  }

  // 3. จัดส่งพัสดุ (Delivery)
  if (order.deliveryOption === "delivery") {
    // ยังไม่ได้ระบุที่อยู่
    if (!order.customerAddress || order.customerAddress.trim() === "") {
      return {
        key: "waiting_address",
        label: "รอลูกค้าระบุที่อยู่",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotColor: "bg-rose-500",
        emoji: "📍"
      };
    }

    // แยกจัดส่ง (Split)
    if (order.shippingOption === "split") {
      if (order.fulfillmentStatusInstock === "pending") {
        return {
          key: "ready_to_ship",
          label: "รอการจัดส่ง (รอบ 1 In Stock)",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
          dotColor: "bg-amber-500",
          emoji: "🚚"
        };
      }
      if (order.fulfillmentStatusPreorder === "pending") {
        return {
          key: "partially_shipped",
          label: "จัดส่งแล้วบางส่วน (รอส่งรอบ 2)",
          badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
          dotColor: "bg-indigo-500",
          emoji: "🔄"
        };
      }
    } else {
      // ส่งรวม (Combined)
      const hasPreorder = order.items?.some(i => i.product && i.product.status === "Pre-Order");
      if (hasPreorder && order.fulfillmentStatusPreorder === "pending") {
        return {
          key: "waiting_preorder",
          label: "รอสินค้าพรีออเดอร์ (ส่งรวม)",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
          dotColor: "bg-purple-500",
          emoji: "📦"
        };
      }
      return {
        key: "ready_to_ship",
        label: "รอการจัดส่ง",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        dotColor: "bg-amber-500",
        emoji: "🚚"
      };
    }
  }

  return {
    key: "pending",
    label: "รอดำเนินการ",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    dotColor: "bg-gray-400",
    emoji: "⏳"
  };
};

const getLocalDateString = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const formatDMYDateString = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const getYesterdayDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const COURIER_OPTIONS = [
  { id: "thailandpost", name: "ไปรษณีย์ไทย (Prompt Post / EMS)", url: "https://promptpost.thailandpost.com/" },
  { id: "flash", name: "Flash Express", url: "https://www.flashexpress.co.th/booking/" },
  { id: "kerry", name: "Kerry Express / KEX", url: "https://th.express.kerryexpress.com/" },
  { id: "jnt", name: "J&T Express", url: "https://www.jtexpress.co.th/" }
];

export default function OrderQueue() {
  const [activeTab, setActiveTab] = useState("all"); // "all", "pickup", "delivery", "history"
  const [queueOrders, setQueueOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString()); // Default today
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "waiting_pickup", "ready_to_ship", "waiting_preorder", "partially_shipped", "waiting_address", "fulfilled"
  const [toasts, setToasts] = useState([]);
  const prevOrderIdsRef = useRef(new Set());

  // Fulfill modal state for delivery orders
  const [selectedFulfillOrder, setSelectedFulfillOrder] = useState(null);
  const [fulfillmentType, setFulfillmentType] = useState("preorder"); // "instock", "preorder", "combined"
  const [courier, setCourier] = useState("thailandpost");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [copiedField, setCopiedField] = useState(""); // "", "name", "phone", "address", "all"
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Helper checks
  const hasInStockItem = (order) => order.items && order.items.some(item => !item.product || item.product.status === 'In Stock');
  const hasPreOrderItem = (order) => order.items && order.items.some(item => item.product && item.product.status === 'Pre-Order');

  const handleFulfillPortion = async (orderId, portion) => {
    const portionName = portion === "instock" ? "สินค้าพร้อมส่ง (In Stock)" : "สินค้าสั่งซื้อล่วงหน้า (Pre-Order)";
    const confirmed = await confirmDialog({
      title: `ยืนยันจ่าย${portionName}?`,
      message: `ยืนยันการจัดจ่าย ${portionName} หน้าร้าน สำหรับออเดอร์ ${orderId} หรือไม่?`,
      confirmText: "ยืนยันการจ่าย",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      const endpoint = portion === "instock" ? "fulfill/instock" : "fulfill/preorder";
      const res = await fetch(`/api/orders/${orderId}/${endpoint}`, {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยันจ่ายสินค้า");
      }

      fetchData();
      notify.success(`ยืนยันการจ่าย ${portionName} หน้าร้านสำเร็จ!`);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleFulfillSingleItem = async (orderId, itemId, itemName) => {
    const confirmed = await confirmDialog({
      title: `ยืนยันการจ่ายสินค้า?`,
      message: `ยืนยันการจัดจ่ายสินค้า "${itemName}" สำหรับออเดอร์ ${orderId} หรือไม่?`,
      confirmText: "ยืนยันการจ่าย",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/orders/items/${itemId}/fulfill`, {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยันจ่ายสินค้า");
      }

      fetchData();
      notify.success(`ยืนยันการจ่าย "${itemName}" สำเร็จ!`);
    } catch (err) {
      notify.error(err.message);
    }
  };

  const fetchData = async () => {
    try {
      const headers = { credentials: "include" };
      const [queueRes, historyRes] = await Promise.all([
        fetch("/api/orders/queue", headers),
        fetch("/api/orders/history", headers)
      ]);

      if (!queueRes.ok || !historyRes.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลคิวสั่งซื้อได้");
      }

      const queueData = await queueRes.json();
      const historyData = await historyRes.json();

      setQueueOrders(queueData);
      setHistoryOrders(historyData);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      // Ding note (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Dong note (E5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn("Browser blocked audio play:", e);
    }
  };

  const addToast = (order) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, order }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!queueOrders || queueOrders.length === 0) return;

    const currentIds = queueOrders.map(o => o.id);

    // Initial load: populate ref without alerting
    if (prevOrderIdsRef.current.size === 0) {
      prevOrderIdsRef.current = new Set(currentIds);
      return;
    }

    // Find new queue orders
    const newArrivals = queueOrders.filter(o => !prevOrderIdsRef.current.has(o.id));

    if (newArrivals.length > 0) {
      playNotificationSound();
      newArrivals.forEach(order => {
        addToast(order);
        prevOrderIdsRef.current.add(order.id);
      });
    }

    // Clean up IDs that are no longer in the queue
    const currentIdSet = new Set(currentIds);
    for (const id of prevOrderIdsRef.current) {
      if (!currentIdSet.has(id)) {
        prevOrderIdsRef.current.delete(id);
      }
    }
  }, [queueOrders]);

  const handleFulfillInStock = async (orderId) => {
    const confirmed = await confirmDialog({
      title: "ยืนยันการจ่ายสินค้า?",
      message: `ยืนยันการจัดจ่ายสินค้าหน้าร้าน สำหรับออเดอร์ ${orderId} หรือไม่?`,
      confirmText: "ยืนยันการจ่าย",
      variant: "primary",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/fulfill`, {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยันจ่ายสินค้า");
      }

      fetchData();
      notify.success("ยืนยันการจ่ายสินค้าหน้าร้านสำเร็จ!");
    } catch (err) {
      notify.error(err.message);
    }
  };



  const handleCopyText = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleCopyForKerry = (order) => {
    if (!order) return;
    const kerryText = `${order.customerName || ""} ${order.customerPhone || ""}\n${order.customerAddress || ""}`;
    navigator.clipboard.writeText(kerryText);
    setCopiedField("kerry");
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleFulfillPreOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFulfillOrder) return;
    if (!trackingNumber.trim()) {
      notify.warning("กรุณากรอกเลขพัสดุก่อนยืนยันการจัดส่ง");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = fulfillmentType === "combined" 
        ? "combined" 
        : (fulfillmentType === "instock" ? "instock" : "preorder");
      
      const res = await fetch(`/api/orders/${selectedFulfillOrder.id}/fulfill/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          courier,
          trackingNumber: trackingNumber.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยันจัดส่งพัสดุ");
      }

      fetchData();
      setSelectedFulfillOrder(null);
      notify.success("ยืนยันการจัดส่งสินค้าและส่งอีเมลแจ้งเลขพัสดุให้ลูกค้าเรียบร้อยแล้ว!");
    } catch (err) {
      notify.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search filter
  const matchesSearch = (order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      (order.customerName && order.customerName.toLowerCase().includes(query)) ||
      (order.customerPhone && order.customerPhone.toLowerCase().includes(query)) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(query))
    );
  };

  // Date filter
  const matchesDate = (order) => {
    if (!selectedDate) return true;
    return getLocalDateString(order.createdAt) === selectedDate;
  };

  // Combined all orders for "all" tab
  const combinedAllOrders = [...queueOrders, ...historyOrders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Base lists for each tab (filtered by search and date)
  const allOrdersList = combinedAllOrders.filter(matchesSearch).filter(matchesDate);
  const pickupOrdersList = queueOrders
    .filter(order => order.deliveryOption === "pickup" && (order.fulfillmentStatusInstock === "pending" || order.fulfillmentStatusPreorder === "pending" || order.fulfillmentStatus === "pending"))
    .filter(matchesSearch)
    .filter(matchesDate);
  const deliveryOrdersList = queueOrders
    .filter(order => order.deliveryOption === "delivery" && (order.fulfillmentStatusInstock === "pending" || order.fulfillmentStatusPreorder === "pending" || order.fulfillmentStatus === "pending"))
    .filter(matchesSearch)
    .filter(matchesDate);
  const historyOrdersList = historyOrders.filter(matchesSearch).filter(matchesDate);

  // Get active tab base list
  const getTabBaseOrders = () => {
    switch (activeTab) {
      case "pickup":
        return pickupOrdersList;
      case "delivery":
        return deliveryOrdersList;
      case "history":
        return historyOrdersList;
      case "all":
      default:
        return allOrdersList;
    }
  };

  const currentTabBaseOrders = getTabBaseOrders();

  // Status counts for current tab
  const statusCounts = {
    all: currentTabBaseOrders.length,
    waiting_pickup: currentTabBaseOrders.filter(o => getOrderStatusInfo(o).key === "waiting_pickup").length,
    ready_to_ship: currentTabBaseOrders.filter(o => getOrderStatusInfo(o).key === "ready_to_ship").length,
    waiting_preorder: currentTabBaseOrders.filter(o => getOrderStatusInfo(o).key === "waiting_preorder").length,
    partially_shipped: currentTabBaseOrders.filter(o => getOrderStatusInfo(o).key === "partially_shipped").length,
    waiting_address: currentTabBaseOrders.filter(o => getOrderStatusInfo(o).key === "waiting_address").length,
    fulfilled: currentTabBaseOrders.filter(o => getOrderStatusInfo(o).key === "fulfilled").length
  };

  // Apply status filter
  const currentDisplayOrders = currentTabBaseOrders.filter(order => {
    if (statusFilter === "all") return true;
    return getOrderStatusInfo(order).key === statusFilter;
  });

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Prompt'] flex flex-col">
      {/* Top Navigation Navbar */}
      <AdminNavbar
        title="ระบบคิวรับสินค้าหน้าร้าน"
        subtitle="พนักงานร้านค้า CAMT คัดแยกของ"
        icon={ClipboardDocumentListIcon}
      />

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

        {/* Search & Date Filter Area */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search box */}
            <div className="relative w-full sm:max-w-md flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="สแกนหรือค้นหารหัส Order ID หรือชื่อลูกค้า"
                className="w-full h-11 bg-gray-50 border border-gray-100 hover:border-gray-200 focus:border-[#F8C032] rounded-xl pl-12 pr-4 text-sm outline-none transition-all"
              />
            </div>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-5 h-11 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-600 transition-all shrink-0 w-full sm:w-auto justify-center"
            >
              <ArrowPathIcon className="w-4 h-4" />
              รีเฟรชข้อมูลคิว
            </button>
          </div>

          {/* Date Filter Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              กรองคิววันที่:
            </span>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedDate(getTodayDateString())}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedDate === getTodayDateString()
                    ? "bg-[#F8C032] text-[#2B2B2B] shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150"
                }`}
              >
                วันนี้
              </button>
              
              <button
                onClick={() => setSelectedDate(getYesterdayDateString())}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedDate === getYesterdayDateString()
                    ? "bg-[#F8C032] text-[#2B2B2B] shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150"
                }`}
              >
                เมื่อวาน
              </button>

              <button
                onClick={() => setSelectedDate("")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedDate === ""
                    ? "bg-[#F8C032] text-[#2B2B2B] shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150"
                }`}
              >
                ทั้งหมด
              </button>

              {/* Custom Date Input */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-150 rounded-lg text-gray-700 focus:border-[#F8C032] outline-none cursor-pointer"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-650 rounded-lg transition-all cursor-pointer"
                    title="ล้างตัวกรองวันที่"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Status Filter Row */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <FunnelIcon className="w-3.5 h-3.5" />
              กรองสถานะ:
            </span>
            
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "all", label: "ทั้งหมด", count: statusCounts.all },
                { key: "waiting_pickup", label: "🏪 รอลูกค้ามารับ", count: statusCounts.waiting_pickup },
                { key: "ready_to_ship", label: "🚚 รอการจัดส่ง", count: statusCounts.ready_to_ship },
                { key: "waiting_preorder", label: "📦 รอสินค้าพรีออเดอร์", count: statusCounts.waiting_preorder },
                { key: "partially_shipped", label: "🔄 จัดส่งแล้วบางส่วน", count: statusCounts.partially_shipped },
                { key: "waiting_address", label: "📍 รอลูกค้าระบุที่อยู่", count: statusCounts.waiting_address },
                { key: "fulfilled", label: "✅ จ่ายของครบ/ส่งแล้ว", count: statusCounts.fulfilled }
              ]
                .filter(chip => chip.key === "all" || chip.count > 0 || activeTab === "all")
                .map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setStatusFilter(chip.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === chip.key
                        ? "bg-[#2B2B2B] text-white shadow-xs"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-150"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                      statusFilter === chip.key
                        ? "bg-[#F8C032] text-[#2B2B2B]"
                        : "bg-gray-200/80 text-gray-600"
                    }`}>
                      {chip.count}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* 4-Tab Navigation System with Real-Time Counts */}
        <div className="flex border-b border-gray-200 gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => handleTabChange("all")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === "all" ? "text-[#F8C032]" : "text-gray-400 hover:text-gray-650"
              }`}
          >
            <span>คิวทั้งหมด ({allOrdersList.length})</span>
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8C032] rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("pickup")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === "pickup" ? "text-[#F8C032]" : "text-gray-400 hover:text-gray-650"
              }`}
          >
            <span>🏪 รับหน้าร้าน ({pickupOrdersList.length})</span>
            {activeTab === "pickup" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8C032] rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("delivery")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === "delivery" ? "text-[#F8C032]" : "text-gray-400 hover:text-gray-650"
              }`}
          >
            <span>🚚 จัดส่งพัสดุ ({deliveryOrdersList.length})</span>
            {activeTab === "delivery" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8C032] rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("history")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === "history" ? "text-[#F8C032]" : "text-gray-400 hover:text-gray-650"
              }`}
          >
            <span>ประวัติการจ่ายสินค้า ({historyOrdersList.length})</span>
            {activeTab === "history" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8C032] rounded-full"></span>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Orders Queue Grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-400 font-medium">
            <ArrowPathIcon className="w-8 h-8 animate-spin" />
          </div>
        ) : currentDisplayOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-150 shadow-sm gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
              <CheckIcon className="w-10 h-10" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-gray-700">
                {statusFilter !== "all" 
                  ? "ไม่มีออเดอร์ในสถานะที่เลือก"
                  : activeTab === "all" && "ไม่มีรายการคำสั่งซื้อค้างส่ง"}
                {statusFilter === "all" && activeTab === "pickup" && "ไม่มีคิวรับหน้าร้านค้างจ่าย"}
                {statusFilter === "all" && activeTab === "delivery" && "ไม่มีคิวจัดส่งสินค้าค้างจัดส่ง"}
                {statusFilter === "all" && activeTab === "history" && "ไม่มีประวัติการจ่ายสินค้าสำเร็จ"}
              </h3>
              <p className="text-sm text-gray-400 px-6">
                {statusFilter !== "all" 
                  ? "ลองเปลี่ยนตัวกรองสถานะ หรือล้างตัวกรองเพื่อดูรายการทั้งหมด"
                  : activeTab === "all" && "ออเดอร์ที่จ่ายเงินสำเร็จแต่มีสถานะค้างจ่ายจะแสดงที่นี่"}
                {statusFilter === "all" && activeTab === "pickup" && "ออเดอร์ที่เลือกรับสินค้าหน้าร้านจะแสดงที่นี่"}
                {statusFilter === "all" && activeTab === "delivery" && "ออเดอร์ที่จัดส่งพัสดุจะแสดงที่นี่"}
                {statusFilter === "all" && activeTab === "history" && "ประวัติคำสั่งซื้อทั้งหมดที่ดำเนินการจัดส่งเรียบร้อยแล้ว"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDisplayOrders.map((order) => {
              const displayItems = order.items || [];
              const statusInfo = getOrderStatusInfo(order);
              const totalItemsQty = displayItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="bg-gray-50/70 p-5 border-b border-gray-100 flex flex-col gap-2">
                    {/* Row 1: Delivery Option Tag (บรรทัดบน) */}
                    <div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${
                        order.deliveryOption === "delivery"
                          ? (order.shippingOption === "split" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-blue-50 text-blue-700 border-blue-200")
                          : "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {order.deliveryOption === "delivery"
                          ? (order.shippingOption === "split" ? "🚚 ให้จัดส่งพัสดุ (แยกส่ง)" : "🚚 ให้จัดส่งพัสดุ")
                          : "🏪 รับที่นี่"}
                      </span>
                    </div>

                    {/* Row 2: Status Badge (อีกบรรทัดเป็นสถานะ) */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${statusInfo.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} ${statusInfo.key !== "fulfilled" ? "animate-pulse" : ""}`} />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Row 3: Order ID, Time & Total Price Highlight */}
                    <div className="flex items-end justify-between gap-2 pt-2 border-t border-gray-200/60 mt-1">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-700 font-mono select-all truncate" title={order.id}>
                          {order.id}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          เวลาสั่งซื้อ: {order.createdAt ? new Date(order.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"} น.
                        </span>
                      </div>

                      {/* Total Price Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          ยอดรวม
                        </span>
                        <span className="text-sm font-extrabold text-[#2B2B2B] bg-[#F8C032]/25 px-2.5 py-0.5 rounded-lg border border-[#F8C032]/50 shadow-2xs">
                          ฿{Number(order.totalPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items details */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          รายการสินค้า ({displayItems.length} รายการ) รวม {totalItemsQty} ชิ้น
                        </span>
                      </div>

                      {/* Product Items Frame Container */}
                      <div className="border border-gray-200 bg-gray-50/70 rounded-2xl p-2.5 shadow-2xs">
                        <ul className="flex flex-col gap-2 h-[220px] overflow-y-auto pr-1">
                          {displayItems.map((item, index) => {
                            const isPreOrder = item.product?.status === "Pre-Order";
                            const relDateStr = isPreOrder ? (item.product?.preorder_release_date || item.product?.preorderReleaseDate) : null;
                            const isItemFulfilled = item.fulfillmentStatus === "fulfilled" || order.fulfillmentStatus === "fulfilled";

                            return (
                              <li key={index} className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs shrink-0">
                                {/* Left: Product Information */}
                                <div className="flex flex-col flex-1 pr-2">
                                  <span className="font-semibold text-gray-800 leading-snug">{item.product?.name || "สินค้า"}</span>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <span className={`text-[10px] font-bold ${isPreOrder ? 'text-orange-600' : 'text-green-600'}`}>
                                      ({isPreOrder ? 'Pre-Order' : 'In Stock'})
                                    </span>
                                    {isPreOrder && relDateStr && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                                        📅 รอของ {formatDMYDateString(relDateStr)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Quantity Badge + Confirm Button Underneath */}
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span className="font-bold text-[#E53935] px-2.5 py-0.5 bg-red-50 border border-red-150 rounded-lg text-xs">
                                    x{item.quantity}
                                  </span>

                                  {/* Item Action Button for Pickup Orders */}
                                  {order.deliveryOption === "pickup" && activeTab !== "history" && order.fulfillmentStatus !== "fulfilled" && (
                                    <div>
                                      {isItemFulfilled ? (
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                          <CheckIcon className="w-3 h-3" /> จ่ายแล้ว
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleFulfillSingleItem(order.id, item.id, item.product?.name || "สินค้า")}
                                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                                        >
                                          <CheckIcon className="w-3.5 h-3.5" /> ยืนยันจ่าย
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>

                    {/* Customer & Delivery Address details */}
                    {order.customerName && (
                      <div className="border-t border-gray-100 pt-2.5 flex flex-col gap-1 text-xs text-gray-500">
                        <p><span className="font-semibold text-gray-700">ผู้สั่งซื้อ:</span> {order.customerName}</p>
                        <p><span className="font-semibold text-gray-700">เบอร์โทร:</span> {order.customerPhone}</p>
                        {order.deliveryOption === "delivery" && (
                          <p className="mt-1 bg-amber-50/40 p-2 rounded-lg border border-amber-100/60 text-gray-600">
                            <span className="font-semibold text-[#2B2B2B]">ที่อยู่จัดส่ง:</span> {order.customerAddress || "รอลูกค้ากรอกที่อยู่ผ่านมือถือ..."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions based on activeTab & deliveryOptions */}
                  <div className="p-5 bg-gray-50/30 border-t border-gray-100 mt-auto min-h-[88px] flex flex-col justify-center">
                    {activeTab === "history" || order.fulfillmentStatus === "fulfilled" ? (
                      <div className="bg-[#E8F5E9] text-[#2E7D32] p-3.5 rounded-xl border border-[#C8E6C9] flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                          <CheckIcon className="w-5 h-5 stroke-[2.5]" />
                          <span>จัดเตรียมเรียบร้อยครบทุกรายการ</span>
                        </div>
                        {order.shipments && order.shipments.length > 0 && (
                          <div className="mt-1 border-t border-[#C8E6C9] pt-1.5 flex flex-col gap-1 text-xs">
                            {order.shipments.map((s, sIdx) => (
                              <div key={sIdx} className="flex justify-between items-center bg-white/60 p-2 rounded-lg font-mono">
                                <span>{s.courier_name || "พัสดุ"}:</span>
                                <span className="font-bold text-[#2B2B2B]">{s.tracking_number}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs font-medium text-[#2E7D32]/85 flex flex-col gap-0.5 mt-1 border-t border-[#C8E6C9] pt-1.5">
                          <p>ผู้ดำเนินการล่าสุด: {order.handlerName || "ไม่ระบุพนักงาน"}</p>
                          {order.fulfilledAt && (
                            <p>สำเร็จเมื่อ: {new Date(order.fulfilledAt).toLocaleString("th-TH")} น.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* ALL / PICKUP TAB - KIOSK PICKUP FLOW */}
                        {order.deliveryOption === "pickup" && (
                          <div className="flex flex-col gap-2">
                            {order.items && order.items.every(i => i.fulfillmentStatus === "fulfilled") ? (
                              <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-3 rounded-xl border border-emerald-200">
                                ✓ จ่ายสินค้าหน้าร้านครบทุกรายการแล้ว
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFulfillInStock(order.id)}
                                className="w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm border cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                              >
                                <CheckIcon className="w-4 h-4" />
                                ยืนยันจ่ายสินค้าที่เหลือทั้งหมด (หน้าร้าน)
                              </button>
                            )}
                          </div>
                        )}

                        {/* ALL / DELIVERY TAB - PARCEL DELIVERY FLOW */}
                        {order.deliveryOption === "delivery" && (
                          <div className="flex flex-col gap-2.5">
                            {/* 1. Split Delivery Option */}
                            {order.shippingOption === "split" ? (
                              <div className="flex flex-col gap-2">
                                {/* In-Stock Portion */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-gray-500 font-medium">ส่วน In Stock:</span>
                                  {order.fulfillmentStatusInstock === "fulfilled" ? (
                                    <span className="text-xs font-bold text-green-600">✓ ส่งพัสดุแล้ว</span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedFulfillOrder(order);
                                        setFulfillmentType("instock");
                                        setCourier("thailandpost");
                                        setTrackingNumber(order.trackingNumber1 || "");
                                        setCopiedField("");
                                      }}
                                      disabled={!order.customerAddress}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border cursor-pointer
                                        ${order.customerAddress 
                                          ? "bg-[#F8C032] text-[#2B2B2B] border-[#F8C032]/40 hover:bg-[#F0B420]" 
                                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
                                    >
                                      เตรียมการจัดส่ง In Stock
                                    </button>
                                  )}
                                </div>

                                {/* Pre-Order Portion */}
                                <div className="flex items-center justify-between gap-2 border-t border-gray-150/70 pt-2">
                                  <span className="text-xs text-gray-500 font-medium">ส่วน Pre-Order:</span>
                                  {order.fulfillmentStatusPreorder === "fulfilled" ? (
                                    <span className="text-xs font-bold text-green-600">✓ ส่งพัสดุแล้ว</span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedFulfillOrder(order);
                                        setFulfillmentType("preorder");
                                        setCourier("thailandpost");
                                        setTrackingNumber(order.trackingNumber2 || "");
                                        setCopiedField("");
                                      }}
                                      disabled={!order.customerAddress}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border cursor-pointer
                                        ${order.customerAddress 
                                          ? "bg-[#F8C032] text-[#2B2B2B] border-[#F8C032]/40 hover:bg-[#F0B420]" 
                                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
                                    >
                                      เตรียมการจัดส่ง Pre-Order
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* 2. Combined Delivery Option */
                              <div className="flex flex-col gap-2">
                                {order.fulfillmentStatusPreorder === "fulfilled" && order.fulfillmentStatusInstock === "fulfilled" ? (
                                  <div className="text-center text-xs font-bold text-green-600 bg-green-50 py-3 rounded-xl border border-green-150">
                                    ✓ จัดส่งพัสดุรวมกันครบถ้วนแล้ว
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedFulfillOrder(order);
                                      setFulfillmentType("combined");
                                      setCourier("thailandpost");
                                      setTrackingNumber(order.trackingNumber1 || "");
                                      setCopiedField("");
                                    }}
                                    disabled={!order.customerAddress}
                                    className={`w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border cursor-pointer
                                      ${order.customerAddress 
                                        ? "bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] border-[#F8C032]/40" 
                                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
                                  >
                                    <CheckIcon className="w-5 h-5" />
                                    เตรียมการจัดส่ง
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Manual Shipping Fulfillment Modal */}
      {selectedFulfillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-extrabold text-[#2B2B2B] text-base flex items-center gap-2">
                  <span>🚚 เตรียมการจัดส่งสินค้า</span>
                  <span className="text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {fulfillmentType === "instock" 
                      ? "สินค้า In Stock" 
                      : fulfillmentType === "combined" 
                        ? "รวมสินค้าทั้งหมด" 
                        : "สินค้า Pre-Order"}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5 select-all">ออเดอร์ ID: {selectedFulfillOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedFulfillOrder(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFulfillPreOrderSubmit} className="flex flex-col gap-4">
              {/* Delivery Address Summary with Conditional Kerry Auto-Fill Button */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 text-xs text-gray-700 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2 mb-0.5">
                  <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    📍 ข้อมูลสำหรับกรอกส่งสินค้า
                  </span>

                  {courier === "kerry" ? (
                    /* Kerry Express Auto-Fill Copy Button (Shown ONLY when Kerry is selected) */
                    <button
                      type="button"
                      onClick={() => handleCopyForKerry(selectedFulfillOrder)}
                      title="คัดลอกรูปแบบ Kerry Express เพื่อวางในช่อง 'กรอกข้อมูลอัตโนมัติ'"
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow-2xs cursor-pointer border border-orange-700"
                    >
                      {copiedField === "kerry" ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>คัดลอกแบบ Kerry แล้ว!</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ คัดลอกสำหรับ Kerry Auto-Fill</span>
                        </>
                      )}
                    </button>
                  ) : (
                    /* Standard Copy Button for other couriers */
                    <button
                      type="button"
                      onClick={() => {
                        const fullText = `ชื่อผู้รับ: ${selectedFulfillOrder.customerName || "-"}\nเบอร์โทร: ${selectedFulfillOrder.customerPhone || "-"}\nที่อยู่จัดส่ง: ${selectedFulfillOrder.customerAddress || "-"}`;
                        handleCopyText(fullText, "all");
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                    >
                      {copiedField === "all" ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>คัดลอกเรียบร้อยแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>คัดลอกข้อมูลที่อยู่</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p><span className="font-bold text-gray-800">ชื่อผู้รับ:</span> {selectedFulfillOrder.customerName || "-"}</p>
                <p><span className="font-bold text-gray-800">เบอร์โทร:</span> {selectedFulfillOrder.customerPhone || "-"}</p>
                <p><span className="font-bold text-gray-800">ที่อยู่จัดส่ง:</span> {selectedFulfillOrder.customerAddress || "-"}</p>
              </div>

              {/* Courier Selection & Portal External Link */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">1. เลือกบริการขนส่ง (Courier)</label>
                <CustomDropdown
                  value={courier}
                  onChange={(val) => setCourier(val)}
                  options={COURIER_OPTIONS.map(c => ({
                    value: c.id,
                    label: c.name
                  }))}
                />

                {/* Direct Link to Courier Portal */}
                {(() => {
                  const selectedOption = COURIER_OPTIONS.find(c => c.id === courier) || COURIER_OPTIONS[0];
                  return (
                    <a
                      href={selectedOption.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-between transition-colors shadow-2xs group cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🌐 ไปที่หน้ากรอกข้อมูลจัดส่งของ {selectedOption.name}</span>
                      </span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                })()}
              </div>

              {/* Manual Tracking Number Input */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                  <span>2. กรอกเลขพัสดุจากขนส่ง (Tracking Number)</span>
                  <span className="text-red-500 font-normal text-[10px]">*จำเป็นต้องกรอก</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                  placeholder="ตัวอย่าง: TH0123456789 หรือ EF123456789TH"
                  className="w-full h-11 bg-white border border-gray-300 rounded-xl px-4 text-sm font-mono outline-none focus:border-[#F8C032] focus:ring-2 focus:ring-[#F8C032]/20"
                />
              </div>

              {/* Actions Grid */}
              <div className="pt-3 border-t border-gray-100 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการจัดส่ง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Toast Notifications Stack (แจ้งเตือนออเดอร์ใหม่จาก SSE)
          วางไว้มุมล่างขวา เพื่อไม่ให้ชนกับระบบแจ้งเตือนกลาง (notify) ที่อยู่มุมบนขวา */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border-l-4 border-amber-500 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 transition-all duration-300 transform translate-x-0 animate-slide-in"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 animate-bounce">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800">มีออเดอร์ใหม่เข้ามา!</h4>
              <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                REF: {String(t.order?.id || "").slice(-4)} ({t.order?.id})
              </p>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                ยอดรวม: ฿{Number(t.order.totalPrice || t.order.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-gray-650 transition-colors p-1 cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Custom Styles for Toast Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
