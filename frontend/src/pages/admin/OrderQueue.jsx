// frontend/src/pages/admin/OrderQueue.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowPathIcon, CheckIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon, XMarkIcon, Squares2X2Icon, PhotoIcon } from "@heroicons/react/24/outline";

const getLocalDateString = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
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

export default function OrderQueue() {
  const [queueOrders, setQueueOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all", "instock", "preorder", "history"
  const [selectedSlipUrl, setSelectedSlipUrl] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString()); // Defaults to today's date string
  const [toasts, setToasts] = useState([]);
  const prevOrderIdsRef = useRef(new Set());
  const navigate = useNavigate();

  // Shipping Modal states
  const [selectedFulfillOrder, setSelectedFulfillOrder] = useState(null);
  const [fulfillmentType, setFulfillmentType] = useState("preorder"); // "instock", "preorder", "combined"
  const [courier, setCourier] = useState("thailandpost");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [autoBook, setAutoBook] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeSlipPreview = () => {
    if (selectedSlipUrl && selectedSlipUrl.startsWith("blob:")) {
      URL.revokeObjectURL(selectedSlipUrl);
    }
    setSelectedSlipUrl(null);
  };

  const handleOpenSlipPreview = async (slipUrl) => {
    if (!slipUrl) return;

    try {
      const response = await fetch(slipUrl, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Unable to load slip image");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setSelectedSlipUrl(objectUrl);
    } catch (err) {
      setError("ไม่สามารถเปิดภาพสลิปได้ในขณะนี้");
    }
  };

  // Helper checks
  const hasInStockItem = (order) => order.items.some(item => item.product && item.product.status === 'In Stock');
  const hasPreOrderItem = (order) => order.items.some(item => item.product && item.product.status === 'Pre-Order');



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
    const userString = localStorage.getItem("user");
    if (userString) {
      setCurrentUser(JSON.parse(userString));
    }

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
    if (!window.confirm(`ยืนยันการจัดจ่ายสินค้าพร้อมส่งหน้าร้าน สำหรับออเดอร์ ${orderId} หรือไม่?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/fulfill/instock`, {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยันจ่ายสินค้า");
      }

      fetchData();
      alert("ยืนยันการจ่ายสินค้าพร้อมส่งหน้าร้านสำเร็จ!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrintLabel = () => {
    if (!selectedFulfillOrder) return;
    const order = selectedFulfillOrder;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิดป๊อปอัปเพื่อแสดงใบแปะหน้ากล่อง");
      return;
    }

    const courierMap = {
      thailandpost: "ไปรษณีย์ไทย (EMS)",
      flash: "Flash Express",
      kerry: "Kerry Express",
      jt: "J&T Express"
    };

    const courierName = courierMap[courier] || "บริการจัดส่งทั่วไป";
    let trackingText = autoBook ? "จองพัสดุผ่านระบบ (MOCK API)" : (trackingNumber || "รอดำเนินการ");

    const recipientName = order.customerName || "ไม่ระบุชื่อ";
    const recipientPhone = order.customerPhone || "N/A";
    const recipientAddress = order.customerAddress || "ไม่ระบุที่อยู่";

    const packItemsHtml = order.items
      .map(item => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 6px 0; font-size: 13px;">${item.product?.name || "สินค้า"}</td>
          <td style="text-align: center; font-weight: bold; font-size: 13px;">x${item.quantity}</td>
        </tr>
      `)
      .join("");

    const isChiangMai = recipientAddress.includes("เชียงใหม่");

    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label - Order #${order.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Prompt', sans-serif;
              margin: 0;
              padding: 20px;
              color: #000;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
            }
            .label-container {
              width: 100%;
              max-width: 400px;
              margin: 0 auto;
              border: 3px double #000;
              padding: 15px;
              box-sizing: border-box;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .courier-badge {
              font-size: 16px;
              font-weight: 800;
              border: 2px solid #000;
              padding: 4px 8px;
              text-transform: uppercase;
              background-color: #000;
              color: #fff;
            }
            .order-ref {
              font-size: 11px;
              font-weight: bold;
              font-family: monospace;
            }
            .address-box {
              font-size: 12px;
              line-height: 1.4;
              margin-bottom: 15px;
            }
            .sender {
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .recipient {
              font-size: 14px;
            }
            .recipient strong {
              font-size: 16px;
            }
            .highlight-province {
              background-color: #e0e0e0;
              font-weight: 850;
              padding: 4px 8px;
              border: 2px solid #000;
              display: inline-block;
              margin-top: 6px;
              font-size: 14px;
            }
            .barcode-section {
              text-align: center;
              margin: 15px 0;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              padding: 10px 0;
            }
            .barcode-lines {
              font-family: monospace;
              font-size: 26px;
              letter-spacing: 3px;
              line-height: 1;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .tracking-number {
              font-size: 14px;
              font-weight: 700;
              font-family: monospace;
            }
            .packing-list {
              font-size: 11px;
              border-top: 1px solid #000;
              padding-top: 8px;
            }
            .packing-list table {
              width: 100%;
              border-collapse: collapse;
            }
            .packing-list th {
              text-align: left;
              border-bottom: 1px solid #000;
              padding-bottom: 4px;
            }
            @media print {
              body {
                padding: 0;
              }
              .label-container {
                border: 2px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <div class="courier-badge">${courierName}</div>
              <div class="order-ref">ORDER: ${order.id}</div>
            </div>
            
            <div class="address-box sender">
              <strong>ผู้ส่ง (Sender):</strong><br>
              ศูนย์นวัตกรรมและเทคโนโลยีสารสนเทศ (DIIC) CAMT CMU<br>
              วิทยาลัยศิลปะ สื่อ และเทคโนโลยี มหาวิทยาลัยเชียงใหม่<br>
              239 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200<br>
              โทร: 053-941777
            </div>

            <div class="address-box recipient">
              <strong>ผู้รับ (Recipient):</strong><br>
              <strong>คุณ ${recipientName}</strong><br>
              โทร: ${recipientPhone}<br>
              ที่อยู่: ${recipientAddress}
              ${isChiangMai ? '<br><span class="highlight-province">ปลายทาง: เชียงใหม่ (ด่วนพิเศษ)</span>' : ''}
            </div>

            <div class="barcode-section">
              <div class="barcode-lines">||||| | ||||| |||| | ||| | |||</div>
              <div class="tracking-number">TRACKING: ${trackingText}</div>
            </div>

            <div class="packing-list">
              <div style="font-weight: bold; margin-bottom: 4px;">รายการสินค้าในกล่อง (Packing Checklist)</div>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left;">ชื่อสินค้า</th>
                    <th style="text-align: center; width: 50px;">จำนวน</th>
                  </tr>
                </thead>
                <tbody>
                  ${packItemsHtml}
                </tbody>
              </table>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleFulfillPreOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFulfillOrder) return;

    setIsSubmitting(true);
    try {
      const endpoint = fulfillmentType === "instock" ? "instock" : "preorder";
      
      const res = await fetch(`/api/orders/${selectedFulfillOrder.id}/fulfill/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          courier,
          trackingNumber: autoBook ? "" : trackingNumber,
          autoBook
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยันจัดส่งพัสดุ");
      }

      // If combined delivery, auto-fulfill In Stock portion as well (using same tracking details!)
      if (fulfillmentType === "combined") {
        if (selectedFulfillOrder.fulfillmentStatusInstock === "pending") {
          await fetch(`/api/orders/${selectedFulfillOrder.id}/fulfill/instock`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
              courier,
              trackingNumber: data.order?.trackingNumber2 || trackingNumber,
              autoBook: false
            })
          });
        }
      }

      fetchData();
      setSelectedFulfillOrder(null);
      alert("ยืนยันการจัดส่งพัสดุและส่งเมลแจ้งเลขพัสดุสำเร็จ!");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/ditc-portal-to-manager");
  };

  // Search filter
  const matchesSearch = (order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return order.id.toLowerCase().includes(query) ||
      (order.customerName && order.customerName.toLowerCase().includes(query));
  };

  // Date filter
  const matchesDate = (order) => {
    if (!selectedDate) return true;
    return getLocalDateString(order.createdAt) === selectedDate;
  };

  // Compute lists for each section
  const allOrdersList = queueOrders.filter(matchesSearch).filter(matchesDate);
  const pickupOrdersList = queueOrders
    .filter(order => order.deliveryOption === "pickup" && order.fulfillmentStatusInstock === "pending")
    .filter(matchesSearch)
    .filter(matchesDate);
  const deliveryOrdersList = queueOrders
    .filter(order => order.deliveryOption === "delivery" && (order.fulfillmentStatusInstock === "pending" || order.fulfillmentStatusPreorder === "pending"))
    .filter(matchesSearch)
    .filter(matchesDate);
  const historyOrdersList = historyOrders.filter(matchesSearch).filter(matchesDate);

  // Get active list to display
  const getDisplayOrders = () => {
    switch (activeTab) {
      case "all":
        return allOrdersList;
      case "pickup":
        return pickupOrdersList;
      case "delivery":
        return deliveryOrdersList;
      case "history":
        return historyOrdersList;
      default:
        return allOrdersList;
    }
  };

  const currentDisplayOrders = getDisplayOrders();

  return (
    <div className="min-h-screen bg-gray-50 font-['Prompt'] flex flex-col">
      {/* Top Navigation Navbar */}
      <nav className="bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F8C032]/10 rounded-xl flex items-center justify-center text-[#F8C032]">
            <ClipboardDocumentListIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2B2B2B]">ระบบคิวรับสินค้าหน้าร้าน</h1>
            <p className="text-xs text-gray-400">พนักงานร้านค้า CAMT คัดแยกของ</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">{currentUser?.name}</p>
            <p className="text-xs text-gray-400 font-medium capitalize">สิทธิ์: {currentUser?.role}</p>
          </div>
          {currentUser?.role === "admin" && (
            <>
              <button
                onClick={() => navigate("/dashboard/products")}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 hover:text-[#2B2B2B] font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
              >
                <Squares2X2Icon className="w-4.5 h-4.5" />
                <span>ไปหน้าจัดการสินค้า</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/screensavers")}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 hover:text-[#2B2B2B] font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
              >
                <PhotoIcon className="w-4.5 h-4.5" />
                <span>จัดการโฆษณา</span>
              </button>
            </>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-red-600 font-semibold bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4.5 h-4.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </nav>

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
        </div>

        {/* 4-Tab Navigation System with Real-Time Counts */}
        <div className="flex border-b border-gray-200 gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === "all" ? "text-[#F8C032]" : "text-gray-400 hover:text-gray-650"
              }`}
          >
            <span>คิวทั้งหมด ({allOrdersList.length})</span>
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8C032] rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("pickup")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === "pickup" ? "text-[#F8C032]" : "text-gray-400 hover:text-gray-650"
              }`}
          >
            <span>🏪 รับหน้าร้าน ({pickupOrdersList.length})</span>
            {activeTab === "pickup" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8C032] rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("delivery")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${activeTab === "delivery" ? "text-[#F8C032]" : "text-gray-400 hover:text-gray-650"
              }`}
          >
            <span>🚚 จัดส่งพัสดุ ({deliveryOrdersList.length})</span>
            {activeTab === "delivery" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F8C032] rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
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
                {activeTab === "all" && "ไม่มีรายการคำสั่งซื้อค้างส่ง"}
                {activeTab === "instock" && "ไม่มีคิวสินค้าพร้อมส่งค้างจ่าย"}
                {activeTab === "preorder" && "ไม่มีคิวสินค้า Pre-Order ค้างจัดส่ง"}
                {activeTab === "history" && "ไม่มีประวัติการจ่ายสินค้าสำเร็จ"}
              </h3>
              <p className="text-sm text-gray-400 px-6">
                {activeTab === "all" && "ออเดอร์ที่จ่ายเงินสำเร็จแต่มีสถานะค้างจ่ายจะแสดงที่นี่"}
                {activeTab === "instock" && "ออเดอร์ที่มีสินค้าพร้อมส่ง (In Stock) จะแสดงที่นี่เพื่อหยิบของหน้าร้าน"}
                {activeTab === "preorder" && "ออเดอร์ที่มีสินค้าจอง (Pre-Order) จะแสดงที่นี่เพื่อการเตรียมจัดส่งและบันทึกข้อมูล"}
                {activeTab === "history" && "ประวัติคำสั่งซื้อทั้งหมดที่ดำเนินการจัดส่งเรียบร้อยแล้ว"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDisplayOrders.map((order) => {
              const displayItems = order.items || [];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 font-mono select-all">
                        REF: {order.id.slice(-4)}
                      </span>
                      {order.fulfillmentStatus === "fulfilled" ? (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-full">
                          จ่ายของครบแล้ว
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                          order.deliveryOption === "delivery"
                            ? (order.shippingOption === "split" ? "bg-orange-50 text-orange-655 border border-orange-200" : "bg-blue-50 text-blue-655 border border-blue-200")
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}>
                          {order.deliveryOption === "delivery"
                            ? (order.shippingOption === "split" ? "🚚 จัดส่งพัสดุ (แยกส่ง)" : "🚚 จัดส่งพัสดุ (รวมส่ง)")
                            : "🏪 รับที่ตู้ Kiosk"}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700 font-mono mt-1 select-all">{order.id}</span>
                    <span className="text-xs text-gray-400">
                      เวลาสั่งซื้อ: {new Date(order.createdAt).toLocaleTimeString("th-TH")} น.
                    </span>
                  </div>

                  {/* Items details */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        รายการสินค้าทั้งหมด
                      </span>
                      <ul className="flex flex-col gap-2">
                        {displayItems.map((item, index) => (
                          <li key={index} className="flex justify-between items-center text-sm bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-700">{item.product?.name || "สินค้า"}</span>
                              <span className={`text-[10px] font-bold ${item.product?.status === 'In Stock' ? 'text-green-600' : 'text-orange-500'}`}>
                                ({item.product?.status === 'In Stock' ? 'In Stock' : 'Pre-Order'})
                              </span>
                            </div>
                            <span className="font-bold text-[#E53935] px-2.5 py-0.5 bg-red-50 border border-red-150 rounded-lg text-xs shrink-0">
                              x{item.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Customer & Delivery Address details */}
                    {order.customerName && (
                      <div className="border-t border-gray-100 pt-3 flex flex-col gap-1 text-xs text-gray-500">
                        <p><span className="font-semibold">ผู้สั่งซื้อ:</span> {order.customerName}</p>
                        <p><span className="font-semibold">เบอร์โทร:</span> {order.customerPhone}</p>
                        {order.deliveryOption === "delivery" && (
                          <p className="mt-1 bg-amber-50/40 p-2 rounded-lg border border-amber-100/60 text-gray-600">
                            <span className="font-semibold text-[#2B2B2B]">ที่อยู่จัดส่ง:</span> {order.customerAddress || "รอลูกค้ากรอกที่อยู่ผ่านมือถือ..."}
                          </p>
                        )}
                        {order.slipUrl && (
                          <button
                            onClick={() => handleOpenSlipPreview(order.slipUrl)}
                            className="text-[#F8C032] hover:underline font-semibold mt-1 text-left inline-block"
                          >
                            [ดูภาพสลิปชำระเงิน]
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions based on activeTab & deliveryOptions */}
                  <div className="p-5 bg-gray-50/30 border-t border-gray-100">
                    {/* ALL / PICKUP TAB - KIOSK PICKUP FLOW */}
                    {order.deliveryOption === "pickup" && (
                      <div className="flex flex-col gap-2">
                        {order.fulfillmentStatusInstock === "fulfilled" ? (
                          <div className="text-center text-xs font-bold text-green-600 bg-green-50 py-2.5 rounded-lg border border-green-150">
                            ✓ จ่ายสินค้าที่ตู้ Kiosk เรียบร้อย
                          </div>
                        ) : (
                          <button
                            onClick={() => handleFulfillInStock(order.id)}
                            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            <CheckIcon className="w-5 h-5" />
                            ยืนยันจ่ายของที่ตู้ Kiosk
                          </button>
                        )}
                        {hasPreOrderItem(order) && (
                          <div className="text-[10px] text-orange-600 text-center font-bold bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                            📦 ออเดอร์มี Pre-Order (รอนัดรับหน้าร้านภายหลัง)
                          </div>
                        )}
                      </div>
                    )}

                    {/* ALL / DELIVERY TAB - PARCEL DELIVERY FLOW */}
                    {order.deliveryOption === "delivery" && (
                      <div className="flex flex-col gap-3">
                        {/* 1. Split Delivery Option */}
                        {order.shippingOption === "split" ? (
                          <div className="flex flex-col gap-2.5">
                            {/* In-Stock Portion */}
                            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
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
                                    setAutoBook(false);
                                  }}
                                  disabled={!order.customerAddress}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border cursor-pointer
                                    ${order.customerAddress 
                                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
                                >
                                  ส่งพัสดุ In Stock
                                </button>
                              )}
                            </div>

                            {/* Pre-Order Portion */}
                            <div className="flex items-center justify-between gap-2">
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
                                    setAutoBook(false);
                                  }}
                                  disabled={!order.customerAddress}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border cursor-pointer
                                    ${order.customerAddress 
                                      ? "bg-[#F8C032] text-[#2B2B2B] border-[#F8C032]/40 hover:bg-[#F0B420]" 
                                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
                                >
                                  ส่งพัสดุ Pre-Order
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* 2. Combined Delivery Option */
                          <div className="flex flex-col gap-2">
                            {order.fulfillmentStatusPreorder === "fulfilled" && order.fulfillmentStatusInstock === "fulfilled" ? (
                              <div className="text-center text-xs font-bold text-green-600 bg-green-50 py-2.5 rounded-lg border border-green-150">
                                ✓ จัดส่งพัสดุรวมกันครบถ้วนแล้ว
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedFulfillOrder(order);
                                  setFulfillmentType("combined");
                                  setCourier("thailandpost");
                                  setTrackingNumber(order.trackingNumber1 || "");
                                  setAutoBook(false);
                                }}
                                disabled={!order.customerAddress}
                                className={`w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border cursor-pointer
                                  ${order.customerAddress 
                                    ? "bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] border-[#F8C032]/40" 
                                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
                              >
                                <CheckIcon className="w-5 h-5" />
                                จัดส่งพัสดุรวมกล่องเดียว
                              </button>
                            )}
                          </div>
                        )}
                        
                        {!order.customerAddress && (
                          <p className="text-[10px] text-amber-600 text-center font-bold animate-pulse">
                            ⚠️ รอลูกค้าระบุที่อยู่จัดส่งผ่านหน้า LINE LIFF
                          </p>
                        )}
                      </div>
                    )}

                    {activeTab === "history" && (
                      <div className="bg-[#E8F5E9] text-[#2E7D32] p-4 rounded-xl border border-[#C8E6C9] flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                          <CheckIcon className="w-5 h-5 stroke-[2.5]" />
                          <span>จัดเตรียมเรียบร้อยครบทุกรายการ</span>
                        </div>
                        <div className="text-xs font-medium text-[#2E7D32]/85 flex flex-col gap-0.5 mt-1 border-t border-[#C8E6C9] pt-1.5">
                          <p>ผู้ดำเนินการล่าสุด: {order.handlerName || "ไม่ระบุพนักงาน"}</p>
                          <p>สำเร็จเมื่อ: {new Date(order.fulfilledAt).toLocaleString("th-TH")} น.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Pre-order Fulfillment & Shipping Modal */}
      {selectedFulfillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-extrabold text-[#2B2B2B] text-base">
                  {fulfillmentType === "instock" 
                    ? "ยืนยันจัดส่งพัสดุสินค้า In Stock (พร้อมส่ง)" 
                    : fulfillmentType === "combined" 
                      ? "ยืนยันจัดส่งพัสดุสินค้า (Combined)" 
                      : "ยืนยันจัดส่งพัสดุสินค้า Pre-Order"}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5 select-all">ออเดอร์ ID: {selectedFulfillOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedFulfillOrder(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFulfillPreOrderSubmit} className="flex flex-col gap-4">
              {/* Delivery Address Summary */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/60 text-xs text-gray-600 flex flex-col gap-1.5">
                <p><span className="font-bold text-gray-700">ชื่อผู้รับ:</span> {selectedFulfillOrder.customerName}</p>
                <p><span className="font-bold text-gray-700">เบอร์โทร:</span> {selectedFulfillOrder.customerPhone}</p>
                <p><span className="font-bold text-gray-700">ที่อยู่จัดส่ง:</span> {selectedFulfillOrder.customerAddress}</p>
              </div>

              {/* Courier Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">บริการขนส่ง (Courier)</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full h-11 bg-gray-50 border border-gray-150 rounded-xl px-4 text-sm outline-none focus:border-[#F8C032] cursor-pointer"
                >
                  <option value="thailandpost">ไปรษณีย์ไทย (EMS)</option>
                  <option value="flash">Flash Express</option>
                  <option value="kerry">Kerry Express</option>
                  <option value="jt">J&T Express</option>
                </select>
              </div>

              {/* API Mock Auto Booking Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mt-1">
                <div>
                  <span className="text-xs font-bold text-gray-700 block">ใช้ระบบ API จำลองจองพัสดุอัตโนมัติ</span>
                  <span className="text-[10px] text-gray-400">จองคิวและรับเลขพัสดุอัตโนมัติ (ขยายเพื่อเชื่อมต่อระบบจริงในอนาคต)</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoBook}
                  onChange={(e) => setAutoBook(e.target.checked)}
                  className="w-5 h-5 accent-[#F8C032] cursor-pointer"
                />
              </div>

              {/* Tracking Number Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">เลขพัสดุ (Tracking Number)</label>
                <input
                  type="text"
                  value={autoBook ? "ระบบจะขอเลขพัสดุผ่าน API อัตโนมัติ" : trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={autoBook}
                  required={!autoBook}
                  placeholder="กรอกเลขพัสดุจัดส่ง..."
                  className="w-full h-11 bg-gray-50 border border-gray-150 rounded-xl px-4 text-sm outline-none focus:border-[#F8C032] disabled:opacity-60 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={handlePrintLabel}
                  className="h-11 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>พิมพ์ใบแปะหน้ากล่อง</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? "กำลังดำเนินการ..." : "บันทึกจัดส่งสินค้า"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Image Viewer Modal Popup */}
      {selectedSlipUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeSlipPreview}
        >
          <div 
            className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col p-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <span className="font-bold text-[#2B2B2B] text-sm">สลิปหลักฐานการชำระเงิน</span>
              <button 
                onClick={closeSlipPreview}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full aspect-[3/4] bg-gray-50 flex items-center justify-center rounded-2xl overflow-hidden border border-gray-100 p-2">
              <img 
                src={selectedSlipUrl} 
                alt="Payment Slip" 
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications Stack */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
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
                REF: {t.order.id.slice(-4)} ({t.order.id})
              </p>
              <p className="text-xs text-gray-600 font-semibold mt-1">
                คุณ {t.order.customerName || "ไม่ระบุชื่อ"} • ฿{t.order.totalAmount}
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
