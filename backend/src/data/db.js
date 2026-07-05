import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'aommykung',
    host: 'localhost',
    database: 'kiosk_db',
    password: '1250Za',
    port: 5432
});

export const initDb = async () => {
    // ดร็อปตารางเก่าหากโครงสร้าง id ยังเป็นแบบ VARCHAR ( character varying ) เพื่ออัปเดตเป็น SERIAL
    try {
        const checkIdType = await pool.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'id'
        `);
        
        if (checkIdType.rows.length > 0 && checkIdType.rows[0].data_type === 'character varying') {
            console.log("Dropping old tables to change product ID column type to SERIAL...");
            await pool.query("DROP TABLE IF EXISTS orders CASCADE;");
            await pool.query("DROP TABLE IF EXISTS products CASCADE;");
        }

        // ตรวจสอบโครงสร้างตาราง orders ว่ามีคอลัมน์ customer_name หรือยัง หากไม่มีให้ดรอปแล้วสร้างใหม่
        const checkOrdersCol = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'customer_name'
        `);

        if (checkOrdersCol.rows.length === 0) {
            console.log("Dropping old orders table to apply updated columns...");
            await pool.query("DROP TABLE IF EXISTS orders CASCADE;");
        }
    } catch (e) {
        // ละเว้นหากยังไม่มีตาราง
    }

    const queryText = `
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK(role IN('admin', 'staff')),
        name VARCHAR(100) NOT NULL,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders(
        id SERIAL PRIMARY KEY,
        order_uuid VARCHAR(100) NOT NULL UNIQUE,
        total_amount NUMERIC(10, 2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK(payment_status IN('pending', 'paid', 'failed')),
        fulfillment_status VARCHAR(50) DEFAULT 'pending' CHECK(fulfillment_status IN('pending', 'fulfilled')),
        handler_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_email VARCHAR(100),
        customer_address TEXT,
        slip_url TEXT,
        items JSONB,
        paid_at TIMESTAMP,
        fulfilled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(queryText);
        console.log('Database tables initialized successfully');
        // ตารางถูกสร้างขึ้นหรือมีอยู่แล้วในระบบเรียบร้อย
    } catch (err) {
        console.error('Error initializing database tables:', err);
    }
};

export default pool;