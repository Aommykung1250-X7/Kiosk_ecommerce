# ระบบแจ้งเตือน (Notification System)

ระบบ toast + กล่องยืนยันกลางของ DITC Kiosk ใช้แทน `alert()`, `confirm()` และ `prompt()`
เขียนเองทั้งหมด ไม่มี dependency ภายนอกเพิ่ม (ใช้เฉพาะ `@heroicons/react` ที่โปรเจกต์มีอยู่แล้ว)

---

## การติดตั้ง

ติดตั้งไว้แล้วใน `src/App.jsx` — ครอบทั้งแอปด้วย `<NotificationProvider>` เพียงจุดเดียว

```jsx
import { NotificationProvider } from "./components/notify";

<NotificationProvider>
  <Router>...</Router>
</NotificationProvider>
```

`ToastViewport` และ `ConfirmDialog` ถูก render ผ่าน `createPortal` ไปที่ `document.body`
จึงไม่ถูก `overflow: hidden` หรือ stacking context ของหน้าใดบัง

---

## การเรียกใช้

```jsx
import { notify, confirmDialog } from "../components/notify";
```

> เส้นทาง import เป็นแบบ relative เพราะโปรเจกต์นี้ไม่ได้ตั้งค่า path alias (`@/`)
> - จาก `src/components/*` → `"./notify"`
> - จาก `src/components/admin/*` → `"../notify"`
> - จาก `src/pages/*` → `"../components/notify"`
> - จาก `src/pages/admin/*` → `"../../components/notify"`

### Toast

```js
notify.success("บันทึกข้อมูลสินค้าเรียบร้อยแล้ว");
notify.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
notify.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
notify.info("มีออเดอร์ใหม่เข้ามาในคิว");
```

รับ `Error` object ได้โดยตรง ระบบจะดึง `.message` ให้เอง:

```js
.catch((err) => notify.error(err));      // เทียบเท่ากับ notify.error(err.message)
```

**ตัวเลือกเพิ่มเติม** (พารามิเตอร์ตัวที่สอง)

| ตัวเลือก | ค่าเริ่มต้น | ความหมาย |
|---|---|---|
| `title` | ตามชนิด (เช่น "สำเร็จ") | หัวข้อของกล่อง |
| `duration` | `4000` | เวลาก่อนปิดเอง (ms) — ใส่ `0` เพื่อค้างไว้จนกดปิด |
| `id` | สร้างอัตโนมัติ | ระบุเองเพื่อ "อัปเดต" ข้อความเดิมแทนการเพิ่มใหม่ |

```js
notify.success("ส่งอีเมลแจ้งเลขพัสดุแล้ว", { title: "ยืนยันการจัดส่งสำเร็จ" });

const id = notify.info("กำลังอัปโหลด...", { duration: 0 });
await uploadFile();
notify.dismiss(id);
notify.success("อัปโหลดสำเร็จ!");
```

**ฟังก์ชันอื่น**

```js
notify.dismiss(id);      // ปิดอันที่ระบุ
notify.dismissAll();     // ปิดทั้งหมด
notify.configure({ position: "bottom-right", duration: 6000 });
```

`position` รองรับ: `top-left` `top-center` `top-right` `bottom-left` `bottom-center` `bottom-right`
(ค่าเริ่มต้น `top-right`)

### กล่องยืนยัน — แทน `confirm()`

คืนค่าเป็น `Promise<boolean>` จึงต้องใส่ `await` และฟังก์ชันที่เรียกต้องเป็น `async`

```js
const handleDelete = async (id) => {
  const confirmed = await confirmDialog({
    title: "ลบสินค้าชิ้นนี้?",
    message: "คุณต้องการลบสินค้าชิ้นนี้จริงหรือไม่? ข้อมูลและรูปภาพทั้งหมดจะถูกลบออกจากระบบ",
    confirmText: "ลบสินค้า",
    cancelText: "ยกเลิก",
    variant: "danger",
  });
  if (!confirmed) return;

  await fetch(`/api/products/${id}`, { method: "DELETE" });
  notify.success("ลบสินค้าสำเร็จ!");
};
```

| ตัวเลือก | ค่าเริ่มต้น | ความหมาย |
|---|---|---|
| `title` | `"ยืนยันการทำรายการ"` | หัวข้อ (ใช้เป็น `aria-labelledby` ด้วย) |
| `message` | `""` | ข้อความอธิบาย |
| `confirmText` | `"ยืนยัน"` | ข้อความปุ่มยืนยัน |
| `cancelText` | `"ยกเลิก"` | ข้อความปุ่มยกเลิก |
| `variant` | `"danger"` | `danger` \| `warning` \| `primary` \| `info` |
| `dismissOnBackdrop` | `true` ยกเว้น `danger` | คลิกฉากหลังแล้วปิดได้หรือไม่ |

`variant: "danger"` จะปิดการคลิกฉากหลังโดยอัตโนมัติ และเพิ่มข้อความเตือน
"การกระทำนี้ไม่สามารถย้อนกลับได้" ใต้เนื้อหา

---

## Design tokens ที่ใช้

ประกาศไว้ใน `src/index.css` ภายใต้ `@theme` (Tailwind v4) — สกัดจากสีที่ใช้จริงทั่วโปรเจกต์

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--color-brand` | `#F8C032` | ปุ่มยืนยัน variant `primary` |
| `--color-brand-hover` | `#F0B420` | สถานะ hover ของปุ่มหลัก |
| `--color-ink` | `#2B2B2B` | ตัวอักษรเนื้อหา |
| `--color-surface-dark` | `#1B1B1C` | หัวกล่องยืนยัน, หัวข้อ toast |
| `--color-danger` | `#E53935` | toast error, ปุ่มลบ |
| `--color-warning` | `#E65100` | toast warning |
| `--color-success` | `#2E7D32` | toast success |
| `--color-info` | `#5EBAA8` | toast info |

ใช้เป็น utility ได้ตามปกติ: `bg-brand`, `text-ink`, `border-l-danger`, `bg-success/10`

**หมายเหตุเรื่องโหมดมืด:** โปรเจกต์นี้ยังไม่มีกลไกโหมดมืด (ไม่มี `dark:` variant,
ไม่มี `data-theme`, ไม่มี `prefers-color-scheme`) ระบบแจ้งเตือนจึงใช้โทนสว่างอย่างเดียว
ให้ตรงกับหน้าจออื่นทั้งหมด หากภายหลังเพิ่มโหมดมืด ให้แก้เฉพาะ `@theme` ใน `index.css`

---

## ระดับ z-index

| ระดับ | ใช้กับ |
|---|---|
| 10–30 | เนื้อหาในหน้า, แถบนำทาง, dropdown |
| 40 | ปุ่มลอยเหนือเนื้อหา |
| 50 | โมดัลและ overlay เดิมทั้งหมด |
| 60 | overlay เต็มจอของหน้า Home |
| **70** | **กล่องยืนยันของระบบนี้** |
| **80** | **toast ของระบบนี้** (อยู่บนสุดเสมอ ให้เห็นแม้ขณะเปิดโมดัล) |

---

## การจัดวางบนหน้าจอ

`ToastViewport` วัดกรอบ `.kiosk-app-container` ด้วย `useLayoutEffect` + `ResizeObserver`

- **หน้า Home (ตู้คีออส)** — บนจอเดสก์ท็อปตัวตู้กว้าง 600px จัดกึ่งกลาง
  toast จะถูกจัดให้อยู่ในกรอบตู้ ไม่หลุดไปลอยบนพื้นหลังสีเข้ม
- **หน้าแอดมิน / มือถือ** — ไม่มีกรอบนี้ จึงอ้างอิงขนาดหน้าจอทั้งหมด
- **จอแคบกว่า 640px** — toast กว้างเต็มพื้นที่โดยเว้นขอบข้างละ 16px และจัดกึ่งกลางเสมอ
- เว้นระยะด้านบน 96px เพื่อไม่ให้ทับ `Header` (สูง 88px) และแถบนำทางของหน้าแอดมิน
- แสดงพร้อมกันสูงสุด 4 อัน เกินกว่านั้นตัวเก่าสุดจะถูกดันออก

**หน้า OrderQueue** มีระบบ toast ของตัวเองสำหรับแจ้งออเดอร์ใหม่ผ่าน SSE
ระบบนั้นถูกย้ายไปมุมล่างขวา (`bottom-6 right-6`) เพื่อไม่ให้ชนกับระบบกลางที่อยู่มุมบนขวา

---

## การเข้าถึง (Accessibility)

**Toast**
- `role="status"` พร้อม `aria-live="polite"` — ยกเว้นชนิด `error` ที่ใช้ `assertive`
- `aria-atomic="true"` ให้โปรแกรมอ่านหน้าจออ่านข้อความทั้งก้อน
- ปุ่มปิดมี `aria-label="ปิดการแจ้งเตือน"`
- หยุดนับเวลาเมื่อเอาเมาส์ไปวาง **และเมื่อโฟกัสด้วยคีย์บอร์ด** (`onFocusCapture`)

**กล่องยืนยัน**
- `role="dialog"` + `aria-modal="true"`
- `aria-labelledby` ผูกกับหัวข้อ และ `aria-describedby` ผูกกับข้อความ (ผ่าน `useId`)
- ขังโฟกัสไว้ในกล่อง วน Tab / Shift+Tab หัวท้าย
- โฟกัสเริ่มต้นอยู่ที่ปุ่ม **ยกเลิก** — ปลอดภัยกว่าสำหรับการกระทำที่ลบข้อมูล
- กด ESC เพื่อปิด (ได้ผลลัพธ์ `false`)
- คืนโฟกัสกลับไปยังปุ่มที่ผู้ใช้กดก่อนเปิดกล่อง
- ล็อกการเลื่อนหน้าจอด้านหลังขณะเปิด

**แอนิเมชัน** — ทุกแอนิเมชันอยู่ในช่วง 200–260ms ใช้ easing `cubic-bezier(0.16, 1, 0.3, 1)`
และถูกลดเหลือ 1ms อัตโนมัติภายใต้ `@media (prefers-reduced-motion: reduce)`
ส่วนแถบเวลาจะหยุดนิ่งแทนการเคลื่อนไหว

---

## โครงสร้างไฟล์

```
src/components/notify/
├── index.js                  จุด import หลัก (notify, confirmDialog, NotificationProvider)
├── notifyStore.js            store กลางนอก React + API เรียกตรง
├── NotificationProvider.jsx  เชื่อม store เข้า React ผ่าน useSyncExternalStore + portal
├── ToastViewport.jsx         จัดตำแหน่ง/วัดกรอบตู้คีออส และเรียงกอง toast
├── Toast.jsx                 toast หนึ่งใบ (ไอคอน, แถบเวลา, ปุ่มปิด)
├── ConfirmDialog.jsx         กล่องยืนยัน
├── useFocusTrap.js           hook ขังโฟกัส + ESC + คืนโฟกัส
└── README.md                 เอกสารนี้
```

แอนิเมชันและ design tokens อยู่ใน `src/index.css`

---

## หน้าสาธิต

เปิด **`/dev/notifications`** เพื่อดูการแจ้งเตือนครบทุกชนิด
ทั้ง toast 4 ชนิด, ตัวเลือกเพิ่มเติม, การเปลี่ยนตำแหน่ง 6 มุม, กล่องยืนยัน 4 รูปแบบ
และตัวอย่างการใช้งานจริงแบบ ยืนยัน → เรียก API → แจ้งผล

ไฟล์: `src/pages/NotificationDemo.jsx`
