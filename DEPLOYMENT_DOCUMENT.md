# คู่มือการติดตั้งและใช้งานระบบ (Deployment Document)
**โครงการระบบจัดจำหน่ายสินค้าผ่านตู้คีออส (DITC Shop Kiosk e-Commerce System)**

---

## ข้อกำหนดเบื้องต้นของสภาพแวดล้อม (Prerequisites)

* **Node.js**: เวอร์ชัน 18.x, 20.x หรือ 22.x ขึ้นไป
* **Package Manager**: `npm` (เวอร์ชัน 9.x ขึ้นไป) หรือ `pnpm` (เวอร์ชัน 8.x/10.x ขึ้นไป)
* **Docker & Docker Desktop**: สำหรับการจำลองและรัน Container สำหรับ PostgreSQL 16 (หรือ PostgreSQL Server 16.x ขึ้นไปกรณีติดตั้งโดยตรงบน Server)
* **Web Browser**: Google Chrome, Microsoft Edge หรือ Safari สำหรับแสดงผลหน้าตู้ Kiosk และ Admin Dashboard

---

## 1. การตั้งค่าตัวแปรสภาพแวดล้อม (Environment Configuration)

แอปพลิเคชันจะอ่านค่าการตั้งค่าระบบผ่านไฟล์ `.env` ที่อยู่ในไดเรกทอรี `backend/` และ `frontend/`

### 1.1 การตั้งค่าระบบหลังบ้าน (Backend Configuration: `backend/.env`)

ตัวแปรสภาพแวดล้อมที่จำเป็นต้องกำหนดในไฟล์ `backend/.env`:

```env
# พอร์ตสำหรับฝั่งบริการ Backend API
PORT=5001

# การเชื่อมต่อฐานข้อมูล PostgreSQL
DB_USER=ditc_kiosk
DB_HOST=localhost
DB_NAME=kiosk_db
DB_PASSWORD=12345Za
DB_PORT=5434

# คีย์สำหรับเข้ารหัสความปลอดภัย JWT Token
JWT_SECRET=dev-kiosk-jwt-secret-change-me-in-production

# โดเมนที่อนุญาตให้เข้าถึง API (CORS Origin)
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# การตั้งค่าระบบส่งอีเมลใบเสร็จรับเงิน (SMTP Configuration)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
EMAIL_FROM="DITC Shop Kiosk <no-reply@ditc-kiosk.com>"

# การตั้งค่าช่องทางการชำระเงิน (Omise Payment Gateway Sandbox)
PAYMENT_PROVIDER=omise
OMISE_PUBLIC_KEY=pkey_test_68oed5klfo9ud0dhfg3
OMISE_SECRET_KEY=skey_test_68oed5l3hip6s9v5i7h
```

### 1.2 การตั้งค่าระบบหน้าบ้าน (Frontend Configuration: `frontend/.env`)

ตัวแปรสภาพแวดล้อมที่จำเป็นสำหรับฝั่งลูกค้าร้านค้าและผู้ดูแลระบบ:

```env
# คีย์สาธารณะสำหรับ Omise Payment Gateway (ใช้สร้าง Token / Card Element)
VITE_OMISE_PUBLIC_KEY=pkey_test_68oed5klfo9ud0dhfg3
```

---

## 2. การจัดเตรียมโครงสร้างพื้นฐานจำลอง (Local Infrastructure Provisioning)

ระบบพัฒนาขึ้นโดยใช้บริการ PostgreSQL 16 เป็นฐานข้อมูลหลัก สามารถรันผ่าน Docker Compose เพื่อความสะดวกในการตั้งค่าสภาพแวดล้อม

### 2.1 การเตรียม Database ผ่าน Docker Compose

โครงสร้างในไฟล์ `docker-compose.yml` บริเวณ Root ของโปรเจกต์:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: kiosk-postgres
    restart: always
    environment:
      POSTGRES_USER: ditc_kiosk
      POSTGRES_PASSWORD: 12345Za
      POSTGRES_DB: kiosk_db
    ports:
      - "5434:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

#### ชุดคำสั่งควบคุม Docker:
* **เริ่มต้นการทำงาน (Start Container)**:
  ```bash
  docker compose up -d
  ```
* **ยุติการทำงาน (Stop & Remove Container)**:
  ```bash
  docker compose down
  ```

### 2.2 การนำเข้าตารางข้อมูลและข้อมูลเริ่มต้น (Database Schema & Seed Data)

กรณีต้องการนำเข้าโครงสร้างตารางข้อมูลและชุดข้อมูลเริ่มต้นด้วยตนเองผ่านคำสั่ง `psql`:

* **การสร้าง Schema ตารางข้อมูล (12 ตารางหลัก)**:
  ```bash
  psql -h localhost -p 5434 -U ditc_kiosk -d kiosk_db -f schema.sql
  ```
* **การนำเข้าข้อมูลเริ่มต้น (Seed Data - หมวดหมู่, สินค้าตัวอย่าง, บัญชีผู้ใช้)**:
  ```bash
  psql -h localhost -p 5434 -U ditc_kiosk -d kiosk_db -f seed.sql
  ```

*(หมายเหตุ: เมื่อเริ่มต้น Backend API ระบบจะมีการเรียกใช้ `initDb()` เพื่อตรวจสอบและอัปเดตตารางฐานข้อมูลโดยอัตโนมัติ)*

---

## 3. ขั้นตอนการเตรียมโครงสร้างฐานข้อมูล (Database Schema Details)

ตารางหลักในระบบประกอบด้วย:
1. `users`: ข้อมูลบัญชีผู้ดูแลระบบ (Admin) และพนักงาน (Staff)
2. `categories`: หมวดหมู่สินค้า
3. `products`: ข้อมูลสินค้า ราคา สต็อก ประเภทสินค้า (In Stock / Pre-Order) วันที่พร้อมส่ง
4. `product_images`: รูปภาพเพิ่มเติมของสินค้า
5. `orders`: รายการคำสั่งซื้อ สถานะการชำระเงิน รูปแบบการจัดส่ง (Pick Up / Delivery)
6. `order_items`: รายการสินค้าย่อยในแต่ละออเดอร์
7. `customer_profiles`: ประวัติข้อมูลลูกค้า (อ้างอิงด้วย Email)
8. `customer_addresses`: ประวัติที่อยู่จัดส่งสินค้าของลูกค้า (สูงสุด 3 ที่อยู่ต่อคน)
9. `order_shipments`: รายการและหมายเลขพัสดุจัดส่ง (Tracking Number รอบ 1 และ 2)
10. `screensavers`: สื่อโฆษณาภาพ/วิดีโอหน้าจอพัก Kiosk Idle Screen
11. `kiosk_stats`: สถิติการใช้งานระบบ
12. `system_settings`: การตั้งค่าระบบ เช่น ค่าจัดส่งปกติ ค่าจัดส่งแยก ข้อมูลติดต่อสอบถาม

---

## 4. กระบวนการสร้างและการรันแอปพลิเคชัน (Build & Run Process)

### 4.1 การติดตั้ง Dependencies

ดำเนินการติดตั้งแพ็กเกจที่จำเป็นสำหรับทั้ง Backend และ Frontend:

```bash
# ติดตั้ง Backend Dependencies
cd backend
npm install

# ติดตั้ง Frontend Dependencies
cd ../frontend
npm install
```

### 4.2 การเริ่มต้นระบบสำหรับสภาพแวดล้อมการพัฒนา (Development Mode)

* **รัน Backend API Server (Port 5001)**:
  ```bash
  cd backend
  npm run dev
  ```
  * Backend API จะทำงานที่: `http://localhost:5001/api`

* **รัน Frontend Client (Port 5173)**:
  ```bash
  cd frontend
  npm run dev
  ```
  * แอปพลิเคชันฝั่งหน้าตู้ Kiosk จะเปิดให้เข้าใช้งานที่: `http://localhost:5173`

### 4.3 การสร้าง Build และรันสำหรับ Production Mode

* **การ Build ฝั่ง Frontend**:
  ```bash
  cd frontend
  npm run build
  ```
  * ไฟล์ที่ผ่านการสกัดและย่อยขนาด (Optimized Bundle) จะถูกสร้างไว้ที่ไดเรกทอรี `frontend/dist/`

* **การเริ่มต้น Backend สำหรับ Production**:
  ```bash
  cd backend
  npm start
  ```

---

## 5. การปรับใช้จริงบน Staging และ Production (Production Deployment)

### 5.1 การปรับแต่งคอนฟิกสำหรับสภาพแวดล้อมจริง
1. **เปลี่ยนรหัสผ่านและคีย์ความปลอดภัย**:
   * เปลี่ยน `JWT_SECRET` เป็นข้อความแบบสุ่มความยาวไม่ต่ำกว่า 32 ตัวอักษร
   * เปลี่ยน `DB_PASSWORD` ให้เป็นรหัสผ่านที่รัดกุม
   * เปลี่ยน `OMISE_PUBLIC_KEY` และ `OMISE_SECRET_KEY` จากคีย์ Sandbox (`pkey_test_...`) เป็น Live Keys (`pkey_live_...`)
2. **จำกัดสิทธิ์ CORS (CORS Security)**:
   * ปรับแต่งค่า `CORS_ORIGIN` ใน `backend/.env` ให้ตรงกับโดเมนหรือ IP Address จริงของตู้ Kiosk เท่านั้น

### 5.2 การรัน Backend บริการด้วย PM2 Process Manager

ใช้ PM2 ในการจัดการ Process ของ Node.js เพื่อรองรับการ Restart อัตโนมัติเมื่อเกิดข้อผิดพลาดหรือ Server รีบูต:

```bash
# ติดตั้ง PM2 (หากยังไม่มีในระบบ)
npm install -g pm2

# เริ่มต้นการทำงานของ Backend API
cd backend
pm2 start src/server.js --name "kiosk-backend"

# การบันทึก Process list ให้ทำงานเมื่อรีบูทระบบ
pm2 save
pm2 startup
```

### 5.3 ตัวอย่างการตั้งค่า Nginx Web Server (Reverse Proxy)

สร้างไฟล์คอนฟิก Nginx ใน `/etc/nginx/sites-available/kiosk-ecommerce`:

```nginx
server {
    listen 80;
    server_name kiosk.yourdomain.com;

    # จัดเสิร์ฟไฟล์ Static ของ Frontend Build
    location / {
        root /var/www/kiosk-ecommerce/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # ส่งต่อ API Requests ไปยัง Backend Server (Port 5001)
    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # จัดเสิร์ฟไฟล์รูปภาพอัปโหลด (Uploads)
    location /uploads/ {
        proxy_pass http://127.0.0.1:5001/uploads/;
    }
}
```

---

## 6. คู่มือการเข้าใช้งานและตรวจสอบระบบ (System Verification & Usage Guide)

### 6.1 เส้นทางการเข้าใช้งานระบบ (URLs & Paths)

| ส่วนงาน | URL / Path | รายละเอียด |
| :--- | :--- | :--- |
| **หน้าตู้ Kiosk (Client UI)** | `http://localhost:5173/` | หน้าจอแคตตาล็อกสินค้า เลือกใส่ตะกร้า สแกนชำระเงิน |
| **หน้ากรอกที่อยู่จัดส่ง (Mobile)** | `http://localhost:5173/shipping-form` | เข้าใช้งานผ่านลิงก์ในอีเมลใบเสร็จเพื่อกรอกที่อยู่จัดส่ง |
| **เข้าสู่ระบบผู้ดูแล (Admin Login)** | `http://localhost:5173/admin/login` | เข้าสู่ระบบสำหรับ Admin / Staff |
| **แดชบอร์ดหลังบ้าน (Admin Dashboard)** | `http://localhost:5173/admin/dashboard` | สรุปยอดขาย สถิติ และการจัดการคิวสั่งซื้อ |
| **การจัดการสินค้า (Product Mgmt)** | `http://localhost:5173/admin/products` | เพิ่ม/แก้ไข สินค้า, Pre-Order, Purchase Limit |
| **สื่อโฆษณาพักหน้าจอ (Screensaver)** | `http://localhost:5173/admin/screensavers` | อัปโหลดและเปิดปิดสไลด์ภาพโฆษณาพักหน้าจอ |

### 6.2 บัญชีผู้ใช้เริ่มต้นสำหรับการทดสอบ (Default Accounts)

ข้อมูลการเข้าสู่ระบบเริ่มต้นจากไฟล์ `seed.sql`:

| Username | Password | Role | ชื่อแสดง |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | ผู้ดูแลระบบหลัก (System Admin) |
| `staff` | `staff123` | `staff` | พนักงานประจำตู้ (Kiosk Staff) |

---
