# Deployment branches

| Branch | ปลายทาง | การชำระเงิน |
| --- | --- | --- |
| `main` | dev2 / Docker / Portainer | ปิด checkout และ webhook ชำระเงิน รอเชื่อมกรุงไทย |
| `pm2` | VPS / Node / PM2 แบบเดิม | คงโค้ด Omise เดิมและอ่านคีย์จาก environment ของ VPS |

`pm2` ใช้ commit `8fcc80b` ซึ่งเป็นเวอร์ชันใน repository ก่อนเพิ่มชุด deployment สำหรับ dev2 เป็นฐาน ไม่ได้ดึง source หรือ `.env` จาก VPS จริง ทั้งสอง branch merge ดีไซน์จาก `frontend` commit `871b1c0` และมีฟังก์ชันตั้งเวลาพักหน้าจอเหมือนกัน

## ตั้งเวลาพักหน้าจอ

เข้า **หน้าจอพักและโฆษณา → พักหน้าจอเมื่อไม่มีการใช้งาน** กรอกจำนวนเต็ม 1–60 นาที แล้วกด **บันทึกการตั้งค่าหน้าจอหลัก** ค่าเริ่มต้นคือ 4 นาที

ค่านี้แยกจากเวลาที่แสดงโฆษณาแต่ละสไลด์ ซึ่งใช้หน่วยวินาที เก็บค่าใหม่ในตาราง `system_settings` ด้วย key `screensaver_idle_timeout_minutes` ตู้จะอ่านเมื่อเปิดหน้า ได้ focus และทุก 1 นาที เมื่อได้ค่าใหม่จะเริ่มรอบนับ inactivity ใหม่ การอยู่ในขั้นตอนชำระเงินยังหยุดนับ idle ตามเดิม

อัปเดตทั้ง backend และ frontend จึงจะตั้งค่าใหม่ได้ครบ การเริ่ม backend เติม setting ที่ยังไม่มีด้วยค่า 4 โดยไม่ทับค่าที่เคยบันทึก ไม่ต้องล้าง DB หรือรัน seed SQL

## อัปเดต dev2

ใช้ source จาก `main` รัน **Build dev2 images** บน GitHub Actions แล้วเปลี่ยน image references ใน Stack เดิมบน dev2 คง volume, DB credentials และ JWT secret เดิม ดูขั้นตอนใน `docs/operations/dev2-deployment.md`

## อัปเดต VPS เดิม

1. ตรวจ `git status` และเก็บไฟล์/commit เฉพาะเซิร์ฟเวอร์ไว้ก่อนเปลี่ยน branch ห้าม reset ทับงานบน VPS
2. ใช้ branch `pm2` และคง `.env`/environment เดิมของ VPS โดยเฉพาะ `PAYMENT_PROVIDER=omise`, คีย์ Omise, DB, JWT และ SMTP
3. สำรอง DB ก่อน restart backend เพราะ `initDb()` ของระบบเดิมมี migration อยู่แล้ว
4. ติดตั้ง dependencies ด้วย `npm ci` ใน backend/frontend, รัน `npm run build` ใน frontend แล้ว deploy ไฟล์ dist ด้วยวิธีเดิมของ VPS
5. Restart process เดิมใน PM2; ไม่ต้องสร้าง process ซ้ำ ตรวจ logs และทดสอบเว็บ/หลังบ้านตามขั้นตอนเดิม

การแยก branch นี้ไม่ได้ deploy หรือทดสอบธุรกรรมเงินจริงบน VPS ให้อัตโนมัติ ค่าลับของแต่ละเซิร์ฟเวอร์ไม่รวมอยู่ใน commits ใหม่

## พัฒนาต่อ

นำ commit ของฟีเจอร์ร่วม เช่น UI หรือ config ไปใช้ทั้งสอง branch โดยเลือกเฉพาะ commit นั้น เก็บการตั้งค่า Docker/dev2 และการเปิด Omise ของ VPS ไว้ใน branch ที่เกี่ยวข้อง
