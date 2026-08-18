# Kiosk_ecommerce
ngrok http 5001

http://localhost:5173/ditc-portal-to-manager

---

## 📌 ตำแหน่งโค้ดปุ่มรีเซ็ตสถิติทดสอบชั่วคราว (Temporary Reset Buttons)

หากต้องการลบโค้ดปุ่มรีเซ็ตจำนวนผู้เข้าใช้งาน (Visitor Count) และยอดการเข้าชมสินค้า (Product Views) ออกในอนาคต สามารถตามลบได้ที่ตำแหน่งต่อไปนี้:

### 1. 🖥️ ฝั่ง Frontend (`frontend/src/pages/admin/ProductManagement.jsx`)
* **ฟังก์ชัน Handler สำหรับยิง API**:
  * [ProductManagement.jsx (บรรทัดที่ 308 - 343)](file:///Users/papitch/Documents/Kiosk_DITC/Kiosk_ecommerce/frontend/src/pages/admin/ProductManagement.jsx#L308-L343)
  * ฟังก์ชัน: `handleResetVisitorCount` และ `handleResetProductViews`
* **การ์ดแสดงผลปุ่มกดบนหน้า UI (เมนูตั้งค่าระบบ)**:
  * [ProductManagement.jsx (บรรทัดที่ 1188 - 1221)](file:///Users/papitch/Documents/Kiosk_DITC/Kiosk_ecommerce/frontend/src/pages/admin/ProductManagement.jsx#L1188-L1221)
  * บล็อกแท็ก JSX: `{/* TEMPORARY RESET TOOLS CARD */}`

### 2. ⚙️ ฝั่ง Backend
* **Controller**:
  * [settingController.js (บรรทัดที่ 87 - 114)](file:///Users/papitch/Documents/Kiosk_DITC/Kiosk_ecommerce/backend/src/controllers/settingController.js#L87-L114)
  * ฟังก์ชัน: `resetVisitorCount` และ `resetProductViews`
* **Routes**:
  * [settingRoutes.js (บรรทัดที่ 60 - 64)](file:///Users/papitch/Documents/Kiosk_DITC/Kiosk_ecommerce/backend/src/routes/settingRoutes.js#L60-L64)
  * เส้นทาง API: `POST /api/settings/reset-visitors` และ `POST /api/settings/reset-product-views`