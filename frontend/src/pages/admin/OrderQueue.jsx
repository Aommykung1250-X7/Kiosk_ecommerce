// frontend/src/pages/admin/OrderQueue.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowPathIcon, CheckIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // ดึง Token
  const token = localStorage.getItem("token");

  useEffect(() => {
    // โหลดประวัติผู้ใช้ปัจจุบัน
    const userString = localStorage.getItem("user");
    if (userString) {
      setCurrentUser(JSON.parse(userString));
    }

    fetchQueue();

    // ดึงข้อมูลคิวอัตโนมัติทุกๆ 5 วินาทีเพื่อจำลองการทำคิวแบบกึ่งเรียลไทม์
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/orders/queue", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถดึงข้อมูลคิวสั่งซื้อได้");
      }

      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (orderId) => {
    if (!window.confirm(`ยืนยันการจัดจ่ายสินค้าสำหรับออเดอร์ ${orderId} หรือไม่?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/fulfill`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยันจ่ายสินค้า");
      }

      // ดึงคิวล่าสุดทันที
      fetchQueue();
      alert("ยืนยันจ่ายสินค้าสำเร็จ!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/ditc-portal-to-manager");
  };

  // กรองรายการออเดอร์ตามคำค้นหา (เช่น พิมพ์หาเลขรหัสคิว หรือสแกน QR Code)
  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        
        {/* Search & Actions Area */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search box (simulating scanner trigger) */}
          <div className="relative w-full sm:max-w-md flex items-center">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="สแกนหรือค้นหารหัส Order ID (เช่น CAMT-...)"
              className="w-full h-11 bg-gray-50 border border-gray-100 hover:border-gray-200 focus:border-[#F8C032] rounded-xl pl-12 pr-4 text-sm outline-none transition-all"
            />
          </div>

          <button
            onClick={fetchQueue}
            className="flex items-center gap-2 px-5 h-11 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-600 transition-all"
          >
            <ArrowPathIcon className="w-4 h-4" />
            รีเฟรชข้อมูลคิว
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
        ) : filteredOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-150 shadow-sm gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
              <CheckIcon className="w-10 h-10" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-gray-700">ไม่มีคิวค้างจ่ายของ</h3>
              <p className="text-sm text-gray-400 px-6">ออเดอร์ที่จ่ายเงินสำเร็จและค้างจ่ายจะแสดงที่นี่เพื่อคัดเลือกของ</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
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
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 border border-green-150 rounded-full">
                      ชำระเงินแล้ว
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-700 font-mono mt-1 select-all">{order.id}</span>
                  <span className="text-xs text-gray-400">
                    เวลาสั่งซื้อ: {new Date(order.createdAt).toLocaleTimeString("th-TH")} น.
                  </span>
                </div>

                {/* Items details */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รายการหยิบของ</span>
                    <ul className="flex flex-col gap-2">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center text-sm bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                          <span className="font-semibold text-gray-700">{item.product.name}</span>
                          <span className="font-bold text-[#E53935] px-2.5 py-0.5 bg-red-50 border border-red-150 rounded-lg text-xs">
                            x{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Customer details */}
                  {order.customerName && (
                    <div className="border-t border-gray-100 pt-3 flex flex-col gap-1 text-xs text-gray-500">
                      <p><span className="font-semibold">ผู้สั่งซื้อ:</span> {order.customerName}</p>
                      <p><span className="font-semibold">เบอร์โทร:</span> {order.customerPhone}</p>
                      {order.slipUrl && (
                        <a 
                          href={order.slipUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#F8C032] hover:underline font-semibold mt-1 inline-block"
                        >
                          [ดูภาพสลิปชำระเงิน]
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Action */}
                <div className="p-5 bg-gray-50/30 border-t border-gray-100">
                  <button
                    onClick={() => handleFulfill(order.id)}
                    className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                  >
                    <CheckIcon className="w-5 h-5" />
                    ยืนยันการจ่ายสินค้า
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
