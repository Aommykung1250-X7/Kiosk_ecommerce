-- ล้างข้อมูลเก่าออกก่อนทำการใส่ข้อมูลตัวอย่างใหม่
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE categories CASCADE;

-- ใส่ข้อมูลหมวดหมู่สินค้า 4 หมวดหมู่
INSERT INTO categories (id, name) VALUES
('drinks', 'เครื่องดื่ม'),
('snacks', 'ขนมขบเคี้ยว'),
('stationery', 'เครื่องเขียน'),
('souvenirs', 'ของที่ระลึก')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ใส่ข้อมูลตัวอย่างสินค้า 11 รายการ (อิงข้อมูลและไฟล์รูปภาพจริงในระบบ)
INSERT INTO products (id, name, description, price, stock, category_id, image, promotion, pickup_location, status, views, preorder_release_date, purchase_limit) VALUES
(1, 'น้ำดื่มคริสตัล 600 มล.', 'น้ำดื่มสะอาด บริสุทธิ์ ได้มาตรฐานสากล ดับกระหายคลายร้อน', 10.00, 20, 'drinks', 'prod_1_water_1_1786977331435.png', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock', 0, NULL, NULL),
(2, 'ชาเขียวโออิชิ รสต้นตำรับ 500 มล.', 'ชาเขียวพร้อมดื่ม รสชาติกลมกล่อม หอมกลิ่นชาเขียวธรรมชาติ', 25.00, 15, 'drinks', 'prod_2_greentea_1_1786977651186.png', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock', 0, NULL, NULL),
(3, 'เลย์มันฝรั่งแท้ รสออริจินัล', 'มันฝรั่งทอดกรอบแผ่นเรียบ รสออริจินัล กรอบอร่อย เคี้ยวมันส์ ทุกช่วงเวลา', 20.00, 30, 'snacks', 'prod_3_lays_1_1786978543687.png', true, 'ตู้จำหน่ายสินค้า B ชั้น 1', 'In Stock', 0, NULL, NULL),
(4, 'ช็อกโกแลต KitKat Mini', 'เวเฟอร์กรุบกรอบเคลือบช็อกโกแลตนมเข้มข้น รสชาติหวานมันกำลังดี', 15.00, 25, 'snacks', 'b417c5e1583058f8e464875f868d8c46.jpeg', false, 'ตู้จำหน่ายสินค้า B ชั้น 1', 'In Stock', 0, NULL, NULL),
(5, 'ปากกาลูกลื่น Pilot G2 0.5 mm', 'ปากกาเจลเขียนลื่น หมึกสีน้ำเงินคมชัด หัวปากกาขนาด 0.5 มม. แข็งแรงทนทาน', 35.00, 50, 'stationery', 'b30f69df188fb60c766f4bf49b0f8349.jpeg', false, 'ชั้นวางเครื่องเขียน ชั้น 2', 'In Stock', 0, NULL, NULL),
(6, 'สมุดโน้ต DITC Minimal', 'สมุดบันทึกคุณภาพดี ปกสีสันสดใส กระดาษเรียบเนียน เขียนลื่น ไม่ซึม', 49.00, 40, 'stationery', '233b4ab20916e7976674813c94fdc2aa.jpeg', false, 'ชั้นวางเครื่องเขียน ชั้น 2', 'In Stock', 0, NULL, NULL),
(7, 'แก้วน้ำเก็บความเย็น DITC', 'แก้วสแตนเลสเก็บอุณหภูมิร้อน-เย็น ลายสกรีนโลโก้ DITC สวยงาม ทนทาน', 290.00, 15, 'souvenirs', '26fb87a40582970e037413dc166cc88f.jpeg', true, 'เคาน์เตอร์รับสินค้า ชั้น 1', 'In Stock', 0, NULL, NULL),
(8, 'เสื้อยืด CAMT Graphic Tee 2026', 'เสื้อยืดคอตตอน 100% สกรีนลายกราฟิกประจำปี 2026 เนื้อผ้านุ่ม ใส่สบาย', 350.00, 100, 'souvenirs', '6b9b29ab22b999c0c777b292d528369c.jpeg', false, NULL, 'Pre-Order', 0, '2026-08-30', 5),
(9, 'พวงกุญแจมาสคอต DITC Shop', 'พวงกุญแจยางหยอดอะคริลิกลายมาสคอตสุดน่ารัก น่าสะสม', 89.00, 80, 'souvenirs', 'cae7c4a1a9a7b4c8aa64eb68d0c746d0.jpeg', false, NULL, 'Pre-Order', 0, '2026-08-30', 10),
(10, 'กระเป๋าผ้าดิบ DITC Tote Bag', 'กระเป๋าผ้าลดโลกร้อน ทรงสวย ความจุเยอะ ใส่เอกสารและโน้ตบุ๊กได้สบาย', 150.00, 60, 'souvenirs', '52c594c5e8a2f15ad4947bb0c244802c.jpeg', false, NULL, 'Pre-Order', 0, '2026-08-30', 3),
(11, 'กระเป๋าสะพาย DITC', 'กระเป๋าเป้ ทรงสวย ความจุเยอะ ใส่เอกสารและโน้ตบุ๊กได้สบาย', 399.00, 40, 'souvenirs', 'eebfdbb6d9ff992f6b5de1af83f11e6d.jpeg', false, 'CAMT B203', 'In Stock', 0, NULL, NULL);

-- ใส่ข้อมูลรูปภาพเพิ่มเติมของสินค้า (ตาราง product_images)
INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES
(1, 'prod_1_water_1_1786977331435.png', 0, true),
(1, 'prod_1_water_2_1786977351828.png', 1, false),
(1, 'prod_1_water_3_1786977372762.png', 2, false),
(1, 'prod_1_water_4_1786977399436.png', 3, false),
(1, 'prod_1_water_5_1786977420876.png', 4, false),
(2, 'prod_2_greentea_1_1786977651186.png', 0, true),
(2, 'prod_2_greentea_2_1786977869886.png', 1, false),
(2, 'prod_2_greentea_3_1786978162933.png', 2, false),
(2, 'prod_2_greentea_4_1786978492798.png', 3, false),
(2, 'prod_2_greentea_5_1786978516808.png', 4, false),
(3, 'prod_3_lays_1_1786978543687.png', 0, true),
(3, 'prod_3_lays_2_1786978575416.png', 1, false),
(3, 'prod_3_lays_3_1786978605532.png', 2, false),
(3, '69f84b40fcc77b64ecc1d34e718515e5.jpeg', 3, false),
(4, 'b417c5e1583058f8e464875f868d8c46.jpeg', 0, true),
(4, '8499081c246a043533f6220a0800c655.jpeg', 1, false),
(5, 'b30f69df188fb60c766f4bf49b0f8349.jpeg', 0, true),
(5, '47a8642cc957b774e4689b150006a397.jpeg', 1, false),
(6, '233b4ab20916e7976674813c94fdc2aa.jpeg', 0, true),
(6, '5d59a6dee84c5b9676cc826730e02598.jpeg', 1, false),
(7, '26fb87a40582970e037413dc166cc88f.jpeg', 0, true),
(8, '6b9b29ab22b999c0c777b292d528369c.jpeg', 0, true),
(9, 'cae7c4a1a9a7b4c8aa64eb68d0c746d0.jpeg', 0, true),
(10, '52c594c5e8a2f15ad4947bb0c244802c.jpeg', 0, true),
(11, 'eebfdbb6d9ff992f6b5de1af83f11e6d.jpeg', 0, true);

-- อัปเดตลำดับการรัน ID ล่าสุดของ SERIAL ใน PostgreSQL ให้ทำงานต่อหลังจากข้อมูลจำลอง
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));

-- ใส่ข้อมูลบัญชีผู้ใช้เริ่มต้น (รหัสผ่าน 123456)
INSERT INTO users (username, password_hash, role, name) VALUES
('admin', '$2b$10$bCKX1FDOYMqbA.TxZfNSa.H0TDfSM6YqgKzrQTR1rPdS.uMBSj0UO', 'admin', 'ระบบผู้ดูแลการขาย'),
('staff1', '$2b$10$kRirdhfmxWlxsgss2ytmb.D/U.JiM9EL1Ie0vMU.eu/niw.BQsM9.', 'staff', 'พนักงานหน้าตู้ 1'),
('staff2', '$2b$10$kRirdhfmxWlxsgss2ytmb.D/U.JiM9EL1Ie0vMU.eu/niw.BQsM9.', 'staff', 'พนักงานหน้าตู้ 2');
