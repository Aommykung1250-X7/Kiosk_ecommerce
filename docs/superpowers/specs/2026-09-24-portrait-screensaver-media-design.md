# แผนพัฒนาหน้าพักจอแนวตั้งและสื่อโฆษณาแบบรูป/วิดีโอ

วันที่: 24 กันยายน 2026  
สถานะ: รอตรวจทานก่อนเริ่มพัฒนา

## 1. เป้าหมาย

ปรับหน้าพักจอของ kiosk ให้เป็น playlist แนวตั้งเต็มจอที่รองรับทั้งรูปภาพและวิดีโอ โดยมีหน้า Default ของร้านเป็นสไลด์ประจำระบบ หน้า Default แสดงสินค้าแนะนำได้ แต่เมื่อเปลี่ยนไปแสดงสื่อโฆษณา สื่อดังกล่าวต้องกินพื้นที่เต็มจอและไม่มีสินค้าแนะนำหรือ UI อื่นซ้อนทับ

ผลลัพธ์ที่ต้องการ:

- แอดมินเพิ่ม แก้ไข เปิด/ปิด จัดลำดับ และลบรูปหรือวิดีโอได้จากหลังบ้าน
- รองรับไฟล์แนวตั้งอัตราส่วน 9:16 เท่านั้น
- รูปภาพแสดงตามจำนวนวินาทีที่แอดมินกำหนด
- วิดีโอ MP4 (H.264) ยาวไม่เกิน 30 วินาทีและเล่นจนจบคลิป
- หน้า Default อยู่ลำดับแรกเสมอ และ playlist วนกลับมาหน้านี้เมื่อจบรอบ
- การแตะบริเวณใดก็ได้บนหน้าพักจอจะกลับเข้าสู่หน้าร้าน
- วิดีโอพยายามเล่นพร้อมเสียง หากเบราว์เซอร์ไม่อนุญาตให้ autoplay พร้อมเสียง ระบบต้องเล่นต่อแบบปิดเสียงโดยไม่ค้าง

## 2. ขอบเขตที่ไม่ทำในรอบนี้

- ไม่เพิ่มการตั้งเวลาเริ่มและสิ้นสุดแคมเปญ
- ไม่ทำหลาย playlist แยกตามสาขาหรือ kiosk
- ไม่เชื่อมต่อ cloud storage หรือ video streaming service
- ไม่ทำเครื่องมือตัดต่อ ครอป หรือแปลงวิดีโอในหลังบ้าน
- ไม่รองรับ URL วิดีโอภายนอก เช่น YouTube
- ไม่เพิ่มเสียงหรือเพลงให้รูปภาพ

## 3. พฤติกรรมของหน้าพักจอ

### 3.1 ลำดับการเล่น

หนึ่งรอบประกอบด้วย:

1. หน้า Default ของร้าน
2. สื่อโฆษณาที่เปิดใช้งาน เรียงตาม `displayOrder` และ `id`
3. วนกลับไปหน้า Default

ถ้าไม่มีสื่อโฆษณาที่เปิดใช้งาน ระบบจะแสดงหน้า Default ต่อเนื่องเพียงหน้าเดียว และไม่ตั้ง timer เพื่อเปลี่ยนไปยังสไลด์ที่ไม่มีอยู่

หน้า Default เป็นสไลด์ระบบที่ลบหรือปิดไม่ได้ เพื่อรับประกันว่าหน้าพักจอมีเนื้อหาแสดงเสมอ ระยะเวลาแสดงหน้า Default ยังตั้งค่าได้จากหลังบ้านในช่วง 3–60 วินาที

### 3.2 หน้า Default

หน้า Default ใช้ layout แนวตั้งเต็มจอของร้าน และประกอบด้วยโลโก้ ข้อความต้อนรับ คำแนะนำให้แตะเพื่อเริ่มใช้งาน และสินค้าแนะนำ 4 รายการ ระบบใช้สินค้าที่แอดมินเลือกก่อน แล้วเติมช่องว่างด้วยสินค้าขายดีตามพฤติกรรมเดิม

ค่า `screensaver_main_image` เดิมจะไม่ถูกนำมาสร้างเป็นสไลด์แยกอีกต่อไป หน้า Default จะเป็น React UI ของระบบโดยตรง เพื่อลดความสับสนระหว่าง “หน้า Default” กับ “สื่อโฆษณา” ส่วนไฟล์เดิมยังคงอยู่และไม่ถูกลบระหว่าง migration

### 3.3 สื่อโฆษณา

- รูปภาพแสดงด้วย `object-fit: cover` เต็ม viewport แต่เนื่องจากระบบรับเฉพาะ 9:16 จึงไม่ควรเกิดการครอปที่มีนัยสำคัญ
- วิดีโอแสดงเต็ม viewport ด้วย `playsInline` และไม่มีปุ่มควบคุมบนจอ
- ไม่มีโลโก้ ปุ่ม สินค้าแนะนำ indicator หรือข้อความอื่นวางทับสื่อโฆษณา
- การแตะรูปหรือวิดีโอเรียก `onWake` เหมือนการแตะหน้า Default
- เมื่อออกจากหน้าพักจอ ต้องหยุดวิดีโอและคืน `currentTime` เป็น 0 เพื่อไม่ให้เสียงเล่นต่อเบื้องหลัง

### 3.4 เวลาและการเปลี่ยนสไลด์

- หน้า Default: ใช้ `masterDuration`
- รูปภาพ: ใช้ `duration` ที่แอดมินกำหนด ช่วง 3–60 วินาที
- วิดีโอ: ไม่ใช้ timer เป็นตัวจบสไลด์ แต่เปลี่ยนเมื่อได้รับ event `ended`
- ค่า `duration` ของวิดีโอเก็บความยาวจริงที่ backend ตรวจพบ ใช้แสดงข้อมูลในหลังบ้านและคำนวณเวลารวมของ playlist
- ก่อนเปลี่ยนสไลด์ให้ preload สื่อถัดไปเมื่อเบราว์เซอร์รองรับ เพื่อลดจอดำระหว่างรายการ

## 4. รูปแบบไฟล์และการตรวจสอบ

### 4.1 รูปภาพ

- ประเภทที่รองรับ: JPEG, PNG และ WebP
- อัตราส่วน: 9:16 เท่านั้น เช่น 720×1280 หรือ 1080×1920
- ขนาดแนะนำ: 1080×1920 พิกเซล
- ขนาดไฟล์สูงสุด: 50 MB

### 4.2 วิดีโอ

- container: MP4
- video codec: H.264/AVC
- อัตราส่วนหลังพิจารณา rotation metadata: 9:16 เท่านั้น
- ความยาว: มากกว่า 0 และไม่เกิน 30 วินาที
- ขนาดแนะนำ: 1080×1920 พิกเซล
- ขนาดไฟล์สูงสุด: 50 MB
- audio track: จะมีหรือไม่มีก็ได้

### 4.3 จุดที่ตรวจสอบ

Frontend ตรวจไฟล์ทันทีหลังเลือกเพื่อให้ feedback เร็ว แต่ backend ต้องตรวจซ้ำและเป็นผู้ตัดสินสุดท้าย ห้ามเชื่อเฉพาะนามสกุล ชื่อไฟล์ หรือ MIME ที่ browser ส่งมา

Backend ใช้ `sharp` อ่าน metadata ของรูป และใช้ `ffprobe-static` ร่วมกับ `child_process.execFile` อ่าน codec, display dimensions, rotation และ duration ของวิดีโอ ไฟล์จะถูกเก็บใน temporary path ก่อน และย้ายเข้า `uploads/screensavers` เมื่อผ่าน validation แล้วเท่านั้น หาก validation หรือการเขียนฐานข้อมูลล้มเหลว ต้องลบ temporary file ทิ้ง

การตรวจ 9:16 ใช้ display width/height หลังปรับ rotation metadata และยอมให้คลาดเคลื่อนได้ไม่เกิน 1% เพื่อรองรับ metadata/encoding ที่ปัดเศษเล็กน้อย โดยยังปฏิเสธสื่อแนวนอนหรืออัตราส่วนอื่นอย่างชัดเจน

## 5. โครงสร้างข้อมูล

ใช้ตาราง `screensavers` เดิมและชื่อคอลัมน์ที่ runtime ปัจจุบันใช้อยู่:

| คอลัมน์ | ความหมาย |
| --- | --- |
| `id` | รหัสรายการ |
| `title` | ชื่อที่ใช้ในหลังบ้าน |
| `type` | `image` หรือ `video` |
| `file_url` | ชื่อไฟล์ใน `uploads/screensavers` |
| `is_enabled` | อยู่ใน playlist หรือไม่ |
| `display_order` | ลำดับการเล่นหลังหน้า Default |
| `duration` | จำนวนวินาทีของรูป หรือความยาวจริงของวิดีโอ |
| `created_at` | เวลาสร้าง |

Migration เพิ่มข้อบังคับระดับฐานข้อมูลให้ `type` รับเฉพาะ `image` และ `video` และให้ `duration` อยู่ระหว่าง 1–600 เพื่อไม่ทำให้ข้อมูลเก่าเสียหาย ส่วน API จะบังคับกฎที่แคบกว่าสำหรับฟีเจอร์นี้: รูป 3–60 วินาที และวิดีโอไม่เกิน 30 วินาที

ต้องปรับ `schema.sql`, `schema_v2.sql` และ `backend/src/data/db.js` ให้ใช้ชื่อคอลัมน์ชุดเดียวกัน เนื่องจากปัจจุบัน `schema_v2.sql` ใช้ `media_type`/`duration_sec` แต่ runtime ใช้ `type`/`duration` การแก้ครั้งนี้จะยึด `type`/`duration` เพื่อรักษาความเข้ากันได้กับฐานข้อมูลและ controller ปัจจุบัน

เพิ่ม system setting:

- `screensaver_master_duration`: ระยะเวลาแสดงหน้า Default ใช้ค่าปัจจุบันต่อ
- `screensaver_featured_products`: รายการสินค้าแนะนำ ใช้ค่าปัจจุบันต่อ
- `screensaver_video_sound_enabled`: เปิด/ปิดเสียงวิดีโอทั้ง playlist ค่าเริ่มต้น `true`

ค่า `screensaver_master_enabled` เดิมไม่ใช้ควบคุมหน้า Default อีกต่อไป เพราะหน้า Default ต้องอยู่ใน playlist เสมอ แต่ยังไม่ต้องลบ key เพื่อให้ rollback ได้ง่าย

## 6. API และการจัดการไฟล์

### 6.1 อ่านข้อมูล

- `GET /api/screensavers/active` ส่งรายการที่เปิดใช้งาน พร้อม `mediaType`, `mediaUrl`, `duration`, `displayOrder` และ `title`
- `GET /api/screensavers` ส่งรายการทั้งหมดสำหรับหลังบ้าน
- `GET /api/screensavers/config` เพิ่ม `videoSoundEnabled` และยังส่งข้อมูลหน้า Default/สินค้าแนะนำตามเดิม

### 6.2 สร้างและแก้ไข

ปรับ create/update ให้รับ `multipart/form-data` เพื่อให้ไฟล์และ metadata ถูกจัดการใน request เดียว:

- `POST /api/screensavers` รับ `file`, `title`, `duration`, `displayOrder`, `isActive`
- `PUT /api/screensavers/:id` รับไฟล์ใหม่แบบ optional และ metadata ที่ต้องแก้

Backend เป็นผู้หา `mediaType` จากเนื้อหาไฟล์ ไม่รับค่าชนิดสื่อจาก client เป็นแหล่งความจริง สำหรับวิดีโอ backend เขียน duration จาก metadata จริงและไม่รับ duration ที่ client กำหนด สำหรับรูป backend ตรวจ duration ที่ส่งมา

เมื่อเปลี่ยนไฟล์ของรายการเดิม ให้ลบไฟล์เก่าหลังจากบันทึกฐานข้อมูลสำเร็จเท่านั้น เมื่อ delete รายการให้ลบทั้ง row และไฟล์เหมือนพฤติกรรมปัจจุบัน หากไฟล์หายแต่ row ยังอยู่ API ยังตอบรายการได้ และ player จะข้ามรายการนั้นเมื่อโหลดไม่สำเร็จ

endpoint `/api/screensavers/upload` เดิมยังใช้ชั่วคราวกับข้อมูลเก่าระหว่างเปลี่ยนระบบ แต่หน้าจัดการสื่อใหม่จะไม่เรียก endpoint นี้ หลังยืนยันว่าไม่มี consumer อื่นจึงค่อยถอดออกในงาน cleanup แยกต่างหาก

### 6.3 การตั้งค่าเสียง

`PUT /api/screensavers/config` รับ `videoSoundEnabled` เพิ่มเติม สวิตช์นี้มีผลกับวิดีโอทุกชิ้น เพื่อลดความซับซ้อนและป้องกันระดับเสียงไม่สม่ำเสมอจากการตั้งค่ารายคลิป

## 7. UX หลังบ้าน

### 7.1 หน้า “หน้าจอพักและโฆษณา”

- เปลี่ยนข้อความอธิบายให้ชัดว่าจอจริงเป็นแนวตั้ง 9:16 และสื่อโฆษณาจะแสดงเต็มจอ
- Card หน้า Default แสดง preview แนวตั้ง พร้อมสินค้าแนะนำ 4 ช่อง ระยะเวลา และสวิตช์ “เปิดเสียงวิดีโอ”
- ไม่แสดงสวิตช์ปิดหน้า Default เพราะเป็น fallback บังคับ
- Playlist timeline เริ่มด้วยหน้า Default เสมอ และแสดง badge แยก “รูปภาพ”/“วิดีโอ”
- เวลารวมของรอบคำนวณจาก master duration + ระยะเวลารูป + ความยาวจริงของวิดีโอ
- Media card และ preview เปลี่ยนจาก 16:9 เป็น 9:16 โดยใช้ขนาดย่อที่ไม่ทำให้หน้ารายการยาวเกินไป

### 7.2 Modal เพิ่ม/แก้ไขสื่อ

- Dropzone เดียวรับทั้งรูปและ MP4
- แสดงข้อกำหนดก่อนเลือกไฟล์: 9:16, แนะนำ 1080×1920, วิดีโอ MP4 H.264 ไม่เกิน 30 วินาที, ไฟล์ไม่เกิน 50 MB
- หลังเลือกไฟล์ แสดง preview ตามชนิดจริงและแสดง metadata: ประเภท ขนาดภาพ ความยาว และขนาดไฟล์
- ช่อง “ระยะเวลาแสดงผล” แสดงเฉพาะรูปภาพ
- วิดีโอแสดงข้อความ “เล่นจนจบคลิป” พร้อมความยาวที่ตรวจได้
- ปิดปุ่มบันทึกจนกว่าไฟล์จะผ่าน validation
- ตอนแก้ไข metadata โดยไม่เปลี่ยนไฟล์ ไม่บังคับให้อัปโหลดซ้ำ

### 7.3 ข้อความผิดพลาด

ข้อความต้องระบุสาเหตุและวิธีแก้ เช่น:

- “ไฟล์นี้เป็น 16:9 กรุณาใช้สื่อแนวตั้ง 9:16”
- “วิดีโอยาว 42 วินาที ระบบรองรับสูงสุด 30 วินาที”
- “วิดีโอต้องเป็นไฟล์ MP4 ที่เข้ารหัสแบบ H.264”
- “ไฟล์มีขนาดเกิน 50 MB”

## 8. Player และการจัดการเสียง

แยก player ออกเป็นหน่วยย่อยเพื่อให้ทดสอบง่าย:

- `DefaultScreensaverSlide`: แสดงหน้าร้านและสินค้าแนะนำ
- `ImageScreensaverSlide`: แสดงรูปเต็มจอ
- `VideoScreensaverSlide`: ควบคุมการเล่นวิดีโอ เสียง และ event `ended`/`error`
- `useScreensaverPlaylist`: สร้างลำดับสไลด์ ควบคุม index และการข้ามรายการ

เมื่อเข้าสไลด์วิดีโอ:

1. ถ้า `videoSoundEnabled` เป็น `true` ให้ตั้ง `muted=false` แล้วเรียก `play()`
2. ถ้า Promise จาก `play()` ถูก reject ให้ตั้ง `muted=true` และเรียก `play()` ใหม่
3. ถ้ายังเล่นไม่ได้หรือเกิด media error ให้แสดงพื้นหลังสีดำพร้อมโลโก้ขนาดเล็กไม่เกิน 3 วินาที แล้วข้ามไปสไลด์ถัดไป
4. เมื่อได้รับ `ended` ให้เปลี่ยนสไลด์ทันที

เมื่อสวิตช์เสียงเป็น `false` วิดีโอเริ่มแบบ muted ตั้งแต่ครั้งแรก ไม่ต้องลองเล่นพร้อมเสียง

## 9. ความปลอดภัยและความเสถียร

- สิทธิ์เพิ่ม แก้ไข ลบ และเปลี่ยน config จำกัดเฉพาะ admin ตามระบบเดิม
- ใช้ชื่อไฟล์สุ่มจาก server และไม่ใช้ชื่อไฟล์จากผู้ใช้เป็น path
- ตรวจ magic bytes/metadata จริงก่อนยอมรับไฟล์
- ใช้ `execFile` กับ argument array สำหรับ ffprobe และไม่ประกอบ shell command จาก input
- จำกัด 1 ไฟล์ต่อ request และ 50 MB ที่ multer
- ลบ temporary file ทุกกรณีเมื่อ request ล้มเหลว
- ไม่ preload วิดีโอทุกชิ้นพร้อมกัน ให้ preload เฉพาะรายการปัจจุบันและรายการถัดไปเพื่อจำกัดหน่วยความจำ
- ถ้า API โหลด playlist ไม่สำเร็จ ให้หน้า Default ยังทำงานได้จากค่า fallback ฝั่ง client

## 10. ลำดับการพัฒนา

### ระยะที่ 1: ฐานข้อมูลและ backend

1. ทำ migration/constraint ของ `screensavers.type` และปรับ schema ทั้งสามจุดให้ตรงกัน
2. เพิ่ม setting `screensaver_video_sound_enabled`
3. เพิ่ม dependency สำหรับตรวจ metadata รูปและวิดีโอ
4. สร้าง media validation service แยกจาก route/controller
5. เปลี่ยน create/update เป็น multipart และเพิ่มการ cleanup ไฟล์เมื่อเกิดข้อผิดพลาด
6. ส่ง `mediaType` และ duration ที่ถูกต้องผ่าน API ทุก endpoint
7. เพิ่ม validation และ error response ที่ frontend นำไปแสดงได้ตรงสาเหตุ

ไฟล์หลักที่คาดว่าจะเปลี่ยน:

- `backend/src/routes/screensaverRoutes.js`
- `backend/src/controllers/screensaverController.js`
- `backend/src/services/screensaverMediaService.js` (ไฟล์ใหม่)
- `backend/src/data/db.js`
- `backend/package.json`
- `schema.sql`
- `schema_v2.sql`
- `seed.sql`

### ระยะที่ 2: หลังบ้าน

1. ขยาย type `Screensaver` ให้มี `mediaType`
2. ปรับ upload flow และ modal ให้รองรับรูป/วิดีโอ
3. เพิ่ม client-side metadata validation และ preview แนวตั้ง
4. ปรับ media cards กับ playlist timeline ให้แสดงชนิดสื่อและความยาวจริง
5. เพิ่มสวิตช์เสียงวิดีโอใน config
6. ปรับหน้า Default card และเอาการปิดหน้า Default ออกจาก UI

ไฟล์หลักที่คาดว่าจะเปลี่ยน:

- `frontend/src/types/admin.ts`
- `frontend/src/pages/admin/ScreensaverManagement.tsx`
- `frontend/src/components/admin/screensavers/ScreensaverFormModal.tsx`
- `frontend/src/components/admin/screensavers/PlaylistTimeline.tsx`
- component ย่อยสำหรับ preview/metadata ตามความจำเป็น

### ระยะที่ 3: หน้าพักจอ kiosk

1. แยกหน้า Default ออกจาก media slide
2. ทำ full-viewport image/video renderer แนวตั้ง
3. ทำ playlist state และกติกา timer/`ended`
4. ทำ autoplay-with-sound และ muted fallback
5. หยุดและ reset media เมื่อ wake up
6. เพิ่ม preload รายการถัดไปและ error-skip behavior

ไฟล์หลักที่คาดว่าจะเปลี่ยน:

- `frontend/src/components/Screensaver.jsx`
- `frontend/src/components/screensaver/DefaultScreensaverSlide.jsx` (ไฟล์ใหม่)
- `frontend/src/components/screensaver/ImageScreensaverSlide.jsx` (ไฟล์ใหม่)
- `frontend/src/components/screensaver/VideoScreensaverSlide.jsx` (ไฟล์ใหม่)
- `frontend/src/components/screensaver/useScreensaverPlaylist.js` (ไฟล์ใหม่)

### ระยะที่ 4: ทดสอบและตรวจบนเครื่องจริง

1. ทดสอบ build/lint ของ frontend และ startup ของ backend
2. ทดสอบ validation ด้วยไฟล์ที่ถูกต้องและผิดเงื่อนไขทุกกรณี
3. ทดสอบ playlist ที่ไม่มีโฆษณา มีเฉพาะรูป มีเฉพาะวิดีโอ และมีสื่อผสม
4. ทดสอบ browser reload ก่อนมี user gesture เพื่อยืนยัน muted fallback
5. ทดสอบหลังผู้ใช้แตะหน้าร้านแล้วปล่อยให้ idle เพื่อยืนยันเสียง
6. ทดสอบ touch-to-wake ขณะวิดีโอกำลังเล่น และยืนยันว่าเสียงหยุดทันที
7. ทดสอบบนจอ kiosk แนวตั้งจริงที่ความละเอียดเป้าหมาย

## 11. เกณฑ์รับงาน

- หน้า Default แสดงเต็มจอแนวตั้งและมีสินค้าแนะนำ 4 ช่อง
- หน้า Default อยู่ในรอบเสมอ และเป็นหน้าที่แสดงเมื่อไม่มีสื่ออื่น
- แอดมินอัปโหลด JPEG/PNG/WebP 9:16 และกำหนดเวลา 3–60 วินาทีได้
- แอดมินอัปโหลด MP4 H.264 9:16 ความยาวไม่เกิน 30 วินาทีได้
- ระบบปฏิเสธไฟล์ผิดประเภท ผิดสัดส่วน ยาวเกิน หรือใหญ่เกิน พร้อมข้อความที่เข้าใจได้
- รูปและวิดีโอจากหลังบ้านแสดงเต็มจอโดยไม่มีสินค้าแนะนำหรือ UI ทับ
- วิดีโอเล่นจนจบก่อนเปลี่ยนรายการ และ playlist วนกลับหน้า Default
- เมื่อเปิดเสียง ระบบลองเล่นพร้อมเสียงและ fallback เป็น muted โดย playlist ไม่หยุด
- แตะตรงไหนก็ออกจากหน้าพักจอ และไม่มีเสียงวิดีโอค้าง
- การเปิด/ปิด จัดลำดับ แก้ไข และลบรายการสะท้อนผลบน kiosk หลังโหลด playlist รอบใหม่
- ข้อมูลรูปภาพที่มีอยู่เดิมยังแสดงได้หลัง migration

## 12. แผนทดสอบ

### Backend

- unit test media validator สำหรับ MIME/codec, 9:16, duration และ file size
- integration test create/update/delete รวมถึง cleanup temporary/old file
- API test สิทธิ์ admin และ response ของ active playlist/config

### Frontend หลังบ้าน

- component test การสลับ UI ระหว่างรูปกับวิดีโอ
- test ว่าปุ่มบันทึกถูกปิดเมื่อ validation ไม่ผ่าน
- test timeline ordering, type badge และ cycle duration

### Kiosk

- test image timer และ video `ended`
- test autoplay สำเร็จพร้อมเสียง, reject แล้ว fallback muted และ media error แล้ว skip
- test playlist reset เมื่อรายการเปลี่ยน และ cleanup เมื่อ wake up
- manual test บน kiosk จริงสำหรับภาพเต็มจอ เสียง ความลื่นไหล และ touch interaction

## 13. แนวทาง rollback

การเปลี่ยนแปลงฐานข้อมูลเป็นแบบเพิ่ม constraint/setting และใช้คอลัมน์เดิม จึง rollback frontend/backend กลับเวอร์ชันก่อนหน้าได้โดยข้อมูลรูปเก่ายังอยู่ วิดีโอที่เพิ่มใหม่จะไม่ถูก player เก่าแสดงอย่างถูกต้อง แต่ไม่ทำให้ตารางเสียหาย ห้ามลบไฟล์หรือ setting เดิมใน migration รอบนี้ เพื่อให้ย้อนกลับได้โดยไม่สูญเสียข้อมูล
