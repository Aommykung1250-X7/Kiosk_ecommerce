// src/components/KioskPayment.jsx
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircleIcon, ArrowPathIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

export default function KioskPayment({ orderId, totalPrice, qrPayload, onPaymentSuccess, onCancel }) {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [countdown, setCountdown] = useState(10);

  // Form states for contact info
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  useEffect(() => {
    if (paymentStatus === "success" && contactSubmitted) {
      // Start 10-second countdown to auto-close and return to catalog
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onPaymentSuccess(); // triggers clearing cart and resets states
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    if (paymentStatus === "pending") {
      // 1. Set up Server-Sent Events (SSE) for real-time notification
      const sse = new EventSource(`/api/orders/${orderId}/sse`);
      
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "success") {
            setPaymentStatus("success");
            sse.close();
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      };

      sse.onerror = () => {
        console.warn("SSE connection error, falling back to polling.");
        sse.close();
      };

      // 2. Set up Short Polling fallback (resilient network check every 3s)
      const pollInterval = setInterval(() => {
        fetch(`/api/orders/${orderId}/status`)
          .then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then((data) => {
            if (data.status === "success") {
              setPaymentStatus("success");
              clearInterval(pollInterval);
              sse.close();
            }
          })
          .catch(() => {
            // Fail silently on polling network issues
          });
      }, 3000);

      // Clean up SSE & polling on unmount
      return () => {
        sse.close();
        clearInterval(pollInterval);
      };
    }
  }, [orderId, paymentStatus, contactSubmitted, onPaymentSuccess]);

  const handleSimulatePayment = () => {
    setSimulatingPayment(true);
    fetch("/api/payments/simulate-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    })
      .then((res) => res.json())
      .then(() => {
        // SSE will capture this or polling will capture this
      })
      .catch((err) => console.error("Error simulating payment:", err))
      .finally(() => setSimulatingPayment(false));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!phone || !/^\d{10}$/.test(phone)) {
      return alert("กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง");
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return alert("กรุณากรอกอีเมลให้ถูกต้อง");
    }

    setSubmittingContact(true);
    fetch(`/api/orders/${orderId}/contact-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, email })
    })
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถบันทึกข้อมูลติดต่อได้");
        return res.json();
      })
      .then(() => {
        setContactSubmitted(true);
      })
      .catch((err) => alert(err.message))
      .finally(() => setSubmittingContact(false));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F8F8] flex flex-col items-center justify-center p-6 font-['Prompt']">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col p-8 gap-8 animate-in fade-in-50 duration-200">
        
        {paymentStatus === "pending" ? (
          <>
            {/* Payment Pending UI */}
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-[#2B2B2B]">สแกนเพื่อชำระเงิน</h2>
              <p className="text-sm text-gray-500">กรุณาแสกน QR Code เพื่อโอนเงินผ่านแอปพลิเคชันธนาคาร</p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center gap-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
              {qrPayload ? (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <QRCodeSVG value={qrPayload} size={200} />
                </div>
              ) : (
                <div className="h-[232px] flex flex-col items-center justify-center text-gray-400">
                  <ArrowPathIcon className="w-10 h-10 animate-spin mb-2" />
                  <span className="text-xs">กำลังสร้าง QR Code จาก Omise...</span>
                </div>
              )}
              <span className="text-xs font-mono text-gray-400 select-all">
                ID: {orderId}
              </span>
            </div>

            {/* Price & Ref details */}
            <div className="flex flex-col gap-3 text-center bg-[#F8C032]/10 p-4 rounded-2xl border border-[#F8C032]/20">
              <span className="text-sm text-gray-500 font-medium">ยอดเงินชำระทั้งหมด</span>
              <span className="text-3xl font-extrabold text-[#E53935]">
                ฿{totalPrice.toLocaleString('th-TH')}
              </span>
            </div>

            {/* Real-time Loader */}
            <div className="flex items-center justify-center gap-2.5 text-[#2E7D32] bg-[#E8F5E9] py-3.5 px-4 rounded-xl border border-[#C8E6C9] font-medium text-sm">
              <ArrowPathIcon className="w-4.5 h-4.5 animate-spin shrink-0" />
              <span>ระบบตรวจสอบการชำระเงินเรียลไทม์...</span>
            </div>

            {/* Simulate Payment for Dev */}
            <button
              onClick={handleSimulatePayment}
              disabled={simulatingPayment}
              className="py-2.5 px-4 rounded-xl bg-[#F8C032]/20 text-[#A24B2C] hover:bg-[#F8C032]/30 active:scale-95 transition-all text-xs font-bold border border-[#F8C032]/30 cursor-pointer"
            >
              {simulatingPayment ? "กำลังจำลอง..." : "⚡ จำลองการโอนสำเร็จ (Simulate Webhook)"}
            </button>

            {/* Cancel Order Button */}
            <button
              onClick={onCancel}
              className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold border border-red-200 active:scale-95 transition-all text-center cursor-pointer"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          </>
        ) : !contactSubmitted ? (
          <>
            {/* Payment Successful, Ask for Contact Info */}
            <div className="text-center flex flex-col gap-2">
              <div className="flex justify-center mb-2">
                <CheckCircleIcon className="w-16 h-16 text-[#2E7D32] animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-[#2B2B2B]">ชำระเงินสำเร็จ!</h2>
              <p className="text-sm text-gray-500">กรุณากรอกข้อมูลติดต่อเพื่อส่งใบเสร็จรับเงินทางอีเมล</p>
            </div>

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4" /> เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <EnvelopeIcon className="w-4 h-4" /> อีเมลสำหรับรับใบเสร็จ
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingContact}
                className={`h-12 rounded-2xl w-full font-bold text-base text-[#2B2B2B] shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer select-none
                  ${submittingContact ? "bg-gray-100 text-gray-400" : "bg-[#F8C032] hover:bg-[#F0B420] active:scale-95"}`}
              >
                {submittingContact ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <span>บันทึกข้อมูลและส่งใบเสร็จ</span>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Payment & Contact Success Final Screen */}
            <div className="text-center flex flex-col items-center justify-center py-6 gap-6">
              <CheckCircleIcon className="w-24 h-24 text-[#2E7D32] animate-bounce" />
              
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-extrabold text-[#2B2B2B]">เสร็จสิ้นรายการ!</h2>
                <p className="text-sm text-gray-500 px-4">
                  ระบบได้ส่งใบเสร็จการชำระเงินไปยังอีเมลของท่านเรียบร้อยแล้ว
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 bg-[#E8F5E9]/50 p-5 rounded-2xl border border-[#C8E6C9]/40 mt-2">
                <span className="text-xs text-gray-400 font-semibold font-mono uppercase tracking-wider">
                  Order Reference
                </span>
                <span className="text-base font-bold text-[#2B2B2B] font-mono">
                  {orderId}
                </span>
              </div>
            </div>

            {/* Auto Close Info */}
            <div className="flex flex-col gap-3">
              <button
                onClick={onPaymentSuccess}
                className="h-12 w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95
                           flex items-center justify-center gap-2 transition-transform duration-150 shadow-md font-semibold text-[#2B2B2B] cursor-pointer"
              >
                กลับสู่หน้าหลัก
              </button>
              <p className="text-center text-xs text-gray-400">
                ระบบจะนำคุณกลับสู่หน้าหลักอัตโนมัติใน {countdown} วินาที
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
