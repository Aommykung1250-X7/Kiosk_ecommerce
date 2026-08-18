import React, { useState, useEffect } from "react";
import { PhoneIcon, XMarkIcon, ExclamationTriangleIcon, QrCodeIcon } from "@heroicons/react/24/solid";
import { QRCodeSVG } from "qrcode.react";

export default function SupportModal({ isOpen, onClose }) {
  const [contactInfo, setContactInfo] = useState({
    hotline: "02-123-4567 / 081-234-5678",
    lineId: "@ditcsupport",
    lineUrl: "https://line.me/ti/p/@ditcsupport",
    lineQrImage: "",
    serviceHours: "เปิดบริการ 08:00 - 20:00 น."
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings/contact")
        .then((res) => res.json())
        .then((data) => {
          setContactInfo({
            hotline: data.hotline || "02-123-4567 / 081-234-5678",
            lineId: data.lineId || "@ditcsupport",
            lineUrl: data.lineUrl || "https://line.me/ti/p/@ditcsupport",
            lineQrImage: data.lineQrImage || "",
            serviceHours: data.serviceHours || "เปิดบริการ 08:00 - 20:00 น."
          });
        })
        .catch((err) => console.error("Error fetching contact settings:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200 font-['Prompt']">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1B1B1C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E53935] text-white rounded-2xl flex items-center justify-center shadow-sm">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">ศูนย์ช่วยเหลือ & ติดต่อเจ้าหน้าที่</h2>
              <p className="text-xs text-gray-400 font-medium">แจ้งปัญหาการใช้งานตู้สินค้า หรือขอความช่วยเหลือด่วน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phone Support */}
            <div className="bg-gradient-to-br from-[#FFF9E6] to-[#FFF3CC] border border-[#F8C032]/40 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center gap-2 text-[#8A6200] mb-1.5">
                  <PhoneIcon className="w-5 h-5 text-[#E53935]" />
                  <span className="text-xs font-black uppercase tracking-wider">เบอร์โทรศัพท์ Hotline</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">โทรแจ้งเจ้าหน้าที่ประจำอาคารทันที</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-[#F8C032]/30 shadow-2xs">
                <span className="text-base font-black text-[#1B1B1C] block select-all">
                  {contactInfo.hotline}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">{contactInfo.serviceHours}</span>
              </div>
            </div>

            {/* LINE QR Code Support */}
            <div className="bg-gradient-to-br from-[#E8F8F5] to-[#D1F2EB] border border-[#5EBAA8]/40 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#116B5C] mb-2">
                <QrCodeIcon className="w-5 h-5 text-[#00C300]" />
                <span className="text-xs font-black uppercase tracking-wider">สแกน LINE Official</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#5EBAA8]/30 shadow-xs mb-2">
                {contactInfo.lineQrImage ? (
                  <img src={contactInfo.lineQrImage} className="w-[90px] h-[90px] object-contain rounded-lg" alt="LINE QR Code" />
                ) : (
                  <QRCodeSVG value={contactInfo.lineUrl || "https://line.me/ti/p/@ditcsupport"} size={90} level="M" />
                )}
              </div>
              <span className="text-[11px] font-bold text-gray-700">{contactInfo.lineId}</span>
            </div>

          </div>

          {/* Common Troubles Guide */}
          <div className="border-t border-gray-150 pt-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">คำแนะนำการแก้ปัญหาเบื้องต้น</h3>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <p className="font-bold text-gray-900 mb-0.5">💰 ชำระเงินแล้วสินค้าไม่หล่นออกจากตู้?</p>
                <p className="text-gray-600">โปรดถ่ายรูปหน้าจอประวัติสั่งซื้อ หรือสลิปการโอนเงิน แล้วโทรแจ้งเจ้าหน้าที่เพื่อขอรับเงินคืนหรือให้เจ้าหน้าที่นำสินค้าออกให้</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                <p className="font-bold text-gray-900 mb-0.5">📱 สแกน QR Code เพื่อชำระเงินไม่ได้?</p>
                <p className="text-gray-600">ลองกดยกเลิกออเดอร์ แล้วลองทำรายการใหม่อีกครั้ง หากยังไม่ผ่าน โปรดลองเปลี่ยนแอปพลิเคชันธนาคาร</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Close Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1B1B1C] hover:bg-black text-white text-sm font-extrabold rounded-2xl active:scale-[0.99] transition-all cursor-pointer shadow-sm"
          >
            เข้าใจแล้ว / ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
