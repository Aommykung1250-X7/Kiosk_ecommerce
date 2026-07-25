import pool from "../data/db.js";

class CategoryController {
  /**
   * Get all categories
   * GET /api/categories
   */
  async getCategories(req, res) {
    try {
      const result = await pool.query("SELECT * FROM categories ORDER BY created_at ASC");
      return res.json(result.rows);
    } catch (err) {
      console.error("Error in getCategories:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Create a new category
   * POST /api/categories
   */
  async createCategory(req, res) {
    try {
      const { id, name } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: "ID and name are required." });
      }

      const formattedId = id.trim().toLowerCase();
      // Check if id already exists
      const check = await pool.query("SELECT * FROM categories WHERE id = $1", [formattedId]);
      if (check.rows.length > 0) {
        return res.status(400).json({ error: "Category ID already exists." });
      }

      const result = await pool.query(
        "INSERT INTO categories (id, name) VALUES ($1, $2) RETURNING *",
        [formattedId, name.trim()]
      );

      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error in createCategory:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Update category name
   * PUT /api/categories/:id
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required." });
      }

      const check = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Category not found." });
      }

      const result = await pool.query(
        "UPDATE categories SET name = $1 WHERE id = $2 RETURNING *",
        [name.trim(), id]
      );

      return res.json(result.rows[0]);
    } catch (err) {
      console.error("Error in updateCategory:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const check = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Category not found." });
      }

      // Check if any product uses this category
      const prodCheck = await pool.query("SELECT * FROM products WHERE category = $1 LIMIT 1", [id]);
      if (prodCheck.rows.length > 0) {
        return res.status(400).json({ error: "Cannot delete category as it is currently in use by products." });
      }

      await pool.query("DELETE FROM categories WHERE id = $1", [id]);
      return res.json({ success: true, message: "Category deleted." });
    } catch (err) {
      console.error("Error in deleteCategory:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new CategoryController();
