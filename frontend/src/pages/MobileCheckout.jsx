// src/pages/MobileCheckout.jsx
import { useState, useEffect } from "react";
import { CheckCircleIcon, ArrowUpTrayIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export default function MobileCheckout() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [slip, setSlip] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [compressedFile, setCompressedFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Get orderId from query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("orderId");
    if (id) {
      setOrderId(id);
      // Fetch order details
      fetch(`/api/orders/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("ไม่พบข้อมูลออเดอร์นี้ในระบบ");
          return res.json();
        })
        .then((data) => {
          setOrder(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setError("ไม่พบ Order ID ในพารามิเตอร์ของ URL");
      setLoading(false);
    }
  }, []);

  // Client-side image compression using canvas
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOriginalSize(file.size);
    setSlip(file);
    setCompressing(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Set maximum dimension limits
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio constraint
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress image using canvas.toBlob (format: JPEG, quality: 0.75)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now()
              });
              setCompressedFile(compressed);
              setCompressedSize(compressed.size);
            }
            setCompressing(false);
          },
          "image/jpeg",
          0.75
        );
      };
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("กรุณากรอกชื่อของคุณ");
    if (!phone.trim()) return alert("กรุณากรอกเบอร์โทรศัพท์");
    if (!email.trim()) return alert("กรุณากรอกอีเมล");
    if (!addressStreet.trim()) return alert("กรุณากรอกบ้านเลขที่ / ถนน");
    if (!subdistrict.trim()) return alert("กรุณากรอกตำบล / แขวง");
    if (!district.trim()) return alert("กรุณากรอกอำเภอ / เขต");
    if (!province.trim()) return alert("กรุณากรอกจังหวัด");
    if (!zipcode.trim()) return alert("กรุณากรอกรหัสไปรษณีย์");
    const uploadFile = compressedFile || slip;
    if (!uploadFile) return alert("กรุณาแนบภาพสลิปโอนเงิน");

    setSubmitting(true);

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("addressStreet", addressStreet);
    formData.append("subdistrict", subdistrict);
    formData.append("district", district);
    formData.append("province", province);
    formData.append("zipcode", zipcode);
    formData.append("slip", uploadFile);

    fetch("/api/checkout/submit", {
      method: "POST",
      body: formData
    })
      .then((res) => {
        if (!res.ok) throw new Error("ล้มเหลวในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง");
        return res.json();
      })
      .then(() => {
        setIsSuccess(true);
        setSubmitting(false);
      })
      .catch((err) => {
        alert(err.message);
        setSubmitting(false);
      });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-gray-500 font-['Prompt']">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#F8C032] mb-3"></div>
        <p className="font-semibold text-sm animate-pulse">กำลังโหลดข้อมูลออเดอร์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-[#E53935] text-center font-['Prompt'] gap-4">
        <p className="text-lg font-bold">เกิดข้อผิดพลาด</p>
        <p className="text-sm bg-red-50 py-3 px-6 rounded-2xl border border-red-100 max-w-sm">{error}</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 font-['Prompt'] text-center">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col items-center gap-6 animate-in fade-in-50 duration-200">
          <CheckCircleIcon className="w-20 h-20 text-[#2E7D32] animate-bounce" />
          
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold text-[#2B2B2B]">ชำระเงินเรียบร้อย!</h2>
            <p className="text-sm text-gray-400">
              ระบบได้รับข้อมูลชำระเงินของท่านแล้ว หน้าจอที่ตู้ Kiosk จะเปลี่ยนการแสดงผลอัตโนมัติในอีกสักครู่
            </p>
          </div>

          <div className="w-full text-xs font-semibold text-gray-400 bg-gray-50 py-3.5 px-4 rounded-2xl border border-gray-100 flex flex-col gap-1.5 font-mono">
            <span>REFERENCE NUMBER</span>
            <span className="text-sm font-bold text-gray-700">{orderId}</span>
          </div>

          <p className="text-xs text-gray-400 mt-2">ขอบคุณที่ช้อปปิ้งกับศูนย์นวัตกรรมและเทคโนโลยีสารสนเทศ (DIIC)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-start py-8 px-4 font-['Prompt']">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col animate-in fade-in-50 duration-200">
        
        {/* Header decoration */}
        <div className="bg-[#F8C032] p-6 text-[#2B2B2B]">
          <h2 className="text-xl font-bold">แจ้งข้อมูลชำระเงิน</h2>
          <p className="text-xs font-medium text-[#2B2B2B]/70 mt-1">
            ออเดอร์อ้างอิง: {orderId}
          </p>
        </div>

        {/* Order Details Preview */}
        {order && (
          <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm font-bold text-[#2B2B2B]">
              <span>ยอดเงินที่ต้องโอน</span>
              <span className="text-lg text-[#E53935] font-extrabold">฿{order.totalPrice.toFixed(0)}</span>
            </div>
            
            <div className="text-xs text-gray-400 bg-white p-3 rounded-xl border border-gray-100 flex flex-col gap-1">
              <span className="font-bold text-[#2B2B2B]/60">รายการสินค้า:</span>
              <ul className="list-disc list-inside flex flex-col gap-0.5 mt-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="truncate font-medium text-gray-600">
                    {item.product.name} (x{item.quantity})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Submit Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              ชื่อ-นามสกุล ของคุณ
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรอกชื่อและนามสกุล"
              className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              เบอร์โทรศัพท์ติดต่อ
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
              className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              อีเมล (Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
            />
          </div>

          {/* Address Fields */}
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#2B2B2B]">ที่อยู่จัดส่ง</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                บ้านเลขที่ / อาคาร / ถนน / ซอย
              </label>
              <input
                type="text"
                required
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
                placeholder="เช่น 123/45 ซอยสุขุมวิท 21 ถนนสุขุมวิท"
                className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  ตำบล / แขวง
                </label>
                <input
                  type="text"
                  required
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  placeholder="ตำบล / แขวง"
                  className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  อำเภอ / เขต
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="อำเภอ / เขต"
                  className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  จังหวัด
                </label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="จังหวัด"
                  className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{5}"
                  maxLength="5"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  placeholder="รหัสไปรษณีย์"
                  className="h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F8C032] focus:ring-1 focus:ring-[#F8C032] transition-colors text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Slip upload field */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              สลิปการโอนเงิน
            </label>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 p-4 text-gray-400 hover:bg-gray-100 transition-colors">
                <ArrowUpTrayIcon className="w-8 h-8 text-gray-300" />
                <span className="text-xs font-semibold text-[#2B2B2B]/70">
                  {slip ? slip.name : "คลิกหรือแตะที่นี่เพื่ออัปโหลดรูปภาพสลิป"}
                </span>
                {slip && (
                  <span className="text-[10px] text-gray-400">
                    ขนาดจริง: {formatSize(originalSize)}
                  </span>
                )}
              </div>
            </div>

            {/* Compression Info */}
            {compressing && (
              <span className="text-xs text-[#F8C032] animate-pulse font-medium">
                🔄 กำลังบีบอัดรูปภาพให้เหมาะกับระบบ...
              </span>
            )}

            {compressedFile && !compressing && (
              <div className="text-[11px] text-[#2E7D32] bg-[#E8F5E9] p-2.5 rounded-xl border border-[#C8E6C9] flex items-center justify-between font-medium">
                <span>⚡ บีบอัดรูปภาพฝั่ง Client สำเร็จ</span>
                <span>{formatSize(compressedSize)} (-{Math.round(((originalSize - compressedSize) / originalSize) * 100)}%)</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || compressing}
            className={`h-12 rounded-2xl w-full font-bold text-base text-[#2B2B2B] shadow-md flex items-center justify-center gap-2 transition-all select-none
              ${
                submitting || compressing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#F8C032] hover:bg-[#F0B420] active:scale-95 cursor-pointer"
              }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#2B2B2B]"></div>
                <span>กำลังส่งข้อมูลการโอน...</span>
              </>
            ) : (
              <span>ส่งข้อมูลชำระเงิน</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
