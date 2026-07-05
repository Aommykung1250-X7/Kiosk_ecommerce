-- ล้างข้อมูลเก่าออกก่อนทำการใส่ข้อมูลตัวอย่างใหม่
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE users CASCADE;

-- ใส่ข้อมูลตัวอย่างสินค้า 8 รายการ
INSERT INTO products (id, name, description, price, stock, category, image, promotion, pickup_location, status) VALUES
(1, 'น้ำดื่มคริสตัล 600 มล.', 'น้ำดื่มสะอาด บริสุทธิ์ ได้มาตรฐานสากล ดับกระหายคลายร้อน', 10.00, 15, 'drinks', 'water', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock'),
(2, 'โค้ก กระป๋อง 325 มล.', 'เครื่องดื่มอัดลมรสยอดนิยม รสชาติซ่าสดชื่น ดื่มคู่กับอะไรก็อร่อย', 20.00, 8, 'drinks', 'cola', false, 'ตู้จำหน่ายสินค้า B ชั้น 1', 'In Stock'),
(3, 'เลย์มันฝรั่งแท้ รสOriginal', 'มันฝรั่งทอดกรอบแผ่นเรียบ รสออริจินัล กรอบอร่อย เคี้ยวมันส์ ทุกช่วงเวลา', 20.00, 20, 'snacks', 'chips', true, 'ตู้จำหน่ายสินค้า A ชั้น 2', 'In Stock'),
(4, 'ทิวลี่กรอบ รสชีส', 'เวเฟอร์สอดไส้ครีมรสชีสเข้มข้น กรุบกรอบ หอมชีสเต็มคำ', 15.00, 5, 'snacks', 'wafer', false, 'ตู้จำหน่ายสินค้า B ชั้น 2', 'In Stock'),
(5, 'มาม่าคัพ รสต้มยำกุ้ง', 'บะหมี่กึ่งสำเร็จรูปรสชาติต้มยำกุ้งแท้ๆ เส้นเหนียวนุ่ม ซุปแซ่บถึงใจ', 15.00, 50, 'instant', 'noodle', true, NULL, 'Pre-Order'),
(6, 'ไมโล ยูเอชที 180 มล.', 'เครื่องดื่มช็อกโกแลตมอลต์รสชาติอร่อย อุดมด้วยวิตามินและแร่ธาตุ', 12.00, 12, 'drinks', 'milo', false, 'ตู้จำหน่ายสินค้า A ชั้น 1', 'In Stock'),
(7, 'ปากกาลูกลื่น Pilot 0.5 mm', 'ปากกาลูกลื่นเขียนลื่น หมึกสีน้ำเงินคมชัด หัวปากกาขนาด 0.5 มม. แข็งแรงทนทาน', 12.00, 30, 'stationery', 'pen', false, NULL, 'Pre-Order'),
(8, 'สมุดโน้ต DIIC', 'สมุดบันทึกคุณภาพดี ปกสีสันสดใส กระดาษเรียบเนียน เขียนลื่น ไม่ซึม', 25.00, 7, 'stationery', 'notebook', false, 'ชั้นวางเครื่องเขียน ชั้น 3', 'In Stock');

-- อัปเดตลำดับการรัน ID ล่าสุดของ SERIAL ใน PostgreSQL ให้ทำงานต่อหลังจากข้อมูลจำลองตัวที่ 8
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- ใส่ข้อมูลบัญชีผู้ใช้เริ่มต้น
INSERT INTO users (username, password_hash, role, name) VALUES
('admin', '$2b$10$bCKX1FDOYMqbA.TxZfNSa.H0TDfSM6YqgKzrQTR1rPdS.uMBSj0UO', 'admin', 'ระบบผู้ดูแลการขาย'),
('staff1', '$2b$10$kRirdhfmxWlxsgss2ytmb.D/U.JiM9EL1Ie0vMU.eu/niw.BQsM9.', 'staff', 'พนักงานหน้าตู้ 1'),
('staff2', '$2b$10$kRirdhfmxWlxsgss2ytmb.D/U.JiM9EL1Ie0vMU.eu/niw.BQsM9.', 'staff', 'พนักงานหน้าตู้ 2');
