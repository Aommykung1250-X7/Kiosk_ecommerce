import pkg from 'pg';
const { Pool, types } = pkg;

// Force node-postgres to parse TIMESTAMP (without timezone) as UTC
types.setTypeParser(1114, (val) => {
    return new Date(val.replace(' ', 'T') + 'Z');
});

const pool = new Pool({
    user: process.env.DB_USER || 'aommykung',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'kiosk_db',
    password: process.env.DB_PASSWORD || '1250Za',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432
});

export const initDb = async () => {

    const queryText = `
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN('admin', 'staff')),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories(
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(100),
        image VARCHAR(100),
        promotion BOOLEAN DEFAULT FALSE,
        pickup_location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'In Stock',
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders(
        id SERIAL PRIMARY KEY,
        order_uuid VARCHAR(100) NOT NULL UNIQUE,
        total_amount NUMERIC(10, 2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK(payment_status IN('pending', 'paid', 'failed')),
        fulfillment_status VARCHAR(50) DEFAULT 'pending' CHECK(fulfillment_status IN('pending', 'fulfilled')),
        fulfillment_status_instock VARCHAR(50) DEFAULT 'pending',
        fulfillment_status_preorder VARCHAR(50) DEFAULT 'pending',
        handler_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_email VARCHAR(100),
        customer_address TEXT,
        delivery_option VARCHAR(50) DEFAULT 'pickup',
        shipping_option VARCHAR(50) DEFAULT 'combined',
        courier_1 VARCHAR(100) DEFAULT NULL,
        tracking_number_1 VARCHAR(100) DEFAULT NULL,
        courier_2 VARCHAR(100) DEFAULT NULL,
        tracking_number_2 VARCHAR(100) DEFAULT NULL,
        payment_gateway_ref VARCHAR(255) DEFAULT NULL,
        paid_at TIMESTAMP,
        fulfilled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items(
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        product_status VARCHAR(50) DEFAULT 'In Stock',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(queryText);

        // Dynamic migrations: drop legacy unused columns from orders table if they exist
        await pool.query(`
            ALTER TABLE orders DROP COLUMN IF EXISTS slip_url;
            ALTER TABLE orders DROP COLUMN IF EXISTS courier;
            ALTER TABLE orders DROP COLUMN IF EXISTS tracking_number;
            ALTER TABLE orders DROP COLUMN IF EXISTS items;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status_instock VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status_preorder VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_option VARCHAR(50) DEFAULT 'pickup';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_option VARCHAR(50) DEFAULT 'combined';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_1 VARCHAR(100) DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number_1 VARCHAR(100) DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_2 VARCHAR(100) DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number_2 VARCHAR(100) DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway_ref VARCHAR(255) DEFAULT NULL;
        `);

        // Migrate existing fulfilled orders
        await pool.query(`
            UPDATE orders 
            SET fulfillment_status_instock = 'fulfilled', fulfillment_status_preorder = 'fulfilled' 
            WHERE fulfillment_status = 'fulfilled' 
              AND (fulfillment_status_instock = 'pending' OR fulfillment_status_preorder = 'pending');
        `);

        // Clean up pending orders sub-fulfillment statuses based on items content if column exists
        try {
            await pool.query(`
                UPDATE orders 
                SET 
                  fulfillment_status_instock = CASE 
                    WHEN items::text LIKE '%"status":"In Stock"%' OR items::text LIKE '%"status": "In Stock"%' THEN 'pending'::varchar
                    ELSE 'none'::varchar
                  END,
                  fulfillment_status_preorder = CASE 
                    WHEN items::text LIKE '%"status":"Pre-Order"%' OR items::text LIKE '%"status": "Pre-Order"%' THEN 'pending'::varchar
                    ELSE 'none'::varchar
                  END
                WHERE fulfillment_status = 'pending';
            `);
        } catch (e) {
            // Ignore if items column was dropped
        }

        // Alter products to add views if not exists
        await pool.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
        `);

        // Create kiosk_stats table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kiosk_stats(
                key VARCHAR(100) PRIMARY KEY,
                value INTEGER DEFAULT 0
            );
        `);

        // Seed session_wakeups
        await pool.query(`
            INSERT INTO kiosk_stats (key, value) 
            VALUES ('session_wakeups', 0) 
            ON CONFLICT (key) DO NOTHING;
        `);

        // Create system_settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings(
                key VARCHAR(100) PRIMARY KEY,
                value TEXT
            );
        `);

        // Seed system_settings
        await pool.query(`
            INSERT INTO system_settings (key, value) VALUES
            ('shipping_base_fee', '40.00'),
            ('screensaver_master_enabled', 'true'),
            ('screensaver_master_duration', '10'),
            ('screensaver_featured_products', '[]'),
            ('popular_search_tags', '["น้ำดื่ม", "ชาเขียว", "เลย์", "KitKat", "แก้วน้ำ", "เสื้อ"]'),
            ('contact_hotline', '02-123-4567 / 081-234-5678'),
            ('contact_line_id', '@ditcsupport'),
            ('contact_line_url', 'https://line.me/ti/p/@ditcsupport'),
            ('contact_line_qr_image', ''),
            ('contact_service_hours', 'เปิดบริการ 08:00 - 20:00 น.')
            ON CONFLICT (key) DO NOTHING;
        `);

        // Seed default categories
        await pool.query(`
            INSERT INTO categories (id, name) VALUES
            ('toy', 'ของเล่น'),
            ('sweet', 'ขนมหวาน'),
            ('stationery', 'เครื่องเขียน')
            ON CONFLICT (id) DO NOTHING;
        `);

        // Create unified customer_profiles table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customer_profiles (
                id SERIAL PRIMARY KEY,
                customer_email VARCHAR(100) UNIQUE,
                customer_name VARCHAR(255),
                customer_phone VARCHAR(50),
                customer_address TEXT,
                addresses JSONB DEFAULT '[]'::jsonb,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration: Ensure addresses JSONB column exists and drop obsolete line_user_id
        await pool.query(`
            ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;
            ALTER TABLE customer_profiles DROP COLUMN IF EXISTS line_user_id;
        `);

        // Migration: Populate addresses JSONB array from legacy customer_address if addresses is empty
        try {
            await pool.query(`
                UPDATE customer_profiles
                SET addresses = jsonb_build_array(
                  jsonb_build_object(
                    'id', 1,
                    'name', COALESCE(customer_name, ''),
                    'phone', COALESCE(customer_phone, ''),
                    'address', customer_address,
                    'isDefault', true
                  )
                )
                WHERE (addresses IS NULL OR addresses = '[]'::jsonb)
                  AND customer_address IS NOT NULL 
                  AND customer_address != '';
            `);
        } catch (migErr) {
            // Ignored if legacy columns were dropped
        }

        // Drop legacy line_members table if it exists
        try {
            await pool.query("DROP TABLE IF EXISTS line_members CASCADE;");
        } catch (mErr) {
            console.error("Error dropping legacy line_members table:", mErr);
        }

        // Create screensavers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS screensavers(
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) DEFAULT 'image',
                file_url TEXT NOT NULL,
                is_enabled BOOLEAN DEFAULT TRUE,
                display_order INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Alter products table
        await pool.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS preorder_release_date DATE DEFAULT NULL;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS purchase_limit INTEGER DEFAULT NULL;
            ALTER TABLE screensavers ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Untitled Ad';
        `);

        // Alter orders table
        await pool.query(`
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_option VARCHAR(50) DEFAULT 'pickup';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_option VARCHAR(50) DEFAULT 'combined';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway_ref VARCHAR(255) DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customer_profiles(id) ON DELETE SET NULL;
        `);

        // Alter order_items table
        await pool.query(`
            ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP;
        `);

        // Insert default shipping settings if not exist
        await pool.query(`
            INSERT INTO system_settings (key, value) VALUES ('shipping_base_fee', '40.00') ON CONFLICT (key) DO NOTHING;
            INSERT INTO system_settings (key, value) VALUES ('shipping_split_fee', '40.00') ON CONFLICT (key) DO NOTHING;
        `);

        // Alter products table to add category_id FK
        await pool.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL;
        `);

        // Migrate products.category to products.category_id
        try {
            await pool.query(`
                UPDATE products 
                SET category_id = category 
                WHERE category_id IS NULL AND category IS NOT NULL AND category IN (SELECT id FROM categories);
            `);
        } catch (catErr) {
            // Ignored if products.category was dropped
        }

        // Migrate orders.customer_id from customer_profiles matching email
        await pool.query(`
            UPDATE orders o
            SET customer_id = cp.id
            FROM customer_profiles cp
            WHERE o.customer_id IS NULL 
              AND o.customer_email IS NOT NULL 
              AND LOWER(o.customer_email) = LOWER(cp.customer_email);
        `);

        // Create customer_addresses table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customer_addresses (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
                recipient_name VARCHAR(255),
                phone VARCHAR(50),
                address_line TEXT NOT NULL,
                subdistrict VARCHAR(100),
                district VARCHAR(100),
                province VARCHAR(100),
                postal_code VARCHAR(20),
                is_default BOOLEAN DEFAULT FALSE,
                label VARCHAR(50) DEFAULT 'บ้าน',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
        `);

        // Data Migration: Populate customer_addresses from customer_profiles.addresses JSONB or customer_address
        try {
            await pool.query(`
                DO $$
                DECLARE
                    r RECORD;
                    addr JSONB;
                    idx INT;
                BEGIN
                    FOR r IN SELECT id, customer_name, customer_phone, customer_address, addresses FROM customer_profiles LOOP
                        IF r.addresses IS NOT NULL AND jsonb_array_length(r.addresses) > 0 THEN
                            FOR idx IN 0..jsonb_array_length(r.addresses)-1 LOOP
                                addr := r.addresses->idx;
                                IF addr->>'address' IS NOT NULL AND TRIM(addr->>'address') != '' THEN
                                    IF NOT EXISTS (
                                        SELECT 1 FROM customer_addresses ca WHERE ca.customer_id = r.id AND ca.address_line = TRIM(addr->>'address')
                                    ) THEN
                                        INSERT INTO customer_addresses (customer_id, recipient_name, phone, address_line, is_default)
                                        VALUES (
                                            r.id, 
                                            COALESCE(addr->>'name', r.customer_name, ''), 
                                            COALESCE(addr->>'phone', r.customer_phone, ''), 
                                            TRIM(addr->>'address'),
                                            COALESCE((addr->>'isDefault')::boolean, idx = 0)
                                        );
                                    END IF;
                                END IF;
                            END LOOP;
                        ELSIF r.customer_address IS NOT NULL AND TRIM(r.customer_address) != '' THEN
                            IF NOT EXISTS (
                                SELECT 1 FROM customer_addresses ca WHERE ca.customer_id = r.id AND ca.address_line = TRIM(r.customer_address)
                            ) THEN
                                INSERT INTO customer_addresses (customer_id, recipient_name, phone, address_line, is_default)
                                VALUES (
                                    r.id, 
                                    COALESCE(r.customer_name, ''), 
                                    COALESCE(r.customer_phone, ''), 
                                    TRIM(r.customer_address),
                                    TRUE
                                );
                            END IF;
                        END IF;
                    END IF;
                END LOOP;
            END $$;
        `);
        } catch (addrMigErr) {
            // Ignored if legacy customer_profiles columns were dropped
        }

        // Create order_shipments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_shipments (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                shipment_type VARCHAR(50) NOT NULL DEFAULT 'instock',
                courier_name VARCHAR(100),
                tracking_number VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                shipped_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_order_shipments_order_id ON order_shipments(order_id);
        `);

        // Data Migration: Migrate existing orders tracking to order_shipments
        try {
            await pool.query(`
                INSERT INTO order_shipments (order_id, shipment_type, courier_name, tracking_number, status)
                SELECT 
                    id AS order_id, 
                    'instock' AS shipment_type, 
                    courier_1 AS courier_name, 
                    tracking_number_1 AS tracking_number,
                    CASE WHEN fulfillment_status_instock = 'fulfilled' THEN 'shipped' ELSE 'pending' END AS status
                FROM orders
                WHERE (courier_1 IS NOT NULL AND courier_1 != '') OR (tracking_number_1 IS NOT NULL AND tracking_number_1 != '')
                  AND NOT EXISTS (
                      SELECT 1 FROM order_shipments os WHERE os.order_id = orders.id AND os.shipment_type = 'instock'
                  );

                INSERT INTO order_shipments (order_id, shipment_type, courier_name, tracking_number, status)
                SELECT 
                    id AS order_id, 
                    'preorder' AS shipment_type, 
                    courier_2 AS courier_name, 
                    tracking_number_2 AS tracking_number,
                    CASE WHEN fulfillment_status_preorder = 'fulfilled' THEN 'shipped' ELSE 'pending' END AS status
                FROM orders
                WHERE (courier_2 IS NOT NULL AND courier_2 != '') OR (tracking_number_2 IS NOT NULL AND tracking_number_2 != '')
                  AND NOT EXISTS (
                      SELECT 1 FROM order_shipments os WHERE os.order_id = orders.id AND os.shipment_type = 'preorder'
                  );
            `);
        } catch (shipErr) {
            // Ignored if legacy courier_1 / courier_2 columns were dropped
        }

        // Create product_images table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_images (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                display_order INTEGER DEFAULT 0,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
        `);

        // Data Migration: Migrate existing product images into product_images
        await pool.query(`
            INSERT INTO product_images (product_id, image_url, display_order, is_primary)
            SELECT id AS product_id, image AS image_url, 0 AS display_order, TRUE AS is_primary
            FROM products
            WHERE image IS NOT NULL AND TRIM(image) != ''
              AND NOT EXISTS (
                  SELECT 1 FROM product_images pi WHERE pi.product_id = products.id AND pi.image_url = products.image
              );
        `);

        // Drop obsolete / redundant columns across database tables
        await pool.query(`
            ALTER TABLE customer_profiles DROP COLUMN IF EXISTS customer_address;
            ALTER TABLE customer_profiles DROP COLUMN IF EXISTS addresses;
            ALTER TABLE customer_profiles DROP COLUMN IF EXISTS customer_name;
            ALTER TABLE customer_profiles DROP COLUMN IF EXISTS customer_phone;

            ALTER TABLE customer_addresses DROP COLUMN IF EXISTS label;

            ALTER TABLE orders DROP COLUMN IF EXISTS courier_1;
            ALTER TABLE orders DROP COLUMN IF EXISTS tracking_number_1;
            ALTER TABLE orders DROP COLUMN IF EXISTS courier_2;
            ALTER TABLE orders DROP COLUMN IF EXISTS tracking_number_2;

            ALTER TABLE products DROP COLUMN IF EXISTS category;
        `);

        console.log('Database tables initialized successfully');
        // ตารางถูกสร้างขึ้นหรือมีอยู่แล้วในระบบเรียบร้อย
    } catch (err) {
        console.error('Error initializing database tables:', err);
    }
};

export default pool;