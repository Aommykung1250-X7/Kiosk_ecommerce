import pool from "./backend/src/data/db.js";

async function run() {
  try {
    console.log("Starting category reset migration...");
    
    // 1. อัปเดตสินค้าทั้งหมดที่อยู่ในหมวดหมู่เดิม (drinks, snacks, instant) ไปที่ 'sweet' (ขนมหวาน)
    const updateProducts1 = await pool.query(
      "UPDATE products SET category = 'sweet' WHERE category IN ('drinks', 'snacks', 'instant')"
    );
    console.log(`Updated ${updateProducts1.rowCount} products from drinks/snacks/instant to 'sweet'`);

    // 2. ล้างข้อมูลหมวดหมู่ทั้งหมดในตาราง categories
    await pool.query("DELETE FROM categories");
    console.log("Cleared categories table");

    // 3. แทรกหมวดหมู่ใหม่ 3 หมวดหมู่หลัก
    await pool.query(`
      INSERT INTO categories (id, name) VALUES
      ('toy', 'ของเล่น'),
      ('sweet', 'ขนมหวาน'),
      ('stationery', 'เครื่องเขียน')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("Successfully seeded new categories: toy, sweet, stationery");

    console.log("Migration reset completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

run();
