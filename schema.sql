-- Schema extracted directly from live PostgreSQL database

DROP TABLE IF EXISTS order_shipments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS screensavers CASCADE;
DROP TABLE IF EXISTS kiosk_stats CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- 1. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK(role IN('admin', 'staff')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories
CREATE TABLE categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image VARCHAR(255),
    promotion BOOLEAN DEFAULT FALSE,
    pickup_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'In Stock',
    views INTEGER DEFAULT 0,
    preorder_release_date DATE DEFAULT NULL,
    purchase_limit INTEGER DEFAULT NULL,
    category_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Images
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- 5. Customer Profiles
CREATE TABLE customer_profiles (
    id SERIAL PRIMARY KEY,
    customer_email VARCHAR(100) UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Customer Addresses
CREATE TABLE customer_addresses (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- 7. Orders
CREATE TABLE orders (
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
    paid_at TIMESTAMP,
    fulfilled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_option VARCHAR(50) DEFAULT 'pickup',
    shipping_option VARCHAR(50) DEFAULT 'combined',
    payment_gateway_ref VARCHAR(255) DEFAULT NULL,
    customer_id INTEGER REFERENCES customer_profiles(id) ON DELETE SET NULL
);

-- 8. Order Items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    product_status VARCHAR(50) DEFAULT 'In Stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfillment_status VARCHAR(50) DEFAULT 'pending',
    fulfilled_at TIMESTAMP
);

-- 9. Order Shipments
CREATE TABLE order_shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shipment_type VARCHAR(50) NOT NULL DEFAULT 'instock',
    courier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    shipped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_shipments_order_id ON order_shipments(order_id);

-- 10. Screensavers
CREATE TABLE screensavers (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) DEFAULT 'image',
    file_url TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) DEFAULT 'Untitled Ad'
);

-- 11. Kiosk Stats
CREATE TABLE kiosk_stats (
    key VARCHAR(100) PRIMARY KEY,
    value INTEGER DEFAULT 0
);

-- 12. System Settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT
);
