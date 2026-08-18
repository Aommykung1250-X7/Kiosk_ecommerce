import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import FeaturedProductModal from "../../components/admin/FeaturedProductModal";
import { notify, confirmDialog } from "../../components/notify";
import AdminNavbar from "../../components/admin/AdminNavbar";

export default function ScreensaverManagement() {
  const [screensavers, setScreensavers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [selectedId, setSelectedId] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(10);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);

  // Master Screen Config state
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [masterDuration, setMasterDuration] = useState(10);
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState("");

  useEffect(() => {
    // Check admin role
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
    fetchScreensavers();
    fetchConfig();
  }, [navigate]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/screensavers/config");
      if (res.ok) {
        const data = await res.json();
        setMasterEnabled(data.masterEnabled ?? true);
        setMasterDuration(data.masterDuration ?? 10);
        setFeaturedProductIds(data.featuredProductIds || []);
        setFeaturedProducts(data.featuredProducts || []);
      }
    } catch (err) {
      console.error("Error fetching screensaver config:", err);
    }
  };

  const handleSaveConfig = async (newProductIds = featuredProductIds) => {
    setSavingConfig(true);
    setConfigMessage("");
    try {
      const res = await fetch("/api/screensavers/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          masterEnabled,
          masterDuration,
          featuredProductIds: newProductIds
        })
      });
      if (!res.ok) throw new Error("ไม่สามารถบันทึกการตั้งค่าได้");
      setConfigMessage("บันทึกการตั้งค่าหน้าหลักระบบเรียบร้อยแล้ว");
      setTimeout(() => setConfigMessage(""), 3000);
      fetchConfig();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchScreensavers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/screensavers", { credentials: "include" });
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลสื่อโฆษณาได้");
      const data = await res.json();
      setScreensavers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setSelectedId(null);
    setTitle("");
    setDuration(10);
    setDisplayOrder(screensavers.length);
    setIsActive(true);
    setImageFile(null);
    setMediaUrl("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setModalMode("edit");
    setSelectedId(s.id);
    setTitle(s.title);
    setDuration(s.duration);
    setDisplayOrder(s.displayOrder);
    setIsActive(s.isActive);
    setImageFile(null);
    setMediaUrl(s.mediaUrl);
    setError("");
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check image extension
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      notify.warning("ขออภัย! ระบบอนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP) เท่านั้น");
      e.target.value = null;
      return;
    }
    setImageFile(file);
  };

  const handleUploadImage = async () => {
    if (!imageFile) return mediaUrl;

    setUploadProgress(true);
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const res = await fetch("/api/screensavers/upload", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      return data.image;
    } catch (err) {
      notify.error(err.message);
      throw err;
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let finalMediaUrl = mediaUrl;

      // Handle image upload if a file was selected
      if (imageFile) {
        finalMediaUrl = await handleUploadImage();
      }

      if (!finalMediaUrl) {
        setError("กรุณาเลือกไฟล์ภาพสำหรับโฆษณา");
        return;
      }

      const bodyData = {
        title,
        mediaUrl: finalMediaUrl,
        duration: parseInt(duration, 10),
        displayOrder: parseInt(displayOrder, 10),
        isActive
      };

      let res;
      if (modalMode === "add") {
        res = await fetch("/api/screensavers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(bodyData)
        });
      } else {
        res = await fetch(`/api/screensavers/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(bodyData)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");

      setIsModalOpen(false);
      fetchScreensavers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: "ลบสื่อโฆษณาหน้าจอพัก?",
      message: "คุณต้องการลบสื่อโฆษณาหน้าจอพักนี้ใช่หรือไม่?",
      confirmText: "ลบสื่อโฆษณา",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/screensavers/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบไม่สำเร็จ");
      fetchScreensavers();
    } catch (err) {
      notify.error(err.message);
    }
  };

  const handleToggleActive = async (s) => {
    try {
      const res = await fetch(`/api/screensavers/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !s.isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สลับสถานะไม่สำเร็จ");
      fetchScreensavers();
    } catch (err) {
      notify.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Prompt'] flex flex-col">
      {/* Top Navbar */}
      <AdminNavbar
        title="จัดการโฆษณาและหน้าจอพัก"
        subtitle="ระบบอัปโหลดและควบคุม Carousel Screensaver"
        icon={PhotoIcon}
      />

      {/* Main content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">

        {/* Section 1: Master Screen Config Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 rounded-3xl border border-amber-200/80 p-6 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F8C032] rounded-2xl flex items-center justify-center text-[#2B2B2B] shadow-sm">
                <SparklesIcon className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2B2B2B]">การตั้งค่าหน้าหลักระบบ (Master Screen Settings)</h2>
                <p className="text-xs text-gray-500">หน้าหลักระบบที่มีสินค้าแนะนำ + Live Clock ที่จะเล่นวนรวมกับสไลด์โฆษณา</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {configMessage && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  {configMessage}
                </span>
              )}

              <button
                onClick={() => handleSaveConfig()}
                disabled={savingConfig}
                className="px-5 py-2 bg-[#2B2B2B] hover:bg-black text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {savingConfig ? "กำลังบันทึก..." : "บันทึกการตั้งค่าหน้าหลัก"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Toggle & Duration controls */}
            <div className="bg-white rounded-2xl border border-amber-100 p-4 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-800">เปิดใช้ Master Screen</h3>
                  <p className="text-[11px] text-gray-400">เล่นหน้าหลักรวมใน Carousel สไลด์</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMasterEnabled(!masterEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    masterEnabled ? "bg-amber-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      masterEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-gray-700">ระยะเวลาแสดงผล:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={masterDuration}
                    onChange={(e) => setMasterDuration(parseInt(e.target.value, 10) || 10)}
                    className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-center text-gray-800 outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-gray-500">วินาที</span>
                </div>
              </div>
            </div>

            {/* Featured Products Selector Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-amber-100 p-4 flex flex-col gap-3 justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span>สินค้าแนะนำบน Master Screen</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {featuredProductIds.length} / 4 รายการ
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">เลือกสินค้าเฉพาะมาขึ้นการ์ดพรีวิวบนหน้าพักหน้าจอหลัก</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFeaturedModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <SparklesIcon className="w-4 h-4 stroke-[2]" />
                  <span>จัดการสินค้าแนะนำ</span>
                </button>
              </div>

              {/* Featured products preview cards */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((index) => {
                  const prod = featuredProducts[index];
                  return (
                    <div
                      key={index}
                      className={`h-16 rounded-xl border p-1.5 flex items-center gap-2 overflow-hidden ${
                        prod
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-dashed border-gray-200 bg-gray-50 justify-center"
                      }`}
                    >
                      {prod ? (
                        <>
                          <div className="w-8 h-8 min-w-[2rem] bg-white rounded-lg border border-amber-100 overflow-hidden flex items-center justify-center p-0.5">
                            {prod.image ? (
                              <img
                                src={prod.image.startsWith('/') || prod.image.startsWith('http') ? prod.image : `/uploads/products/${prod.image}`}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-xs">📦</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-gray-800 truncate">{prod.name}</p>
                            <p className="text-[10px] font-black text-amber-700">฿{parseFloat(prod.price).toLocaleString("th-TH")}</p>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] font-medium text-gray-400">Best Seller</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Ads Management Title & Action Bar */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-lg font-bold text-gray-800">รายการสื่อโฆษณาในระบบ Kiosk</h2>
            <p className="text-xs text-gray-400 mt-0.5">เฉพาะสื่อที่เป็นประเภทรูปภาพ (JPEG, PNG, WebP) เท่านั้น</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm cursor-pointer"
          >
            <PlusIcon className="w-5 h-5" />
            เพิ่มสื่อโฆษณาใหม่
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">กำลังโหลดรายการสื่อโฆษณา...</div>
        ) : screensavers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 shadow-sm flex flex-col items-center justify-center gap-3">
            <PhotoIcon className="w-16 h-16 text-gray-300" />
            <h3 className="text-gray-700 font-bold text-base">ยังไม่มีสื่อโฆษณาในระบบ</h3>
            <p className="text-gray-400 text-xs max-w-xs">
              ระบบจะแสดงหน้าต่างภาพศิลปะวัฒนธรรมล้านนาและรายการสินค้าขายดี (Wait Screen Fallback) เป็นค่าเริ่มต้นเมื่อไม่มีการอัปโหลดสื่อโฆษณาใดๆ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screensavers.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-200"
              >
                {/* Image Preview Box */}
                <div className="w-full aspect-[16/9] bg-gray-50 flex items-center justify-center border-b border-gray-100 relative group overflow-hidden">
                  <img
                    src={s.mediaUrl.startsWith("http") || s.mediaUrl.startsWith("blob") ? s.mediaUrl : `/uploads/screensavers/${s.mediaUrl}`}
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${
                      s.isActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-250"
                    }`}>
                      {s.isActive ? "กำลังแสดงผล (Active)" : "ปิดการใช้ (Inactive)"}
                    </span>
                  </div>
                </div>

                {/* Info and action panel */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base line-clamp-1">{s.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 font-medium">
                      <span>⏱️ ระยะเวลา: <strong className="text-gray-600">{s.duration} วินาที</strong></span>
                      <span>🔢 ลำดับที่: <strong className="text-gray-600">{s.displayOrder}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        s.isActive
                          ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          : "bg-[#F8C032]/10 text-[#F8C032] border-[#F8C032]/20 hover:bg-[#F8C032]/20"
                      }`}
                    >
                      {s.isActive ? (
                        <>
                          <EyeSlashIcon className="w-4 h-4" />
                          <span>ซ่อนการแสดงผล</span>
                        </>
                      ) : (
                        <>
                          <EyeIcon className="w-4 h-4" />
                          <span>เปิดการแสดงผล</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-gray-200"
                        title="แก้ไขข้อมูลโฆษณา"
                      >
                        <PencilIcon className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                        title="ลบสื่อโฆษณา"
                      >
                        <TrashIcon className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Screensaver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-gray-800 text-lg">
              {modalMode === "add" ? "เพิ่มสื่อโฆษณาหน้าจอพักใหม่" : "แก้ไขรายละเอียดสื่อโฆษณา"}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">หัวข้อโฆษณา</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น โฆษณาเทศกาลเชียงใหม่พรีเมียม"
                  className="w-full h-11 bg-gray-50 border border-gray-150 rounded-xl px-4 text-sm outline-none focus:border-[#F8C032] font-semibold text-gray-700 transition-all"
                />
              </div>

              {/* Media File Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase">
                  {modalMode === "add" ? "อัปโหลดรูปภาพโฆษณา" : "เปลี่ยนรูปภาพโฆษณา (เว้นว่างไว้เพื่อคงภาพเดิม)"}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  required={modalMode === "add" && !mediaUrl}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#F8C032]/10 file:text-[#F8C032] file:cursor-pointer hover:file:bg-[#F8C032]/20"
                />
                <span className="text-[10px] text-gray-400 font-medium">รองรับเฉพาะ JPEG, PNG และ WebP เท่านั้น (ไม่รวม MP4/วิดีโอ)</span>
              </div>

              {/* Side-by-side Duration & Order inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase">ระยะเวลาแสดงผล (วินาที)</label>
                  <input
                    type="number"
                    required
                    min={3}
                    max={60}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-11 bg-gray-50 border border-gray-150 rounded-xl px-4 text-sm outline-none focus:border-[#F8C032] font-semibold text-gray-700 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase">ลำดับการแสดงผล (Display Order)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full h-11 bg-gray-50 border border-gray-150 rounded-xl px-4 text-sm outline-none focus:border-[#F8C032] font-semibold text-gray-700 transition-all"
                  />
                </div>
              </div>

              {/* Status active Switch */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#F8C032] cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  เปิดการใช้งานสื่อโฆษณานี้ทันที (Active)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-250 text-gray-600 font-bold hover:bg-gray-100 text-sm transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress}
                  className="px-5 py-2.5 rounded-xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold text-sm shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {uploadProgress ? "กำลังอัปโหลด..." : "บันทึกสื่อโฆษณา"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Featured Products Selection Modal */}
      <FeaturedProductModal
        isOpen={isFeaturedModalOpen}
        onClose={() => setIsFeaturedModalOpen(false)}
        initialSelectedIds={featuredProductIds}
        onSave={(newIds) => {
          setFeaturedProductIds(newIds);
          handleSaveConfig(newIds);
        }}
      />
    </div>
  );
}
