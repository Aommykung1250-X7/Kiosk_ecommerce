# Deploy เว็บ DITC Kiosk บน dev2

ชุดนี้ใช้สำหรับเปิดโดเมน `http://ditckiosk.camt.cmu.ac.th` เพื่อเตรียมขอ Payment Gateway กรุงไทย เว็บและหลังบ้านทำงานได้ แต่ production จะตอบ `503` เมื่อสร้างออเดอร์ และไม่เปิด webhook/endpoint จำลองการชำระเงิน จนกว่าจะพัฒนาและตรวจสอบการเชื่อมต่อกรุงไทยเสร็จ ไม่ต้องมีคีย์ Omise หรือ API ขนส่ง

## ไฟล์และโครงสร้าง

- `compose.dev2.yml`: ไฟล์สำหรับวางใน Portainer Stack โดยใช้ image ที่ build แล้ว
- `compose.dev2.build.yml`: override สำหรับ build บนเครื่องที่มี Docker เท่านั้น
- `.env.example`: รายการ environment สำหรับ Stack; คัดลอกเป็น root `.env` ถ้ารัน Compose บนเครื่อง
- `frontend/Dockerfile` และ `frontend/nginx.conf`: build React และเสิร์ฟด้วย Nginx; รองรับ deep link, `/api`, `/uploads`, และ SSE
- `backend/Dockerfile`: API รันด้วย user `node`; ไม่บรรจุ `.env`, รูปเดิม, database dump หรือข้อมูลลูกค้า
- `.github/workflows/dev2-images.yml`: ปุ่ม build/push image บน GitHub Actions รองรับ Linux amd64/arm64; ไม่ deploy ไป dev2 อัตโนมัติ

เปิด host port `11780` เข้า Nginx port `80` เท่านั้น ส่วน API port `5000` และ PostgreSQL port `5432` อยู่ภายใน network ของ Stack มี named volume `pgdata` สำหรับ DB และ `uploads` สำหรับรูป

ชุดนี้ใช้กับ **Docker Standalone/Compose** ใน Portainer หาก endpoint ของ dev2 เป็น Swarm ให้ปรับเรื่อง dependency และตำแหน่งเก็บ volume ก่อน deploy

## วิธีเร็วสุด: build image บน GitHub

1. นำการแก้ไขชุดนี้ขึ้น repository โดยไม่รวม `backend/.env` หรือข้อมูลสำรอง
2. เปิด GitHub → Actions → **Build dev2 images** → Run workflow จาก commit ที่ต้องการ deploy
3. รอ job `verify` และ image ทั้งสองตัวสำเร็จ ดูชื่อ image ใน Summary เช่น:

   ```dotenv
   KIOSK_WEB_IMAGE=ghcr.io/aommykung1250-x7/kiosk_ecommerce-web:<commit-sha>
   KIOSK_API_IMAGE=ghcr.io/aommykung1250-x7/kiosk_ecommerce-api:<commit-sha>
   ```

4. ถ้า package เป็น private ให้เพิ่ม GHCR registry ใน Portainer ด้วยบัญชีที่มีสิทธิ์อ่าน package และ token `read:packages` ที่เหมาะกับบัญชีนั้น อย่าใส่ token ใน Compose อย่าเปลี่ยน image เป็น public โดยไม่ได้ตั้งใจ

ถ้ามี Docker บนเครื่อง สามารถ build แล้ว push แทน workflow ได้ หลังกรอก `.env` และ login registry:

```sh
docker compose -f compose.dev2.yml -f compose.dev2.build.yml config --quiet
docker compose -f compose.dev2.yml -f compose.dev2.build.yml build
docker compose -f compose.dev2.yml -f compose.dev2.build.yml push
```

วิธี local นี้สร้าง image สำหรับ architecture ของเครื่องที่ build ถ้าเป็น Mac ARM แต่ dev2 ใช้ amd64 ให้ใช้ workflow ที่สร้างทั้งสอง architecture

## ตั้งค่า Stack บน dev2

1. เข้า dev2 → Primary → Stacks → Add stack ตั้งชื่อ `ditc-kiosk` ใช้ชื่อเดิมนี้ทุกครั้งที่อัปเดตเพื่อคง volume เดิม
2. วางเนื้อหา **เฉพาะ `compose.dev2.yml`** ใน Web editor
3. ใส่ environment variables ต่อไปนี้:

   | ตัวแปร | ค่า |
   | --- | --- |
   | `KIOSK_WEB_IMAGE` | image เว็บจาก workflow |
   | `KIOSK_API_IMAGE` | image API จาก workflow |
   | `WEB_PORT` | `11780` |
   | `APP_ORIGIN` | `http://ditckiosk.camt.cmu.ac.th` |
   | `DB_NAME` | `kiosk_db` |
   | `DB_USER` | `ditc_kiosk` |
   | `DB_PASSWORD` | สร้างรหัสใหม่สำหรับ production |
   | `JWT_SECRET` | สุ่มค่าใหม่ แยกจากรหัส DB |

   สุ่ม JWT secret บนเครื่องที่มี Node ด้วย `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` แล้วกรอกใน Stack ด้วยตนเอง

4. ตั้งค่า `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM` เมื่อจะใช้การส่งอีเมล ไม่จำเป็นสำหรับเปิดหน้าเว็บครั้งแรก
5. กด Deploy the Stack รอ `db`, `backend`, `web` เป็น healthy แล้วดู logs ว่า schema initialization สำเร็จ
6. ให้ IT ชี้โดเมนที่ยืนยันแล้วมาที่ host port `11780` หาก IT เปิด HTTPS ให้เปลี่ยน `APP_ORIGIN` เป็น `https://ditckiosk.camt.cmu.ac.th` และอัปเดต Stack ก่อนทดสอบ login อีกครั้ง

`APP_ORIGIN` เป็น origin เดียวที่ใช้สำหรับ CORS และลิงก์ในอีเมล ต้องไม่มี path หรือ `/` ท้ายค่า Nginx ส่งต่อ `X-Forwarded-Proto: https` จาก proxy ของ IT ได้ ส่วน API trust proxy หนึ่ง hop คือ Nginx ของ Stack หาก IT มี proxy เพิ่มอยู่หน้า Nginx ควรให้ IT ช่วยตั้ง trusted real IP ให้ถูกต้องเพื่อไม่ให้ผู้ใช้ทั้งหมดใช้โควตา rate limit ร่วมกัน ห้ามเปิด API ออก host โดยตรง

## ฐานข้อมูลใหม่และบัญชีหลังบ้าน

เปิดโดเมนครั้งแรกด้วยฐานข้อมูลว่างได้ ระบบจะสร้าง schema และค่าเริ่มต้น แต่ยังไม่มีสินค้าและผู้ใช้ ถ้าจะย้าย DB เดิม ให้ทำส่วนย้ายข้อมูลด้านล่างและใช้บัญชีที่มีใน DB เดิม

ถ้าเริ่มฐานข้อมูลใหม่ ให้เปิด Console ของ container **backend** ที่ `/app` แล้วสร้าง admin โดยอ่านรหัสแบบไม่แสดงบนจอ:

```sh
printf 'Admin username: '; read -r ADMIN_USERNAME; export ADMIN_USERNAME
printf 'Admin display name: '; read -r ADMIN_NAME; export ADMIN_NAME
printf 'Admin password: '; stty -echo; read -r ADMIN_PASSWORD; stty echo; printf '\n'; export ADMIN_PASSWORD
npm run create-admin
unset ADMIN_USERNAME ADMIN_NAME ADMIN_PASSWORD
```

รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร และไม่เกิน 72 UTF-8 bytes คำสั่งนี้ไม่เปลี่ยนบัญชีที่ชื่อซ้ำ และไม่สร้างบัญชีด้วยรหัสเริ่มต้นตายตัว ต้องให้ container backend เริ่มทำงานและสร้าง schema สำเร็จก่อน

## ย้าย DB และรูปเดิม (ทำเมื่อจำเป็น)

หากต้องการให้มีสินค้า/ข้อมูลเดิมตั้งแต่ครั้งแรก ให้เตรียมข้อมูลนี้ก่อนเปิดให้คนใช้งานจริง:

1. Export DB ต้นทางด้วย `pg_dump --format=custom --no-owner --no-acl --file=kiosk.dump` โดยใช้ค่าการเชื่อมต่อ DB เดิม เก็บรหัสผ่านผ่าน prompt/`.pgpass` และอย่า commit dump
2. เก็บ `backend/uploads` ทั้งโฟลเดอร์แยกจาก source image รูปใน public ของ frontend ถูก build เข้า image อยู่แล้ว แต่รูปสินค้า/screensaver/contact ที่อัปโหลดต้องย้ายตาม
3. บน dev2 ให้ **หยุด web และ backend** ก่อน restore ลงฐานข้อมูลปลายทางใหม่ เพื่อไม่ให้ API เขียนข้อมูลหรือรัน migration ระหว่าง restore
4. ใช้ Portainer volume/file transfer ที่มีสิทธิ์ หรือให้ IT ช่วยส่ง `kiosk.dump` เข้า DB container ที่ `/tmp/kiosk.dump` และไฟล์ทั้งหมดภายใน uploads เดิมเข้า volume `uploads`
5. ใน Console ของ DB container รัน:

   ```sh
   pg_restore --no-owner --no-privileges --exit-on-error --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" /tmp/kiosk.dump
   ```

   ใช้ฐานข้อมูลปลายทางที่ว่างจริง หาก backend สร้าง schema ไว้แล้ว ให้ IT เตรียม DB ใหม่สำหรับ restore อย่าใช้ `--clean`, `DROP DATABASE` หรือรันไฟล์ seed/schema ที่ล้างตารางกับข้อมูลที่ต้องเก็บ

6. หากไฟล์ที่ restore เป็นของ root ให้ใช้ Console backend แบบ user root ตั้ง owner ของ `/app/uploads` ให้ `node:node` ก่อนเปิด API กลับมา
7. เปิด backend รอ healthy แล้วเปิด web ตรวจจำนวนสินค้า ออเดอร์ ผู้ใช้ และรูปที่อัปโหลด

การเริ่ม backend ใช้ `initDb()` ของระบบเดิมซึ่งมี migration และลบ legacy columns บางตัว ต้องมี backup ก่อนให้ image ใหม่เชื่อม DB จริง การ rollback code ไม่ได้ rollback schema โดยอัตโนมัติ ไม่ต้องรัน `schema.sql`, `seed.sql`, `schema_v2.sql`

## ตรวจหลังเปิดโดเมน

- `/healthz` ตอบ `ok` คือ Nginx พร้อม; `/api/health` ตอบ `{"status":"ok"}` คือ API ติดต่อ DB ได้
- `/?kiosk=true` แสดงหน้าสินค้าสำหรับเครื่อง Kiosk; หน้า `/` โดยไม่เคยเปิดโหมด Kiosk มีข้อความให้สั่งผ่านตู้ตามพฤติกรรมเดิม
- `/ditc-portal-to-manager` เข้า login ได้ และ refresh deep link เช่น `/dashboard/products` ได้
- สร้าง/แก้ไขสินค้าและอัปโหลดรูปได้ รูปเดิมอยู่ครบ และข้อมูลไม่หายหลัง recreate container
- กดยืนยันสั่งซื้อแล้วต้องเห็นข้อความว่ายังไม่เปิดชำระเงิน โดยไม่มีออเดอร์ใหม่และไม่มี QR ชำระเงินจริง
- `/api/payments/webhook` และ `/api/payments/simulate-webhook` ต้องตอบ `404` สำหรับ POST ใน production

ก่อนเปิด checkout ต้องพัฒนา provider กรุงไทยและระบบยืนยัน callback ตามเอกสารที่ธนาคารส่งให้ก่อน การเปลี่ยน `PAYMENTS_ENABLED` เพียงอย่างเดียวไม่ได้เชื่อมกรุงไทย

## อัปเดตและ rollback

Build image จาก commit ใหม่ อัปเดต image references ทั้งคู่ใน Stack ชื่อเดิม แล้ว Update stack โดยไม่ลบ volumes ใช้ commit tag แทน `latest` เก็บ image references เดิมและ backup DB/uploads ก่อนอัปเดต หากต้อง rollback ให้เปลี่ยนกลับ image เดิมและตรวจ schema compatibility ก่อน ถ้า schema เปลี่ยน ให้ใช้ขั้นตอน restore ที่ตรวจสอบแล้วโดย IT ห้ามใช้ `down -v` กับ Stack จริง

## ผลตรวจบนเครื่องก่อนส่งมอบ

- Backend tests: ผ่าน 12 รายการ; schema-upgrade test เดิมอีก 1 รายการเป็น opt-in และยังไม่ได้รันกับ fixture เฉพาะของมัน
- ทดลอง API กับ PostgreSQL 16 ใหม่ในโฟลเดอร์ชั่วคราว: สร้าง schema, อ่านสินค้า, สร้าง admin/ไม่ทับบัญชีซ้ำ, login/session, cookie, อัปโหลด/อ่านรูป, checkout ไม่สร้างออเดอร์, payment routes ปิด และ shutdown ผ่าน
- ติดตั้ง frontend จาก lockfile ใหม่ด้วย `npm ci --ignore-scripts --offline` และ production build ผ่าน
- Docker Compose CLI v5.6.1 ตรวจ config จริงและ build override ผ่าน รวมถึงปฏิเสธเมื่อไม่มี secrets ที่จำเป็น
- เครื่องนี้ไม่มี Docker engine จึงยังไม่ได้ build/run image หรือ deploy จริง Workflow ที่เตรียมไว้จะ build และลองเปิดทั้ง Stack ก่อน publish images เมื่อรันบน GitHub

## เอกสารอ้างอิงทางเทคนิค

- [Compose interpolation และตัวแปรที่จำเป็น](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Compose startup และ health dependencies](https://docs.docker.com/compose/how-tos/startup-order/)
- [Nginx proxy configuration](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Express behind proxies](https://expressjs.com/en/guide/behind-proxies/)
- [Build multi-platform images บน GitHub Actions](https://docs.docker.com/build/ci/github-actions/multi-platform/)
