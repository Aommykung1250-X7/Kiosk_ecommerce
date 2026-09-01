-- =============================================================================
-- E-commerce kiosk — schema v2 (revised)
-- PostgreSQL 16 (docker-compose: postgres:16-alpine)
--
-- ฉบับนี้ปรับจาก v2 ร่างแรก โดย "เก็บของดีเชิงดีไซน์ไว้ทั้งหมด" แต่แก้ทุกจุด
-- ที่ขัดกับ flow การทำงานจริงของ backend ปัจจุบัน จุดที่แก้จะมีคอมเมนต์
-- [FLOW] กำกับไว้ พร้อมอ้างอิงไฟล์/บรรทัดที่เป็นเหตุผล
--
-- หลักการที่ยังคงไว้จาก v2:
--   1. NULL ต้องแปลว่า "ยังไม่รู้" เสมอ ไม่ใช่ "ไม่เกี่ยวกับแถวนี้"
--   2. ค่าที่คำนวณได้ ให้คำนวณ ไม่เก็บลอย ๆ
--   3. ทุกคอลัมน์สถานะต้องมีโดเมนที่จำกัด ไม่มี free-text state
--   4. ทุก foreign key ต้องมี index (PostgreSQL ไม่สร้างให้)
--   5. timestamptz ทุกที่ (kiosk อยู่ UTC+7 ถ้าใช้ timestamp เฉย ๆ รายงานเพี้ยน)
--
-- หลักการที่ "ไม่" ทำ (ตั้งใจ):
--   - ไม่เปลี่ยนค่าในโดเมนที่ frontend ใช้อยู่ ('In Stock'/'Pre-Order',
--     'pickup'/'delivery', 'combined'/'instock'/'preorder') เพราะได้ประโยชน์
--     เชิงดีไซน์เป็นศูนย์ แต่ต้องรื้อ frontend 48 จุด การจำกัดโดเมนด้วย CHECK
--     คือเป้าหมายจริง ไม่ใช่การเปลี่ยนชื่อค่า
--   - ไม่เปลี่ยน categories.id เป็น surrogate key — slug เป็น natural key
--     ที่เสถียรและ frontend เทียบตรง ๆ อยู่แล้ว
--
-- ต้องทำก่อน apply: ลบ/ปิด auto-migration ใน backend/src/data/db.js
-- ทั้งไฟล์ มิฉะนั้นตอน start server มันจะ ALTER ตารางกลับไปเป็น v1
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;  -- integer '=' ใน GiST EXCLUDE
CREATE EXTENSION IF NOT EXISTS citext;      -- email / username แบบไม่สนตัวพิมพ์

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- 1. Staff
-- เปลี่ยนชื่อจาก `users`: ตารางนี้เก็บพนักงานหลังบ้าน ไม่ใช่ลูกค้า
-- การเรียกทั้งสองอย่างว่า "users" คือต้นเหตุความสับสนอันดับหนึ่งของ schema แบบนี้
-- =============================================================================
CREATE TABLE staff (
    id            integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      citext      NOT NULL UNIQUE CHECK (length(username) BETWEEN 3 AND 100),
    password_hash text        NOT NULL,
    full_name     text        NOT NULL CHECK (length(full_name) BETWEEN 1 AND 255),
    role          text        NOT NULL CHECK (role IN ('admin', 'staff')),

    -- v1 ไม่มีทางปิดบัญชี การลบทิ้งจะทำให้ orders.handler_id กลายเป็น NULL
    -- และ audit trail หาย จึงใช้การปิดใช้งานแทน
    is_active     boolean     NOT NULL DEFAULT true,

    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 2. Categories
-- [FLOW] คงรูปแบบ slug เป็น primary key ตามของเดิม
--   - seed.sql:7-12 ใช้ 'drinks', 'snacks', 'stationery', 'souvenirs'
--   - frontend เทียบ product.category === category.id แบบสตริงตรง ๆ ที่
--     ProductDetailModal.jsx:54, CategoryManagerModal.tsx:35,
--     ProductManagement.tsx:1048, FeaturedProductModal.tsx:80
-- slug ที่ตั้งใจให้เสถียรคือ natural key ที่ถูกต้อง การเปลี่ยนเป็น integer
-- ไม่ได้แก้ปัญหาอะไรที่มีอยู่จริงในระบบนี้ แต่พัง frontend 4 ไฟล์
-- สิ่งที่เพิ่มเข้ามาคือ CHECK รูปแบบ slug + sort_order + is_active
-- =============================================================================
CREATE TABLE categories (
    -- ต้อง cast เป็น text ก่อนเทียบ regex: operator ~ ของ citext เป็นแบบ
    -- ไม่สนตัวพิมพ์ ทำให้ '^[a-z0-9]...' ปล่อย 'Snacks' ผ่านไปได้
    id         citext      PRIMARY KEY CHECK (id::text ~ '^[a-z0-9][a-z0-9_-]{0,99}$'),
    name       text        NOT NULL CHECK (length(name) BETWEEN 1 AND 255),
    sort_order integer     NOT NULL DEFAULT 0,
    is_active  boolean     NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 3. Pickup locations
-- v1 เก็บ pickup_location เป็น free text บนสินค้าทุกแถว ทำให้
-- 'ตู้จำหน่ายสินค้า A ชั้น 1' กับ 'ตู้จำหน่ายสินค้า A ชั้น 1 ' เป็นคนละที่
-- และการเปลี่ยนชื่อจุดรับของต้อง UPDATE ทั้งแคตตาล็อก
-- =============================================================================
CREATE TABLE pickup_locations (
    id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       text        NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 255),
    address    text        NOT NULL DEFAULT '',
    is_active  boolean     NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 4. Products
--
-- ย้ายออกจากตารางนี้: promotion/discount_* (ไป product_promotions),
-- views/sold_count/sold_revenue (ไป product_stats และ view product_sales)
--
-- [FLOW] คงคอลัมน์ `image` ไว้ ทั้งที่ product_images.is_primary ครอบคลุมแล้ว
--   เพราะ seed.sql:15 และ orderRepository.js:63 (SELECT oi.*, p.image ...)
--   ใช้อยู่ ถือเป็น denormalized cache ของรูปหลัก โค้ดปัจจุบันเขียนทั้งสองที่
--   พร้อมกันอยู่แล้ว (productRepository.js:175-196)
--
-- [FLOW] คง status เป็น 'In Stock' / 'Pre-Order' ตามที่ frontend ใช้ 48 จุด
--   แต่ใส่ CHECK จำกัดโดเมน ซึ่งคือเป้าหมายจริงของ v2 (ของเดิมเป็น free text)
--   sale_mode เป็น GENERATED column ให้ view และ order_items ใช้ค่าที่สะอาด
--   โดยไม่ต้องแตะโค้ดฝั่งแอปเลย
-- =============================================================================
CREATE TABLE products (
    id                    integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku                   citext        UNIQUE,
    category_id           citext        REFERENCES categories(id) ON DELETE SET NULL,
    pickup_location_id    integer       REFERENCES pickup_locations(id) ON DELETE SET NULL,

    name                  text          NOT NULL CHECK (length(name) BETWEEN 1 AND 255),
    description           text          NOT NULL DEFAULT '',
    additional_info       text          NOT NULL DEFAULT '',
    image                 text          NOT NULL DEFAULT '',

    price                 numeric(12,2) NOT NULL CHECK (price >= 0),
    stock                 integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    purchase_limit        integer       CHECK (purchase_limit IS NULL OR purchase_limit > 0),

    status                text          NOT NULL DEFAULT 'In Stock'
                                        CHECK (status IN ('In Stock', 'Pre-Order')),
    sale_mode             text          GENERATED ALWAYS AS
                                        (CASE WHEN status = 'Pre-Order'
                                              THEN 'preorder' ELSE 'in_stock' END) STORED,
    preorder_release_date date,

    -- การลบสินค้าจริงทำให้ order_items.product_id กลายเป็น NULL และตัดสายรายงาน
    -- ใช้การเก็บเข้าคลังแทน แล้วกรองออกที่ชั้นแอป
    archived_at           timestamptz,

    created_at            timestamptz   NOT NULL DEFAULT now(),
    updated_at            timestamptz   NOT NULL DEFAULT now(),

    -- [FLOW] ร่างแรกใช้เงื่อนไขสองทาง (preorder ต้องมีวันที่ AND in_stock ต้องไม่มี)
    --   ซึ่งพังกับ productRepository.js:97-109 ที่ auto-flip 'Pre-Order' เป็น
    --   'In Stock' เมื่อถึงวันวางขาย โดยไม่ล้างวันที่ทิ้ง
    --   จึงเหลือเงื่อนไขทางเดียว: เป็น Pre-Order ต้องระบุวันวางขาย
    --   สินค้าที่วางขายแล้วยังเก็บวันที่ไว้เป็นประวัติได้
    CONSTRAINT preorder_requires_release_date CHECK (
        status <> 'Pre-Order' OR preorder_release_date IS NOT NULL
    )
);


-- =============================================================================
-- 5. Product images
-- partial unique index บังคับว่ารูปหลักมีได้รูปเดียวต่อสินค้า
-- ซึ่ง v1 ปล่อยให้เป็นหน้าที่ของโค้ดล้วน ๆ
-- =============================================================================
CREATE TABLE product_images (
    id            bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id    integer     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url     text        NOT NULL CHECK (length(image_url) > 0),
    display_order integer     NOT NULL DEFAULT 0,
    is_primary    boolean     NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX product_images_one_primary_per_product
    ON product_images (product_id) WHERE is_primary;

CREATE UNIQUE INDEX product_images_unique_order
    ON product_images (product_id, display_order);


-- =============================================================================
-- 6. Product promotions
-- แทนที่ 5 คอลัมน์ที่ส่วนใหญ่เป็น NULL บน products และให้ 3 อย่างที่ v1 ทำไม่ได้:
-- ตั้งโปรล่วงหน้าขณะที่โปรปัจจุบันยังรันอยู่, เก็บประวัติโปรโมชั่น,
-- และทำรายงานว่าอะไรเคยลดราคาเมื่อไหร่
--
-- EXCLUDE constraint คือหัวใจ: โปรโมชั่นสองอันที่ทับช่วงเวลากันบนสินค้าเดียวกัน
-- จะ insert ไม่ได้ในระดับฐานข้อมูล ปิดช่องที่ปกติรั่วเป็น race condition
--
-- [FLOW] ends_at ต้องเป็น nullable ได้ ร่างแรกบังคับ NOT NULL แต่
--   promotionService.js:38-45 (isWithinSchedule) ตีความ endDate ว่างว่า
--   "ไม่จำกัด" และสินค้าที่ promotion = true โดยไม่ตั้งวันหมดอายุมีอยู่จริง
--   ใน seed.sql tstzrange รองรับขอบบนแบบไม่จำกัดอยู่แล้ว
-- =============================================================================
CREATE TABLE product_promotions (
    id             bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id     integer       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    discount_type  text          NOT NULL CHECK (discount_type IN ('percent', 'amount')),
    discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
    starts_at      timestamptz   NOT NULL DEFAULT now(),
    ends_at        timestamptz,                      -- NULL = ไม่มีวันหมดอายุ
    created_at     timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT promotion_period_valid CHECK (ends_at IS NULL OR ends_at > starts_at),

    -- promotionService.js:4 กำหนด MAX_DISCOUNT_PERCENT = 90
    CONSTRAINT percent_discount_within_cap CHECK (
        discount_type <> 'percent' OR discount_value <= 90
    ),
    CONSTRAINT no_overlapping_promotions EXCLUDE USING gist (
        product_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    )
);


-- =============================================================================
-- 7. Product view counter
-- แยกออกจาก products โดยตั้งใจ ตัวนับที่ถูก +1 ทุกครั้งที่เปิดดูสินค้าจะจับ
-- row lock บนแถวสินค้า ไปบล็อกการอัปเดตราคาและสต็อก คนละตาราง คนละ lock
--
-- [FLOW] trigger ด้านล่างสร้างแถวให้อัตโนมัติตอน insert สินค้า
--   เพื่อไม่ให้โค้ดต้องจำว่าต้อง seed แถวนี้เอง
-- =============================================================================
CREATE TABLE product_stats (
    product_id integer     PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    view_count bigint      NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION create_product_stats_row() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO product_stats (product_id) VALUES (NEW.id)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_create_stats AFTER INSERT ON products
    FOR EACH ROW EXECUTE FUNCTION create_product_stats_row();


-- =============================================================================
-- 8. Customers
-- v1 ให้ customer_email เป็น NULL ได้พร้อมกับเป็น UNIQUE ซึ่งใน PostgreSQL
-- NULL ไม่ชนกัน จึงสะสมโปรไฟล์ที่ไม่มีตัวตนได้ไม่จำกัด ถ้า email คือสิ่งที่
-- ระบุตัวโปรไฟล์ มันต้อง NOT NULL ลูกค้าแบบไม่ระบุตัวตนจะไม่มีแถวที่นี่
-- (ดู orders.customer_id)
--
-- [FLOW] คอลัมน์ full_name / phone แก้บั๊กที่มีอยู่จริงตอนนี้:
--   orderController.js:394 INSERT customer_profiles (customer_email,
--   customer_name, customer_phone, customer_address) แต่ db.js:506-509
--   DROP คอลัมน์เหล่านั้นไปแล้ว โค้ดจึงพังเงียบ ๆ อยู่ใน try/catch
--   ชื่อคอลัมน์ที่ต้องแก้ในโค้ด: customer_email→email,
--   customer_name→full_name, customer_phone→phone, customer_address→ตัดทิ้ง
-- =============================================================================
CREATE TABLE customers (
    id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email      citext      NOT NULL UNIQUE
                           CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    full_name  text        NOT NULL DEFAULT '',
    phone      text        NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 9. Customer address book
--
-- [FLOW] postal_code ยอมให้เป็นสตริงว่างได้ ต่างจากร่างแรกที่บังคับ 5 หลักเสมอ
--   เพราะ memberController.js:119,161 บันทึกที่อยู่จากโปรไฟล์ซึ่งอาจกรอกไม่ครบ
--   ส่วนที่อยู่จัดส่งของออเดอร์จริง (order_shipping_addresses) ยังบังคับเข้ม
--   เพราะ orderController.js:352 ตรวจครบทุกช่องก่อนอยู่แล้ว
-- =============================================================================
CREATE TABLE customer_addresses (
    id             bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id    integer     NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label          text        NOT NULL DEFAULT '',
    recipient_name text        NOT NULL CHECK (length(recipient_name) > 0),
    phone          text        NOT NULL CHECK (length(phone) > 0),
    address_line   text        NOT NULL CHECK (length(address_line) > 0),
    subdistrict    text        NOT NULL DEFAULT '',
    district       text        NOT NULL DEFAULT '',
    province       text        NOT NULL DEFAULT '',
    postal_code    text        NOT NULL DEFAULT ''
                               CHECK (postal_code = '' OR postal_code ~ '^[0-9]{5}$'),
    is_default     boolean     NOT NULL DEFAULT false,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ที่อยู่เริ่มต้นมีได้อันเดียวต่อลูกค้า บังคับโดยฐานข้อมูล ไม่ใช่แค่หวังว่าโค้ดจะทำถูก
-- หมายเหตุ: memberController.js:113-125 ลบทั้งหมดแล้ว insert ใหม่ ต้องมั่นใจว่า
-- payload ที่ส่งมามี is_default = true ไม่เกินหนึ่งรายการ
CREATE UNIQUE INDEX customer_addresses_one_default
    ON customer_addresses (customer_id) WHERE is_default;


-- =============================================================================
-- 10. Orders
--
-- [FLOW] order_no แทน order_uuid ร่างแรกประกาศเป็น uuid ซึ่งใช้ไม่ได้เลย
--   orderRepository.js:28-54 สร้างเลข 'CAMT-YYYYMMDD-NNNN' และค้นด้วย
--   LIKE 'CAMT-...%' เพื่อหาเลขถัดไป เลขนี้คือเลขที่ลูกค้าเห็นบนใบเสร็จ
--   ไม่ใช่ surrogate key ที่จะแทนด้วย uuid ได้
--
-- [FLOW] contact_name / contact_phone ต้องเป็น NULL ได้
--   flow จริงคือสร้างออเดอร์ก่อน → จ่ายเงิน → ค่อยกรอกชื่อ/เบอร์/ที่อยู่ผ่าน
--   PUT /api/orders/:orderId/address (orderController.js:335)
--   ร่างแรกบังคับ NOT NULL ทำให้ INSERT แถวแรกพังทันที
--   NULL ตรงนี้แปลว่า "ยังไม่ได้กรอก" ซึ่งเป็นสถานะจริงของธุรกิจ
--
-- [FLOW] pickup_location_id ไม่บังคับ ร่างแรกมี CHECK ว่า pickup ต้องมี
--   location แต่ระบบนี้ผูกจุดรับของไว้กับ "สินค้า" ไม่ใช่ "ออเดอร์"
--   (products.pickup_location_id) และ delivery_method ดีฟอลต์เป็น pickup
--   ทุกออเดอร์จึงจะติด constraint ทันที
--
-- total_amount เป็น generated column จึง drift จากส่วนประกอบไม่ได้
-- v1 เก็บแยกอิสระ บั๊กปัดเศษหรือการอัปเดตไม่ครบทำให้ยอดรวมขัดกับรายการสินค้า
-- ของตัวเองได้ตลอดไป
--
-- !! สำคัญมากตอนแก้โค้ด: subtotal ต้องเป็นยอด "ก่อน" หักส่วนลด
--    orderRepository.js:247-248 คำนวณ itemsSubtotal จาก unitPrice ที่หัก
--    ส่วนลดแล้ว ถ้าส่งค่านั้นมาเป็น subtotal ตรง ๆ จะโดนหักส่วนลดซ้ำ
--    ต้องส่ง subtotal = itemsSubtotal + discountTotal
-- =============================================================================
CREATE TABLE orders (
    id                 bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_no           text          NOT NULL UNIQUE
                                     CHECK (order_no ~ '^CAMT-[0-9]{8}-[0-9]{4,}$'),

    customer_id        integer       REFERENCES customers(id) ON DELETE SET NULL,
    handler_id         integer       REFERENCES staff(id) ON DELETE SET NULL,

    -- NULL = ลูกค้ายังไม่ได้กรอกข้อมูลติดต่อ (ยังอยู่ระหว่าง checkout)
    contact_name       text,
    contact_phone      text,
    contact_email      citext,

    delivery_method    text          NOT NULL DEFAULT 'pickup'
                                     CHECK (delivery_method IN ('pickup', 'delivery')),
    pickup_location_id integer       REFERENCES pickup_locations(id) ON DELETE SET NULL,
    shipping_mode      text          NOT NULL DEFAULT 'combined'
                                     CHECK (shipping_mode IN ('combined', 'split')),

    subtotal           numeric(12,2) NOT NULL CHECK (subtotal >= 0),   -- ก่อนหักส่วนลด
    discount_total     numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    shipping_fee       numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    total_amount       numeric(12,2) GENERATED ALWAYS AS
                                     (subtotal - discount_total + shipping_fee) STORED,

    payment_status     text          NOT NULL DEFAULT 'pending'
                                     CHECK (payment_status IN ('pending', 'paid',
                                                               'failed', 'refunded')),

    -- [FLOW] milestone timestamp ระดับออเดอร์ ตารางที่ถูกต้องตามหลักการคือ
    --   payments (สำหรับเงิน) และ order_items (สำหรับการจัดของ) แต่คงสอง
    --   คอลัมน์นี้ไว้เพราะเป็นเวลาของ "เหตุการณ์ระดับออเดอร์" ที่ไม่ซ้ำซ้อน
    --   กับข้อมูลรายบรรทัด และ orderRepository.js:460 ใช้เรียงรายงาน
    paid_at            timestamptz,
    fulfilled_at       timestamptz,

    placed_at          timestamptz   NOT NULL DEFAULT now(),
    cancelled_at       timestamptz,
    updated_at         timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT discount_not_above_subtotal CHECK (discount_total <= subtotal),
    CONSTRAINT paid_at_matches_status CHECK (
        payment_status <> 'paid' OR paid_at IS NOT NULL
    )
);


-- =============================================================================
-- 11. Order shipping address (0..1 ต่อออเดอร์)
-- primary key คือ foreign key ตัวเดียวกัน ซึ่งเป็นวิธีเขียนความสัมพันธ์
-- แบบหนึ่งต่อหนึ่งใน SQL แถวนี้มีเฉพาะออเดอร์ที่จัดส่ง ทำให้ NULL เจ็ดคอลัมน์
-- หายไปจากตาราง orders
--
-- คอลัมน์เหล่านี้เป็น snapshot ที่ตั้งใจคัดลอกมาจาก customer_addresses ไม่ใช่
-- การอ้างอิง ถ้าเดือนหน้าลูกค้าแก้ที่อยู่ ใบเสร็จเดือนนี้ต้องยังแสดงที่อยู่
-- ที่พัสดุถูกส่งไปจริง
--
-- [FLOW] orderController.js:337-350 รับ addressStreet, subdistrict, district,
--   province, zipcode มาแยกช่องอยู่แล้ว จึงแมปลงตารางนี้ได้ตรง ๆ
--   ส่วน customerAddressFormatted ที่เคยยัดลง orders.customer_address
--   ให้เลิกใช้ แล้วประกอบกลับตอนอ่านแทน
-- =============================================================================
CREATE TABLE order_shipping_addresses (
    order_id       bigint  PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    recipient_name text    NOT NULL CHECK (length(recipient_name) > 0),
    phone          text    NOT NULL CHECK (length(phone) > 0),
    address_line   text    NOT NULL CHECK (length(address_line) > 0),
    subdistrict    text    NOT NULL,
    district       text    NOT NULL,
    province       text    NOT NULL,
    postal_code    text    NOT NULL CHECK (postal_code ~ '^[0-9]{5}$')
);


-- =============================================================================
-- 12. Shipments
--
-- [FLOW] shipment_type ต้องมี 'combined' ด้วย ร่างแรกมีแค่สองค่า แต่
--   orderRepository.js:161-166 อ่านสามค่า: 'combined', 'instock', 'preorder'
--   โดย combined เป็น fallback ของอีกสองอัน และคงชื่อ 'instock' (ไม่ใช่
--   'in_stock') ตามที่โค้ดส่งเข้ามา
--
-- [FLOW] ตัด CHECK shipped_requires_details ของร่างแรกออก เพราะ
--   upsertShipment(orderDbId, type, courier, tracking, stampShippedAt=false)
--   ที่ orderRepository.js:131-153 ตั้ง status = 'shipped' ได้โดยที่
--   courier/tracking เป็น null และ shipped_at เป็น NULL ตามอาร์กิวเมนต์
--   กฎนี้ควรบังคับที่ชั้นแอปแทน มิฉะนั้นการแก้เลขพัสดุจะพัง
--
-- UNIQUE (order_id, shipment_type) เพิ่มเข้ามาเพราะ upsertShipment ทำ
-- select-then-update ด้วยมือเพื่อกันแถวซ้ำอยู่แล้ว (ดูคอมเมนต์ที่บรรทัด 128-129)
-- ใส่ constraint จริงแล้วโค้ดจะกลายเป็น ON CONFLICT ได้ตรง ๆ
-- !! ตอน migrate ต้องลบแถวซ้ำของข้อมูลเก่าก่อน ไม่งั้นสร้าง index ไม่ผ่าน
-- =============================================================================
CREATE TABLE order_shipments (
    id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        bigint      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shipment_type   text        NOT NULL DEFAULT 'combined'
                                CHECK (shipment_type IN ('combined', 'instock', 'preorder')),
    courier_name    text,
    tracking_number text,
    status          text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'shipped',
                                                  'delivered', 'returned')),
    shipped_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT order_shipments_one_per_type UNIQUE (order_id, shipment_type)
);


-- =============================================================================
-- 13. Order items
--
-- product_status ต่อบรรทัด คือสิ่งที่แทนคู่คอลัมน์
-- fulfillment_status_instock / fulfillment_status_preorder บน orders:
-- สองคอลัมน์นั้นเป็น repeating group ที่ขัดแย้งกันเองได้ และขัดแย้งกับรายการ
-- สินค้าจริงได้ ให้ group ตาม product_status แทน (ดู view order_fulfillment)
--
-- [FLOW] คงชื่อคอลัมน์ product_status และค่า 'In Stock'/'Pre-Order'
--   ตามที่ orderRepository.js:282 เขียนลงไป แต่ใส่ CHECK จำกัดโดเมน
--
-- list_price เป็น NOT NULL และมีค่าเสมอ ของเดิม original_unit_price เป็น
-- nullable และแปลว่า "อาจจะเคยมีส่วนลด" ทุก query ที่คิดกำไรจึงต้องเขียน
-- COALESCE(original_unit_price, unit_price)
-- =============================================================================
CREATE TABLE order_items (
    id                 bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id           bigint        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id         integer       REFERENCES products(id) ON DELETE SET NULL,
    shipment_id        bigint        REFERENCES order_shipments(id) ON DELETE SET NULL,

    product_name       text          NOT NULL,
    unit_price         numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    list_price         numeric(12,2) NOT NULL CHECK (list_price >= 0),
    quantity           integer       NOT NULL CHECK (quantity > 0),
    line_total         numeric(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,

    product_status     text          NOT NULL DEFAULT 'In Stock'
                                     CHECK (product_status IN ('In Stock', 'Pre-Order')),
    fulfillment_status text          NOT NULL DEFAULT 'pending'
                                     CHECK (fulfillment_status IN ('pending', 'fulfilled',
                                                                   'cancelled')),
    fulfilled_at       timestamptz,
    created_at         timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT charged_not_above_list CHECK (unit_price <= list_price),

    -- สถานะกับเวลาของมันขัดแย้งกันไม่ได้ NULL ใน fulfilled_at จึงมีความหมาย
    -- เดียวเท่านั้น: ยังไม่ได้จัดของ
    CONSTRAINT fulfilled_at_matches_status CHECK (
        (fulfillment_status = 'fulfilled') = (fulfilled_at IS NOT NULL)
    )
);


-- =============================================================================
-- 14. Payments
-- v1 ยุบการจ่ายเงินครั้งเดียวลงบน orders เป็น payment_status + paid_at +
-- payment_gateway_ref โมเดลนั้นไม่มีที่ว่างสำหรับการจ่ายพลาดแล้วจ่ายใหม่
-- และไม่มีที่ว่างสำหรับการคืนเงิน
--
-- partial unique index บน gateway reference คือ idempotency key:
-- webhook ที่ถูกยิงซ้ำจะบันทึกซ้ำไม่ได้ (แทน orders.payment_gateway_ref เดิม
-- ที่ orderRepository.js:370 เขียนทับได้เรื่อย ๆ)
-- =============================================================================
CREATE TABLE payments (
    id           bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id     bigint        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount       numeric(12,2) NOT NULL CHECK (amount <> 0),  -- ติดลบ = คืนเงิน
    method       text          NOT NULL
                               CHECK (method IN ('cash', 'card', 'promptpay', 'transfer')),
    gateway      text,
    gateway_ref  text,
    status       text          NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'succeeded', 'failed')),
    processed_at timestamptz,
    created_at   timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT settled_requires_timestamp CHECK (
        status = 'pending' OR processed_at IS NOT NULL
    )
);

CREATE UNIQUE INDEX payments_gateway_ref_idempotent
    ON payments (gateway, gateway_ref) WHERE gateway_ref IS NOT NULL;


-- =============================================================================
-- 15. Kiosk content and configuration
-- =============================================================================
CREATE TABLE screensavers (
    id            bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title         text        NOT NULL DEFAULT 'Untitled Ad',
    media_type    text        NOT NULL DEFAULT 'image'
                              CHECK (media_type IN ('image', 'video')),
    file_url      text        NOT NULL CHECK (length(file_url) > 0),
    is_enabled    boolean     NOT NULL DEFAULT true,
    display_order integer     NOT NULL DEFAULT 0,
    duration_sec  integer     NOT NULL DEFAULT 10 CHECK (duration_sec BETWEEN 1 AND 600),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- [FLOW] value เป็น text ไม่ใช่ jsonb ร่างแรกประกาศ jsonb NOT NULL แต่ค่าที่
--   ระบบเขียนจริงเป็นสตริงเปล่า ๆ ที่ไม่ใช่ JSON ที่ valid เช่น
--   '@ditcsupport', '02-123-4567 / 081-234-5678', 'main_screen.jpeg',
--   'เปิดบริการ 08:00 - 20:00 น.' (db.js:201-213, settingController.js:60-75)
--   ทั้ง migration และการเขียนใหม่จะพังทันที
--   ค่าที่เป็น JSON จริง ๆ มีแค่ popular_search_tags กับ
--   screensaver_featured_products ซึ่งเก็บเป็น text แล้ว parse ที่ชั้นแอปได้
CREATE TABLE system_settings (
    key        text        PRIMARY KEY,
    value      text        NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- v1 เก็บ kiosk_stats เป็นจำนวนเต็มสะสมค่าเดียวต่อ key ซึ่งตอบคำถาม
-- "อังคารที่แล้วมีคนใช้กี่ครั้ง" ไม่ได้ event log แบบ append-only ตอบได้
-- และม้วนรวมเป็นช่วงเวลาไหนก็ได้
CREATE TABLE kiosk_events (
    id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_key   text        NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb
);


-- =============================================================================
-- 16. Derived reads
-- อะไรที่คำนวณได้ ให้คำนวณตรงนี้ แทนที่จะเก็บไว้แล้วมาคอยดูแลด้วยมือ
-- ถ้าต้นทุน query โผล่มาใน profiling ค่อยเลื่อนขึ้นเป็น MATERIALIZED VIEW
-- พร้อม REFRESH ตามตาราง
-- =============================================================================

-- ราคาขายปัจจุบัน เพราะโปรโมชั่นทับกันไม่ได้ จึงมีได้มากสุดหนึ่งแถวที่แมตช์
-- ไม่ต้อง aggregate
CREATE VIEW product_current_price AS
SELECT
    p.id AS product_id,
    p.price AS list_price,
    CASE
        WHEN pr.id IS NULL                THEN p.price
        WHEN pr.discount_type = 'percent' THEN round(p.price * (1 - pr.discount_value / 100), 2)
        ELSE greatest(p.price - pr.discount_value, 0)
    END AS effective_price,
    pr.id            AS promotion_id,
    pr.discount_type AS discount_type,
    pr.discount_value AS discount_value,
    pr.starts_at     AS discount_starts_at,
    pr.ends_at       AS discount_ends_at,
    (pr.id IS NOT NULL) AS promotion
FROM products p
LEFT JOIN product_promotions pr
       ON pr.product_id = p.id
      AND now() <@ tstzrange(pr.starts_at, pr.ends_at);

-- แทนที่ products.sold_count / products.sold_revenue ซึ่งเป็นตัวนับที่ไม่มี
-- constraint ผูกกับความจริง transaction ที่ fail หรือออเดอร์ที่ถูกยกเลิก
-- ทำให้มันผิดถาวร
CREATE VIEW product_sales AS
SELECT
    p.id AS product_id,
    COALESCE(SUM(oi.quantity)   FILTER (WHERE o.payment_status = 'paid'), 0) AS sold_count,
    COALESCE(SUM(oi.line_total) FILTER (WHERE o.payment_status = 'paid'), 0) AS sold_revenue
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o       ON o.id = oi.order_id
GROUP BY p.id;

-- จุดเดียวที่โค้ดควรอ่านตัวเลขของสินค้า รวม views + ยอดขาย + ราคาหลังลด
-- ไว้ให้แล้ว จะได้ไม่ต้อง JOIN สามที่ทุกครั้ง
CREATE VIEW product_metrics AS
SELECT
    p.id AS product_id,
    COALESCE(ps.view_count, 0) AS views,
    sales.sold_count,
    sales.sold_revenue,
    cp.effective_price,
    cp.promotion
FROM products p
LEFT JOIN product_stats  ps    ON ps.product_id = p.id
LEFT JOIN product_sales  sales ON sales.product_id = p.id
LEFT JOIN product_current_price cp ON cp.product_id = p.id;

-- แทนที่คอลัมน์ fulfillment สามตัวบน orders ด้วยคำตอบเดียวที่ได้มาจาก
-- รายการสินค้าจริง
--
-- [FLOW] คืนค่าในรูปแบบเดียวกับที่โค้ดเดิมคาดหวังทุกประการ
--   ('none' เมื่อออเดอร์ไม่มีสินค้าประเภทนั้นเลย / 'pending' / 'fulfilled')
--   เพื่อให้ orderRepository เปลี่ยนแค่ "อ่านจากไหน" ไม่ต้องเปลี่ยน logic
CREATE VIEW order_fulfillment AS
SELECT
    o.id AS order_id,
    CASE
        WHEN count(oi.id) = 0                                                    THEN 'pending'
        WHEN count(oi.id) FILTER (WHERE oi.fulfillment_status = 'pending') = 0   THEN 'fulfilled'
        WHEN count(oi.id) FILTER (WHERE oi.fulfillment_status = 'fulfilled') = 0 THEN 'pending'
        ELSE 'partial'
    END AS fulfillment_status,
    CASE
        WHEN count(oi.id) FILTER (WHERE oi.product_status = 'In Stock') = 0 THEN 'none'
        WHEN count(oi.id) FILTER (WHERE oi.product_status = 'In Stock'
                                    AND oi.fulfillment_status = 'pending') = 0 THEN 'fulfilled'
        ELSE 'pending'
    END AS fulfillment_status_instock,
    CASE
        WHEN count(oi.id) FILTER (WHERE oi.product_status = 'Pre-Order') = 0 THEN 'none'
        WHEN count(oi.id) FILTER (WHERE oi.product_status = 'Pre-Order'
                                    AND oi.fulfillment_status = 'pending') = 0 THEN 'fulfilled'
        ELSE 'pending'
    END AS fulfillment_status_preorder
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

-- [FLOW] view ชื่อเดิมเพื่อให้ฝั่งอ่านไม่ต้องแก้
--   statsRepository.js:30 และ reportRepository.js:47 ยิง
--   SELECT value FROM kiosk_stats WHERE key = '...' ได้เหมือนเดิม
--   มีแค่ฝั่งเขียน (statsRepository.js:10-13) ที่ต้องเปลี่ยนเป็น
--   INSERT INTO kiosk_events (event_key) VALUES (...)
CREATE VIEW kiosk_stats AS
SELECT event_key AS key, count(*)::integer AS value
FROM kiosk_events
GROUP BY event_key;


-- =============================================================================
-- 17. Indexes
-- PostgreSQL สร้าง index ให้ primary key และ unique constraint อัตโนมัติ
-- แต่ "ไม่" สร้างให้ foreign key v1 ทำไว้ 3 จาก 8 แปลว่าทุก query
-- "ขอออเดอร์ของลูกค้าคนนี้" คือ sequential scan และทุก DELETE บนตารางแม่
-- ต้องสแกนตารางลูกเพื่อตรวจ constraint
-- =============================================================================
CREATE INDEX ON products (category_id);
CREATE INDEX ON products (pickup_location_id);
CREATE INDEX ON products (status) WHERE archived_at IS NULL;
CREATE INDEX ON product_images (product_id);
CREATE INDEX ON product_promotions (product_id, starts_at, ends_at);
CREATE INDEX ON customer_addresses (customer_id);
CREATE INDEX ON orders (customer_id);
CREATE INDEX ON orders (handler_id);
CREATE INDEX ON orders (pickup_location_id);
CREATE INDEX ON orders (placed_at DESC);
CREATE INDEX ON orders (payment_status) WHERE payment_status = 'pending';
-- รองรับ generateOrderId() ที่ค้น LIKE 'CAMT-YYYYMMDD-%' แล้ว ORDER BY DESC
CREATE INDEX ON orders (order_no text_pattern_ops);
CREATE INDEX ON orders (fulfilled_at DESC NULLS LAST);
CREATE INDEX ON order_items (order_id);
CREATE INDEX ON order_items (product_id);
CREATE INDEX ON order_items (shipment_id);
CREATE INDEX ON order_shipments (order_id);
CREATE INDEX ON payments (order_id);
CREATE INDEX ON kiosk_events (event_key, occurred_at DESC);


-- =============================================================================
-- 18. updated_at triggers
-- =============================================================================
CREATE TRIGGER trg_staff_updated              BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated         BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated           BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_customers_updated          BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_customer_addresses_updated BEFORE UPDATE ON customer_addresses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated             BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_screensavers_updated       BEFORE UPDATE ON screensavers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_system_settings_updated    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_product_stats_updated      BEFORE UPDATE ON product_stats
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
