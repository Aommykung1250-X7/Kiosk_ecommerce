-- ล้างข้อมูลเก่าออกก่อนทำการใส่ข้อมูลตัวอย่างใหม่
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories CASCADE;

-- ใส่ข้อมูลหมวดหมู่สินค้า 4 หมวดหมู่
INSERT INTO categories (id, name) VALUES
('drinks', 'เครื่องดื่ม'),
('snacks', 'ขนมขบเคี้ยว'),
('stationery', 'เครื่องเขียน'),
('souvenirs', 'ของที่ระลึก')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ใส่ข้อมูลตัวอย่างสินค้า 21 รายการ (ชื่อและคำอธิบายอิงจากรูปสินค้าจริงในโฟลเดอร์ uploads/products)
INSERT INTO products (id, name, description, price, stock, category_id, image, promotion, pickup_location, status, views, preorder_release_date, purchase_limit) VALUES
(1, 'น้ำดื่ม AQUA PURA 600 มล.', 'น้ำแร่ธรรมชาติบรรจุขวด PET ใสสะอาด รสนุ่มละมุน ดื่มง่าย ดับกระหายได้ทันใจ ขนาดพกพา 600 มล.', 10.00, 20, 'drinks', 'bffd61f18c4c38356bf6986a8760b406.png', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock', 0, NULL, NULL),
(2, 'ชาเขียวโออิชิ รสต้นตำรับ 500 มล.', 'ชาเขียวญี่ปุ่นพร้อมดื่ม ชงจากใบชาคัดพิเศษ รสชาติกลมกล่อม หอมกลิ่นชาเขียวธรรมชาติ ขนาด 500 มล.', 25.00, 15, 'drinks', '41b842a3154d8170b491625beb4e1263.png', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock', 0, NULL, NULL),
(3, 'มันฝรั่งทอด CRISPY HAVEN รสเกลือทะเลและมอลต์วินิการ์ 150 ก.', 'มันฝรั่งทอดกรอบสไตล์ Kettle Cooked แผ่นหยักหนา กรอบนาน ปรุงรสเกลือทะเลกับมอลต์วินิการ์ เปรี้ยวเค็มกลมกล่อม สูตรกลูเตนฟรี', 20.00, 30, 'snacks', 'gen_chips_studio.jpg', true, 'ตู้จำหน่ายสินค้า B ชั้น 1', 'In Stock', 0, NULL, NULL),
(4, 'ช็อกโกแลต KitKat Mini', 'เวเฟอร์กรุบกรอบเคลือบช็อกโกแลตนมเข้มข้นจากเนสท์เล่ แบ่งเป็นชิ้นเล็กพอดีคำ บรรจุถุงแบ่งปันได้ หวานมันกำลังดี', 15.00, 25, 'snacks', '78ffd088941eeef862f7e93c6cc2a5b2.png', false, 'ตู้จำหน่ายสินค้า B ชั้น 1', 'In Stock', 0, NULL, NULL),
(5, 'ปากกาเจล Pilot G2 0.5 mm', 'ปากกาเจลหมึกสีน้ำเงิน เขียนลื่นไม่สะดุด ด้ามจับยางกันลื่น หัวปากกาขนาด 0.5 มม. แบบกดเก็บไส้ได้', 35.00, 50, 'stationery', 'febaaa11a75cae03bcccd8d435368783.png', false, 'ชั้นวางเครื่องเขียน ชั้น 2', 'In Stock', 0, NULL, NULL),
(6, 'สมุดโน้ต DITC Minimal', 'สมุดบันทึกปกแข็งดีไซน์มินิมอล โทนขาว-เขียวมิ้นต์ พิมพ์โลโก้ DITC กระดาษเรียบเนียน เขียนลื่น หมึกไม่ซึมทะลุหน้า', 49.00, 40, 'stationery', '32a1b509e0829f36ebbfbfaa46805e84.png', false, 'ชั้นวางเครื่องเขียน ชั้น 2', 'In Stock', 0, NULL, NULL),
(7, 'แก้วน้ำเก็บความเย็น DITC พร้อมหลอด', 'แก้วทัมเบลอร์สแตนเลสทรงสูง สกรีนโลโก้ DITC มาพร้อมฝาปิดและหลอดสแตนเลส เก็บความเย็นได้ยาวนาน พกพาสะดวก', 290.00, 15, 'souvenirs', '373aadfa20b3af5ee1403488e6244688.png', true, 'เคาน์เตอร์รับสินค้า ชั้น 1', 'In Stock', 0, NULL, NULL),
(8, 'เสื้อยืด CAMT Graphic Tee 2026', 'เสื้อยืดคอตตอนสีเทา สกรีนลายกราฟิก CAMT ประจำปี 2026 โทนขาว-ทอง เนื้อผ้านุ่ม ระบายอากาศดี ใส่สบายทุกวัน', 350.00, 100, 'souvenirs', '25fcf0ad08abcc083e1f7438b7eb085d.png', false, NULL, 'Pre-Order', 0, '2026-08-30', 5),
(9, 'พวงกุญแจมาสคอต DITC Shop', 'พวงกุญแจอะคริลิกลายมาสคอตหมี DITC Shop สีสันสดใส งานพิมพ์คมชัดสองด้าน พร้อมห่วงโลหะอย่างดี น่ารัก น่าสะสม', 89.00, 80, 'souvenirs', '365a2f8515640323d78f0c4c957f4d23.png', false, NULL, 'Pre-Order', 0, '2026-08-30', 10),
(10, 'กระเป๋าผ้าดิบ DITC Tote Bag', 'กระเป๋าผ้าแคนวาสสีธรรมชาติ สกรีนลายมาสคอต DITC Shop ทรงสวย ความจุเยอะ ใส่เอกสารและโน้ตบุ๊กได้สบาย ช่วยลดการใช้ถุงพลาสติก', 150.00, 60, 'souvenirs', 'fc4494ba9e3eb4cb23b17fca8b6e1727.png', false, NULL, 'Pre-Order', 0, '2026-08-30', 3),
(11, 'กระเป๋าเป้ DITC Shop Mascot', 'กระเป๋าเป้ผ้าแคนวาสโทนเบจ-เทา สกรีนลายมาสคอต DITC Shop ช่องเก็บของเยอะ มีช่องใส่โน้ตบุ๊ก สายสะพายบุนุ่ม กระจายน้ำหนักดี', 399.00, 40, 'souvenirs', 'a2e0ef1a448ca174f9f6e3b89242f556.png', false, 'CAMT B203', 'In Stock', 0, NULL, NULL),
(12, 'น้ำส้ม SUNRISE JUICE 100% 330 มล.', 'น้ำส้มคั้น 100% ไม่ผสมน้ำตาลทราย บรรจุกระป๋องอะลูมิเนียม รสเปรี้ยวอมหวานสดชื่น หอมกลิ่นส้มธรรมชาติ ขนาด 330 มล.', 25.00, 18, 'drinks', '0c74fb8e11c9027a32c388ce938211ba.png', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock', 0, NULL, NULL),
(13, 'ชาเขียวอิโตเอ็น โอ้อิโอฉะ 500 มล.', 'ชาเขียวญี่ปุ่นแท้สูตรไม่มีน้ำตาล จากใบชาคัดสรรของอิโตเอ็น รสชาติบางเบา หอมกลิ่นชาชัดเจน ดื่มคู่มื้ออาหารได้ดี', 30.00, 12, 'drinks', '611f3c1d9420ca8b09ad8b1b154b4dd9.png', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock', 0, NULL, NULL),
(14, 'น้ำแร่ AQUAVORA Premium Artesian 500 มล.', 'น้ำแร่จากชั้นหินอาร์ทีเซียน แร่ธาตุธรรมชาติครบถ้วน รสละมุนไม่ฝาดคอ ขวดใสดีไซน์เรียบหรู ขนาด 500 มล.', 15.00, 24, 'drinks', 'gen_water_studio.jpg', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock', 0, NULL, NULL),
(15, 'มันฝรั่งทอด CRUNCHY GOLD รสเกลือทะเลคลาสสิก 150 ก.', 'มันฝรั่งทอดกรอบแผ่นหยัก รสเกลือทะเลคลาสสิก กรอบเต็มคำ เค็มกำลังดี เหมาะทานเล่นหรือแบ่งปันกับเพื่อน', 20.00, 28, 'snacks', '72758448aa30d90409958253cc26cfdf.png', false, 'ตู้จำหน่ายสินค้า B ชั้น 1', 'In Stock', 0, NULL, NULL),
(16, 'ปากกาเจลด้ามโลหะ ZEBRA สีน้ำเงินเข้ม 0.5 mm', 'ปากกาเจลแบบกด ด้ามโลหะสีน้ำเงินเข้ม คลิปสแตนเลส น้ำหนักกำลังมือ จับถนัด เขียนลื่นต่อเนื่อง หัวปากกา 0.5 มม.', 89.00, 35, 'stationery', 'f13ebd0e94d26d9456300a0b9e5021e5.png', false, 'ชั้นวางเครื่องเขียน ชั้น 2', 'In Stock', 0, NULL, NULL),
(17, 'สมุดโน้ตปกแข็ง Navy Hardcover A5', 'สมุดบันทึกปกแข็งสีกรมท่า ปั๊มนูนคำว่า NOTES มีสายยางรัดปกและริบบิ้นคั่นหน้า กระดาษถนอมสายตา เย็บกี่เปิดได้ราบ', 129.00, 30, 'stationery', '823d688dc2f0f2bcbee3d2c25a584f7a.png', false, 'ชั้นวางเครื่องเขียน ชั้น 2', 'In Stock', 0, NULL, NULL),
(18, 'แก้วทัมเบลอร์สแตนเลส ฝาล็อก 450 มล.', 'แก้วเก็บอุณหภูมิสแตนเลสสองชั้น ฝากดเปิด-ปิดพร้อมตัวล็อกกันหก เก็บร้อนเย็นได้นานหลายชั่วโมง ผิวด้านกันลื่น ขนาด 450 มล.', 259.00, 20, 'souvenirs', '5bf803e5d3da1d85d9c50d32ca18c6ee.png', false, 'เคาน์เตอร์รับสินค้า ชั้น 1', 'In Stock', 0, NULL, NULL),
(19, 'เสื้อยืด URBAN LEGEND Street Culture', 'เสื้อยืดคอตตอนสีดำ สกรีนลายกราฟิกหัวกะโหลกสไตล์สตรีท โทนแดง-เทา เนื้อผ้าหนานุ่ม ทรงสวย ใส่ได้ทั้งชายและหญิง', 390.00, 60, 'souvenirs', '880315cc9bf737abe5d68a389a41e563.png', false, NULL, 'Pre-Order', 0, '2026-08-30', 5),
(20, 'พวงกุญแจตุ๊กตาหมีขนนุ่ม', 'พวงกุญแจตุ๊กตาหมีขนนุ่มฟูสีน้ำตาล หน้าตาน่ารัก งานเย็บประณีต พร้อมห่วงโลหะอย่างดี ห้อยกระเป๋าหรือเป้ได้สวย', 159.00, 50, 'souvenirs', 'be0770e18c2822743537efecd01e351d.png', false, 'เคาน์เตอร์รับสินค้า ชั้น 1', 'In Stock', 0, NULL, NULL),
(21, 'กระเป๋าเป้ Daily Commuter สีดำ', 'กระเป๋าเป้ผ้าไนลอนกันน้ำสีดำ ดีไซน์เรียบหรู ช่องใส่โน้ตบุ๊กแยกบุกันกระแทก ช่องข้างใส่ขวดน้ำ สายสะพายบุนุ่ม เหมาะใช้เรียนและทำงาน', 890.00, 25, 'souvenirs', 'fd4dfb62d3db76121314777d055be81b.png', false, 'CAMT B203', 'In Stock', 0, NULL, NULL);

-- ใส่ข้อมูลรูปภาพเพิ่มเติมของสินค้า (ตาราง product_images)
INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES
(1, 'bffd61f18c4c38356bf6986a8760b406.png', 0, true),
(1, 'dfe1d2ae210943c18b151005f2e85b55.png', 1, false),
(1, '278ea1035a79fd146d7e42dcd495ea5b.png', 2, false),
(2, '41b842a3154d8170b491625beb4e1263.png', 0, true),
(3, 'gen_chips_studio.jpg', 0, true),
(3, '7b9e741c2aec6d998a6b6aa8b0aa158b.png', 1, false),
(4, '78ffd088941eeef862f7e93c6cc2a5b2.png', 0, true),
(4, 'cdea2ced7b61bdca7cfa70ca7c59daa8.png', 1, false),
(4, 'gen_kitkat_studio.jpg', 2, false),
(5, 'febaaa11a75cae03bcccd8d435368783.png', 0, true),
(6, '32a1b509e0829f36ebbfbfaa46805e84.png', 0, true),
(7, '373aadfa20b3af5ee1403488e6244688.png', 0, true),
(8, '25fcf0ad08abcc083e1f7438b7eb085d.png', 0, true),
(9, '365a2f8515640323d78f0c4c957f4d23.png', 0, true),
(10, 'fc4494ba9e3eb4cb23b17fca8b6e1727.png', 0, true),
(10, '07c7635a20915dc650c96ee4d2482803.png', 1, false),
(10, 'ccdf2cd7f6c1dbde42aeb686a8b6b513.png', 2, false),
(10, 'gen_totebag_studio.jpg', 3, false),
(11, 'a2e0ef1a448ca174f9f6e3b89242f556.png', 0, true),
(12, '0c74fb8e11c9027a32c388ce938211ba.png', 0, true),
(12, 'gen_fruitdrink_studio.jpg', 1, false),
(13, '611f3c1d9420ca8b09ad8b1b154b4dd9.png', 0, true),
(13, 'gen_greentea_studio.jpg', 1, false),
(14, 'gen_water_studio.jpg', 0, true),
(15, '72758448aa30d90409958253cc26cfdf.png', 0, true),
(16, 'f13ebd0e94d26d9456300a0b9e5021e5.png', 0, true),
(16, 'gen_pen_studio.jpg', 1, false),
(17, '823d688dc2f0f2bcbee3d2c25a584f7a.png', 0, true),
(17, 'gen_notebook_studio.jpg', 1, false),
(18, '5bf803e5d3da1d85d9c50d32ca18c6ee.png', 0, true),
(18, 'gen_tumbler_studio.jpg', 1, false),
(19, '880315cc9bf737abe5d68a389a41e563.png', 0, true),
(19, 'gen_tshirt_studio.jpg', 1, false),
(20, 'be0770e18c2822743537efecd01e351d.png', 0, true),
(20, 'gen_plush_bear_studio.jpg', 1, false),
(21, 'fd4dfb62d3db76121314777d055be81b.png', 0, true),
(21, 'gen_backpack_studio.jpg', 1, false);

-- อัปเดตลำดับการรัน ID ล่าสุดของ SERIAL ใน PostgreSQL ให้ทำงานต่อหลังจากข้อมูลจำลอง
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));

-- ใส่ข้อมูลบัญชีผู้ใช้เริ่มต้น (รหัสผ่าน 123456)
INSERT INTO users (username, password_hash, role, name) VALUES
('admin', '$2b$10$nMjLkA8KaMD5.E2hZvV5iO7C.zvPHICzvvO60iCWyeNFfALXqTdXS', 'admin', 'ระบบผู้ดูแลการขาย'),
('staff1', '$2b$10$Qj2Aeb43IKAcXQmbF8iGT.MF0qAMR/JHd9u6kNn5OQj0t.LbDwxjS', 'staff', 'พนักงานหน้าตู้ 1'),
('staff2', '$2b$10$JM93/jJKkahxscjrwNh5bOHJYIhiK9F1NZzb55no7grN2lkfYH5EG', 'staff', 'พนักงานหน้าตู้ 2');

-- ค่าตั้งต้นของระบบ (เดิม initDb เป็นคนใส่ให้ตอน boot — ย้ายมาไว้ที่นี่จะได้ไม่ต้องพึ่ง initDb)
INSERT INTO system_settings (key, value) VALUES
('shipping_base_fee', '40.00'),
('shipping_split_fee', '40.00'),
('screensaver_master_enabled', 'true'),
('screensaver_master_duration', '10'),
('screensaver_featured_products', '[]'),
('screensaver_main_image', 'main_screen.jpeg'),
('popular_search_tags', '["น้ำดื่ม", "ชาเขียว", "มันฝรั่งทอด", "KitKat", "แก้วน้ำ", "เสื้อยืด"]'),
('contact_hotline', '02-123-4567 / 081-234-5678'),
('contact_line_id', '@ditcsupport'),
('contact_line_url', 'https://line.me/ti/p/@ditcsupport'),
('contact_line_qr_image', ''),
('contact_service_hours', 'เปิดบริการ 08:00 - 20:00 น.')
ON CONFLICT (key) DO NOTHING;

-- ตัวนับจำนวนครั้งที่ตู้ถูกปลุกใช้งาน (หน้ารายงานอ่านค่านี้)
INSERT INTO kiosk_stats (key, value) VALUES ('session_wakeups', 0)
ON CONFLICT (key) DO NOTHING;
