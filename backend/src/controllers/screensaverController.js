import pool from "../data/db.js";
import fs from "fs";
import path from "path";

class ScreensaverController {
  /**
   * Get all active screensavers for public display
   * GET /api/screensavers/active
   */
  async getActiveScreensavers(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, type as "mediaType", file_url as "mediaUrl", is_enabled as "isActive", display_order as "displayOrder", duration, title 
         FROM screensavers 
         WHERE is_enabled = true 
         ORDER BY display_order ASC, id ASC`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("Error in getActiveScreensavers:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Get all screensavers for Admin view
   * GET /api/screensavers
   */
  async getScreensavers(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, type as "mediaType", file_url as "mediaUrl", is_enabled as "isActive", display_order as "displayOrder", duration, title 
         FROM screensavers 
         ORDER BY display_order ASC, id ASC`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error("Error in getScreensavers:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Create a new screensaver
   * POST /api/screensavers
   */
  async createScreensaver(req, res) {
    try {
      const { title, mediaUrl, duration, displayOrder, isActive } = req.body;
      
      if (!mediaUrl) {
        return res.status(400).json({ error: "mediaUrl is required." });
      }

      const result = await pool.query(
        `INSERT INTO screensavers (title, type, file_url, duration, display_order, is_enabled)
         VALUES ($1, 'image', $2, $3, $4, $5)
         RETURNING id, type as "mediaType", file_url as "mediaUrl", is_enabled as "isActive", display_order as "displayOrder", duration, title`,
        [
          title || "Untitled Ad",
          mediaUrl,
          duration !== undefined ? parseInt(duration, 10) : 10,
          displayOrder !== undefined ? parseInt(displayOrder, 10) : 0,
          isActive !== undefined ? !!isActive : true
        ]
      );

      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error in createScreensaver:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Update screensaver details
   * PUT /api/screensavers/:id
   */
  async updateScreensaver(req, res) {
    try {
      const { id } = req.params;
      const { title, mediaUrl, duration, displayOrder, isActive } = req.body;

      const check = await pool.query("SELECT * FROM screensavers WHERE id = $1", [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Screensaver not found" });
      }

      const result = await pool.query(
        `UPDATE screensavers
         SET title = COALESCE($1, title),
             file_url = COALESCE($2, file_url),
             duration = COALESCE($3, duration),
             display_order = COALESCE($4, display_order),
             is_enabled = COALESCE($5, is_enabled)
         WHERE id = $6
         RETURNING id, type as "mediaType", file_url as "mediaUrl", is_enabled as "isActive", display_order as "displayOrder", duration, title`,
        [
          title,
          mediaUrl,
          duration !== undefined ? parseInt(duration, 10) : null,
          displayOrder !== undefined ? parseInt(displayOrder, 10) : null,
          isActive !== undefined ? !!isActive : null,
          id
        ]
      );

      return res.json(result.rows[0]);
    } catch (err) {
      console.error("Error in updateScreensaver:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Delete a screensaver
   * DELETE /api/screensavers/:id
   */
  async deleteScreensaver(req, res) {
    try {
      const { id } = req.params;
      const check = await pool.query("SELECT * FROM screensavers WHERE id = $1", [id]);
      
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Screensaver not found" });
      }

      const mediaUrl = check.rows[0].file_url;

      // Delete file from disk if it's local
      if (mediaUrl && !mediaUrl.startsWith("http") && !mediaUrl.startsWith("blob")) {
        const filepath = path.join(process.cwd(), "uploads", "screensavers", mediaUrl);
        try {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        } catch (e) {
          console.error("Failed to delete screensaver file:", e);
        }
      }

      await pool.query("DELETE FROM screensavers WHERE id = $1", [id]);
      return res.json({ success: true, message: "Screensaver deleted." });
    } catch (err) {
      console.error("Error in deleteScreensaver:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new ScreensaverController();
