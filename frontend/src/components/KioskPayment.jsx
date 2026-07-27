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
          .catch(() => {});
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
    <div className="absolute inset-0 z-50 bg-[#F8F8F8] flex flex-col items-center justify-center p-6 font-['Prompt'] overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.06)] flex flex-col p-8 gap-6 animate-in fade-in-50 duration-200 my-auto">
        
        {paymentStatus === "pending" ? (
          <>
            {/* Payment Pending UI */}
            <div className="text-center flex flex-col gap-1">
              <h2 className="text-2xl font-black text-[#2B2B2B]">สแกนเพื่อชำระเงิน</h2>
              <p className="text-xs text-gray-500 font-semibold">กรุณาสแกน QR Code เพื่อโอนเงินผ่านแอปพลิเคชันธนาคาร</p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center gap-3 py-3 bg-gray-50 rounded-2xl border border-gray-100 relative">
              {qrPayload ? (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <QRCodeSVG value={qrPayload} size={180} />
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
                  <ArrowPathIcon className="w-10 h-10 animate-spin mb-2" />
                  <span className="text-xs font-semibold">กำลังสร้าง QR Code...</span>
                </div>
              )}
              <span className="text-[11px] font-mono text-gray-400 select-all">
                ID: {orderId}
              </span>
            </div>

            {/* Price details */}
            <div className="flex flex-col gap-1 text-center bg-[#F9C338]/15 p-3.5 rounded-2xl border border-[#F9C338]/30">
              <span className="text-xs text-gray-500 font-bold">ยอดเงินชำระทั้งหมด</span>
              <span className="text-3xl font-black text-[#E53935]">
                ฿{(totalPrice || 0).toFixed(0)}
              </span>
            </div>

            {/* Real-time Loader */}
            <div className="flex items-center justify-center gap-2 text-[#2E7D32] bg-[#E8F5E9] py-3 px-4 rounded-xl border border-[#C8E6C9] font-bold text-xs">
              <ArrowPathIcon className="w-4 h-4 animate-spin shrink-0" />
              <span>ระบบกำลังตรวจสอบการชำระเงินแบบเรียลไทม์...</span>
            </div>

            {/* Simulate Payment for Dev */}
            <button
              onClick={handleSimulatePayment}
              disabled={simulatingPayment}
              className="py-2 px-4 rounded-xl bg-[#F9C338]/20 text-[#A24B2C] hover:bg-[#F9C338]/30 active:scale-95 transition-all text-xs font-extrabold border border-[#F9C338]/30 cursor-pointer select-none"
            >
              {simulatingPayment ? "กำลังจำลอง..." : "⚡ จำลองการโอนสำเร็จ (Simulate Webhook)"}
            </button>

            {/* Cancel Order Button */}
            <button
              onClick={onCancel}
              className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-extrabold border border-red-200 active:scale-95 transition-all text-center cursor-pointer text-xs"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          </>
        ) : !contactSubmitted ? (
          <>
            {/* Payment Successful, Ask for Contact Info */}
            <div className="text-center flex flex-col gap-2">
              <div className="flex justify-center mb-1">
                <CheckCircleIcon className="w-14 h-14 text-[#2E7D32] animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-[#2B2B2B]">ชำระเงินสำเร็จ!</h2>
              <p className="text-xs font-semibold text-gray-500">กรุณากรอกข้อมูลติดต่อเพื่อส่งใบเสร็จรับเงินทางอีเมล</p>
            </div>

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4 text-gray-400" /> เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F9C338] text-sm font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400" /> อีเมลสำหรับรับใบเสร็จ
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F9C338] text-sm font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={submittingContact}
                className={`h-12 rounded-2xl w-full font-black text-sm text-[#2B2B2B] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none border-2 border-black
                  ${submittingContact ? "bg-gray-100 text-gray-400 border-gray-300" : "bg-[#F9C338] hover:bg-[#F2BD2B] active:scale-95"}`}
              >
                {submittingContact ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
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
            <div className="text-center flex flex-col items-center justify-center py-4 gap-4">
              <CheckCircleIcon className="w-20 h-20 text-[#2E7D32] animate-bounce" />
              
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-[#2B2B2B]">เสร็จสิ้นรายการ!</h2>
                <p className="text-xs font-semibold text-gray-500 px-4">
                  ระบบได้ส่งใบเสร็จการชำระเงินไปยังอีเมลของท่านเรียบร้อยแล้ว
                </p>
              </div>

              <div className="w-full flex flex-col gap-1.5 bg-[#E8F5E9]/50 p-4 rounded-2xl border border-[#C8E6C9]/40">
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
