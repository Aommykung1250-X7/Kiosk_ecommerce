// src/components/KioskPayment.jsx
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircleIcon, ArrowPathIcon, EnvelopeIcon, PhoneIcon, ClockIcon } from "@heroicons/react/24/outline";
import { notify } from "./notify";

export default function KioskPayment({ orderId, totalPrice, qrPayload, onPaymentSuccess, onCancel }) {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [countdown, setCountdown] = useState(10);
  const [payTimerSeconds, setPayTimerSeconds] = useState(300); // 5 minutes (300 seconds)

  const formatMMSS = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 5-minute Payment Countdown Timer
  useEffect(() => {
    if (paymentStatus === "pending") {
      const timer = setInterval(() => {
        setPayTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            notify.warning("หมดเวลาชำระเงิน ระบบยกเลิกคำสั่งซื้อเรียบร้อยแล้ว");
            onCancel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus, onCancel]);

  // Form states for contact info
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    if (contactSubmitted && paymentStatus === "pending") {
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

    if (paymentStatus === "success") {
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
  }, [orderId, paymentStatus, contactSubmitted, onPaymentSuccess]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!phone || !/^\d{10}$/.test(phone)) {
      notify.warning("กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify.warning("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
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
      .catch((err) => notify.error(err.message))
      .finally(() => setSubmittingContact(false));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F8F8] flex flex-col items-center justify-center p-6 font-['Prompt']">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col p-8 gap-6 animate-in fade-in-50 duration-200">
        
        {!contactSubmitted ? (
          <>
            {/* Step 1: Input Contact Info BEFORE paying */}
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-[#2B2B2B]">ข้อมูลผู้สั่งซื้อ</h2>
              <p className="text-sm text-gray-500">กรุณากรอกเบอร์โทรและอีเมลเพื่อรับใบเสร็จก่อนสแกนชำระเงิน</p>
            </div>

            {/* Total Price Summary */}
            <div className="flex flex-col items-center justify-center gap-1 bg-[#F8C032]/10 p-4 rounded-2xl border border-[#F8C032]/20 text-center">
              <span className="text-sm text-gray-600 font-medium">ยอดเงินชำระทั้งหมด</span>
              <span className="text-3xl font-extrabold text-[#E53935]">
                ฿{totalPrice.toLocaleString('th-TH')}
              </span>
            </div>

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4 text-[#F8C032]" /> เบอร์โทรศัพท์ติดต่อ (10 หลัก)
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
                  <EnvelopeIcon className="w-4 h-4 text-[#F8C032]" /> อีเมลสำหรับรับใบเสร็จ
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

              <div className="flex flex-col gap-2 mt-2">
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
                    <span>สแกนชำระเงิน</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="h-10 rounded-xl w-full font-semibold text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  ยกเลิกคำสั่งซื้อ
                </button>
              </div>
            </form>
          </>
        ) : paymentStatus === "pending" ? (
          <>
            {/* Step 2: Payment Pending UI (QR Code) */}
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-[#2B2B2B]">สแกนเพื่อชำระเงิน</h2>
              <p className="text-sm text-gray-500">กรุณาแสกน QR Code เพื่อโอนเงินผ่านแอปพลิเคชันธนาคาร</p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center gap-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
              {qrPayload ? (
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                  {qrPayload.startsWith("http://") || qrPayload.startsWith("https://") ? (
                    <img src={qrPayload} alt="PromptPay QR Code" className="w-[200px] h-[200px] object-contain" />
                  ) : (
                    <QRCodeSVG value={qrPayload} size={200} />
                  )}
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

            {/* 5-minute Payment Countdown Badge */}
            <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
              payTimerSeconds <= 60
                ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              <ClockIcon className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>กรุณาสแกนชำระเงินภายใน: <strong className="font-mono text-sm font-black">{formatMMSS(payTimerSeconds)}</strong> นาที</span>
            </div>

            {/* Price summary */}
            <div className="flex flex-col items-center justify-center gap-1 bg-[#F8C032]/10 p-4 rounded-2xl border border-[#F8C032]/20 text-center">
              <span className="text-xs text-gray-500 font-medium">ยอดเงินชำระทั้งหมด</span>
              <span className="text-2xl font-extrabold text-[#E53935]">
                ฿{totalPrice.toLocaleString('th-TH')}
              </span>
            </div>

            {/* Real-time Loader */}
            <div className="flex items-center justify-center gap-2.5 text-[#2E7D32] bg-[#E8F5E9] py-3 px-4 rounded-xl border border-[#C8E6C9] font-medium text-xs">
              <ArrowPathIcon className="w-4 h-4 animate-spin shrink-0" />
              <span>ระบบตรวจสอบการชำระเงินเรียลไทม์...</span>
            </div>

            {/* Cancel Order Button */}
            <button
              onClick={onCancel}
              className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold border border-red-200 active:scale-95 transition-all text-center text-xs cursor-pointer"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          </>
        ) : (
          <>
            {/* Step 3: Payment & Contact Success Final Screen */}
            <div className="text-center flex flex-col items-center justify-center py-4 gap-4">
              <CheckCircleIcon className="w-20 h-20 text-[#2E7D32] animate-bounce" />
              
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-extrabold text-[#2B2B2B]">ชำระเงินสำเร็จ!</h2>
                <p className="text-xs text-gray-500 px-4">
                  ระบบได้ส่งใบเสร็จการชำระเงินไปยัง <span className="font-semibold text-gray-700">{email}</span> เรียบร้อยแล้ว
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 bg-[#E8F5E9]/50 p-4 rounded-2xl border border-[#C8E6C9]/40 mt-1">
                <span className="text-[10px] text-gray-400 font-semibold font-mono uppercase tracking-wider">
                  Order Reference
                </span>
                <span className="text-sm font-bold text-[#2B2B2B] font-mono">
                  {orderId}
                </span>
              </div>
            </div>

            {/* Auto Close Info */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={onPaymentSuccess}
                className="h-12 w-full rounded-2xl bg-[#F8C032] hover:bg-[#F0B420] active:scale-95
                           flex items-center justify-center gap-2 transition-transform duration-150 shadow-md font-semibold text-[#2B2B2B] cursor-pointer text-sm"
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

