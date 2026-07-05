// frontend/src/pages/admin/ProductManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightOnRectangleIcon, ClipboardDocumentListIcon, Squares2X2Icon, TagIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const CATEGORIES = [
  { id: "drinks", name: "เครื่องดื่ม" },
  { id: "snacks", name: "ขนมขบเคี้ยว" },
  { id: "instant", name: "บะหมี่กึ่งสำเร็จรูป" },
  { id: "stationery", name: "เครื่องเขียน" }
];

const IMAGES = ["water", "cola", "chips", "wafer", "noodle", "milo", "pen", "notebook"];

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  
  // State สำหรับควบคุม Modal ฟอร์ม
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // NULL = สร้างใหม่, มีค่า = แก้ไขตาม ID นั้น
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "drinks",
    image: "water",
    promotion: false,
    pickupLocation: "",
    status: "In Stock"
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // แท็บทำงาน: products = จัดการสินค้า, users = จัดการพนักงาน
  const [activeTab, setActiveTab] = useState("products");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "staff",
    name: ""
  });

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      setCurrentUser(JSON.parse(userString));
    }
    fetchProducts();
  }, []);

  // ดึงข้อมูลเมื่อแท็บสมาชิกเปิดทำงาน
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error("ไม่สามารถเรียกรายการสินค้าได้");
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/auth/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถดึงข้อมูลรายชื่อพนักงานได้");
      setUsers(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกรายชื่อพนักงาน");

      alert("เพิ่มพนักงานสำเร็จ!");
      setIsUserModalOpen(false);
      setUserForm({ username: "", password: "", role: "staff", name: "" });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("คุณต้องการลบบัญชีผู้ใช้งานนี้จริงหรือไม่?")) {
      return;
    }
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการลบพนักงาน");

      alert("ลบพนักงานสำเร็จ!");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "drinks",
      image: "water",
      promotion: false,
      pickupLocation: "",
      status: "In Stock"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock || p.quantity || 0, // รองรับกรณีฟิลด์ทับซ้อน
      category: p.category || "drinks",
      image: p.image || "water",
      promotion: p.promotion || false,
      pickupLocation: p.pickupLocation || "",
      status: p.status || "In Stock"
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    // ปรับชนิดตัวเลข
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกสินค้า");

      alert(editingId ? "แก้ไขสินค้าสำเร็จ!" : "เพิ่มสินค้าใหม่สำเร็จ!");
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("คุณต้องการลบสินค้าชิ้นนี้จริงหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการลบสินค้า");

      alert("ลบสินค้าสำเร็จ!");
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/ditc-portal-to-manager");
  };

  // คำนวณสถิติ
  const totalProducts = products.length;
  const outOfStock = products.filter(p => (p.stock || p.quantity) <= 0).length;
  const lowStock = products.filter(p => {
    const qty = p.stock || p.quantity;
    return qty > 0 && qty <= 5;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 font-['Prompt'] flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F8C032]/10 rounded-xl flex items-center justify-center text-[#F8C032]">
            <Squares2X2Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2B2B2B]">ระบบจัดการสินค้าหน้าร้าน</h1>
            <p className="text-xs text-gray-400">ผู้จัดเตรียมสต็อกและคลังสินค้า (Admin/Manager)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/orders")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 hover:text-[#2B2B2B] font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            <ClipboardDocumentListIcon className="w-4.5 h-4.5" />
            <span>ไปหน้าจัดการคิว</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-red-600 font-semibold bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4.5 h-4.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">สินค้าทั้งหมด</span>
            <span className="text-3xl font-black text-gray-700">{totalProducts} รายการ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">สินค้าหมดสต็อก</span>
            <span className="text-3xl font-black text-red-600">{outOfStock} รายการ</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">สินค้าใกล้หมด (เหลือน้อยกว่า 5)</span>
            <span className="text-3xl font-black text-orange-500">{lowStock} รายการ</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 gap-6 mt-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 font-bold text-sm border-b-2 px-1 transition-all ${
              activeTab === "products"
                ? "border-[#F8C032] text-[#2B2B2B]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            จัดการคลังสินค้า
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 font-bold text-sm border-b-2 px-1 transition-all ${
              activeTab === "users"
                ? "border-[#F8C032] text-[#2B2B2B]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            จัดการพนักงาน & สมาชิก
          </button>
        </div>

        {activeTab === "products" ? (
          <>
            {/* Action Header for Products */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">คลังสินค้า Kiosk Shop</h2>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm"
              >
                <PlusIcon className="w-5 h-5" />
                เพิ่มสินค้าใหม่
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Table list */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">กำลังโหลดสินค้า...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="py-4 px-6">ชื่อสินค้า</th>
                        <th className="py-4 px-6">หมวดหมู่</th>
                        <th className="py-4 px-6">ราคา</th>
                        <th className="py-4 px-6">จำนวนสต็อก</th>
                        <th className="py-4 px-6">สถานะ</th>
                        <th className="py-4 px-6 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {products.map((p) => {
                        const stockVal = p.stock !== undefined ? p.stock : (p.quantity || 0);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6 flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 font-mono capitalize">
                                {p.image.slice(0, 3)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">{p.name}</span>
                                {p.promotion && (
                                  <span className="text-[10px] font-bold text-[#2B2B2B] bg-[#F8C032] py-0.5 px-2 rounded-full w-max flex items-center gap-0.5 mt-0.5">
                                    <TagIcon className="w-3 h-3" /> PROMO
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 capitalize">
                              {CATEGORIES.find(c => c.id === p.category)?.name || p.category}
                            </td>
                            <td className="py-4 px-6 font-bold text-gray-800">฿{parseFloat(p.price).toFixed(0)}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className={stockVal <= 0 ? "text-red-600" : stockVal <= 5 ? "text-orange-500" : "text-gray-800"}>
                                  {stockVal} ชิ้น
                                </span>
                                {stockVal <= 5 && (
                                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 shrink-0" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                p.status === "In Stock" 
                                  ? "bg-green-50 text-green-700 border border-green-150" 
                                  : "bg-orange-50 text-orange-700 border border-orange-150"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleOpenEditModal(p)}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                  <PencilIcon className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <TrashIcon className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* User Management Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">บัญชีพนักงานร้านค้า CAMT</h2>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold rounded-xl active:scale-95 transition-all text-sm shadow-sm"
              >
                <PlusIcon className="w-5 h-5" />
                เพิ่มพนักงานใหม่
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-20 text-gray-400">กำลังโหลดบัญชีผู้ใช้งาน...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="py-4 px-6">ชื่อ-นามสกุล</th>
                        <th className="py-4 px-6">ชื่อบัญชีผู้ใช้ (Username)</th>
                        <th className="py-4 px-6">ตำแหน่งสิทธิ์ (Role)</th>
                        <th className="py-4 px-6">วันที่สร้างบัญชี</th>
                        <th className="py-4 px-6 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-gray-800">{u.name}</td>
                          <td className="py-4 px-6 font-mono text-xs">{u.username}</td>
                          <td className="py-4 px-6">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              u.role === "admin" 
                                ? "bg-purple-50 text-purple-700 border border-purple-150" 
                                : "bg-blue-50 text-blue-700 border border-blue-150"
                            }`}>
                              {u.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "พนักงาน (Staff)"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center">
                              {currentUser?.id !== u.id ? (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <TrashIcon className="w-4.5 h-4.5" />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 italic">บัญชีคุณในปัจจุบัน</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Edit/Add Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? "แก้ไขรายละเอียดสินค้า" : "เพิ่มสินค้าชิ้นใหม่ในคลัง"}
              </h3>
              <p className="text-xs text-gray-400">กรอกข้อมูลให้ครบถ้วนเพื่ออัปเดตลงระบบคีออส</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">ชื่อสินค้า (Name)</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="กรอกชื่อภาษาไทย..."
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">รายละเอียดสินค้า (Description)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="กรอกรายละเอียดสั้นๆ..."
                  className="w-full h-20 py-2 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">ราคา (Price)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">จำนวนสต็อก (Stock Count)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">หมวดหมู่ (Category)</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-3 text-sm outline-none transition-all"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">คีย์ภาพประกอบ (Illustration Key)</label>
                <select
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-3 text-sm outline-none transition-all capitalize"
                >
                  {IMAGES.map(img => <option key={img} value={img}>{img}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">จุดรับสินค้า (Pickup Location)</label>
                <input
                  type="text"
                  value={form.pickupLocation}
                  onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                  placeholder="เช่น ตู้จำหน่ายสินค้า A ชั้น 1"
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">สถานะสินค้า (Status)</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-3 text-sm outline-none transition-all"
                >
                  <option value="In Stock">พร้อมจำหน่าย (In Stock)</option>
                  <option value="Pre-Order">สั่งจองล่วงหน้า (Pre-Order)</option>
                </select>
              </div>

              <div className="col-span-2 flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="promotion"
                  checked={form.promotion}
                  onChange={(e) => setForm({ ...form, promotion: e.target.checked })}
                  className="w-4 h-4 text-[#F8C032] focus:ring-[#F8C032]"
                />
                <label htmlFor="promotion" className="text-xs font-semibold text-gray-600 cursor-pointer">
                  เป็นสินค้าโปรโมชั่น (Promotion Product)
                </label>
              </div>

              <div className="col-span-2 flex items-center justify-end gap-3 mt-4 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B2B2B] font-semibold transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold transition-all text-sm shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal Overlay */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                เพิ่มบัญชีพนักงานใหม่
              </h3>
              <p className="text-xs text-gray-400">สร้างบัญชีสำหรับพนักงาน (Staff) หรือผู้จัดการ (Admin)</p>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">ชื่อ-นามสกุลพนักงาน (Display Name)</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">ชื่อบัญชีผู้ใช้ (Username)</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="เช่น staff3"
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">รหัสผ่านสำหรับล็อกอิน (Password)</label>
                <input
                  type="password"
                  required
                  min={4}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="กำหนดรหัสผ่าน..."
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-4 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">สิทธิ์ของบัญชีนี้ (Account Role)</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full h-11 bg-gray-50 border border-gray-100 focus:border-[#F8C032] rounded-xl px-3 text-sm outline-none transition-all"
                >
                  <option value="staff">พนักงาน (Staff / Runner)</option>
                  <option value="admin">ผู้ดูแลระบบ (Admin / Manager)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B2B2B] font-semibold transition-all text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-[#F8C032] hover:bg-[#F0B420] text-[#2B2B2B] font-bold transition-all text-sm shadow-sm"
                >
                  เพิ่มพนักงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
