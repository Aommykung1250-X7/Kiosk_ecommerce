// backend/src/repositories/productRepository.js
import pool from "../data/db.js";

class ProductRepository {
  /**
   * Fetch all products from the PostgreSQL database
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const res = await pool.query("SELECT * FROM products ORDER BY id ASC");
      return res.rows.map(row => ({
        ...row,
        price: parseFloat(row.price),
        // แมปชื่อฟิลด์จาก Database (snake_case) เป็นฟิลด์ที่หน้าบ้านใช้ (camelCase)
        quantity: row.stock,
        pickupLocation: row.pickup_location
      }));
    } catch (error) {
      console.error("Error in ProductRepository.getAll:", error);
      throw error;
    }
  }

  /**
   * Fetch products filtered by category
   * @param {string} category 
   * @returns {Promise<Array>}
   */
  async getByCategory(category) {
    try {
      const res = await pool.query(
        "SELECT * FROM products WHERE category = $1 ORDER BY id ASC",
        [category]
      );
      return res.rows.map(row => ({
        ...row,
        price: parseFloat(row.price),
        quantity: row.stock,
        pickupLocation: row.pickup_location
      }));
    } catch (error) {
      console.error("Error in ProductRepository.getByCategory:", error);
      throw error;
    }
  }

  /**
   * Fetch products on promotion
   * @returns {Promise<Array>}
   */
  async getPromotions() {
    try {
      const res = await pool.query(
        "SELECT * FROM products WHERE promotion = true ORDER BY id ASC"
      );
      return res.rows.map(row => ({
        ...row,
        price: parseFloat(row.price),
        quantity: row.stock,
        pickupLocation: row.pickup_location
      }));
    } catch (error) {
      console.error("Error in ProductRepository.getPromotions:", error);
      throw error;
    }
  }

  /**
   * Create a new product in DB
   * @param {object} p - Product details
   */
  async create(p) {
    const query = `
      INSERT INTO products (name, description, price, stock, category, image, promotion, pickup_location, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [p.name, p.description, p.price, p.stock || 0, p.category, p.image, p.promotion || false, p.pickupLocation || null, p.status || 'In Stock'];
    try {
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (error) {
      console.error("Error in ProductRepository.create:", error);
      throw error;
    }
  }

  /**
   * Update an existing product in DB
   * @param {number} id 
   * @param {object} p - Product details
   */
  async update(id, p) {
    const query = `
      UPDATE products 
      SET name = $1, description = $2, price = $3, stock = $4, category = $5, image = $6, promotion = $7, pickup_location = $8, status = $9
      WHERE id = $10
      RETURNING *
    `;
    const values = [p.name, p.description, p.price, p.stock, p.category, p.image, p.promotion, p.pickupLocation, p.status, id];
    try {
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;
      return res.rows[0];
    } catch (error) {
      console.error("Error in ProductRepository.update:", error);
      throw error;
    }
  }

  /**
   * Delete a product by ID
   * @param {number} id 
   */
  async delete(id) {
    const query = `DELETE FROM products WHERE id = $1`;
    try {
      const res = await pool.query(query, [id]);
      return res.rowCount > 0;
    } catch (error) {
      console.error("Error in ProductRepository.delete:", error);
      throw error;
    }
  }

  /**
   * Decrease product stock by a certain amount (clamped to 0)
   * @param {number|string} productId 
   * @param {number} amount 
   */
  async decreaseStock(productId, amount) {
    const query = `
      UPDATE products 
      SET stock = GREATEST(0, stock - $1) 
      WHERE id = $2
    `;
    try {
      // แปลง ID เป็นตัวเลขเนื่องจากเก็บใน DB เป็น SERIAL
      await pool.query(query, [amount, parseInt(productId, 10)]);
    } catch (error) {
      console.error(`Error decreasing stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Increment the view counter of a product by 1
   * @param {number|string} productId 
   */
  async incrementViews(productId) {
    const query = `
      UPDATE products 
      SET views = views + 1 
      WHERE id = $1
      RETURNING *
    `;
    try {
      const res = await pool.query(query, [parseInt(productId, 10)]);
      return res.rows[0];
    } catch (error) {
      console.error(`Error incrementing views for product ${productId}:`, error);
      throw error;
    }
  }
}

export default new ProductRepository();
