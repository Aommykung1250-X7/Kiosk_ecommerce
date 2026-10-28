import pool from "../data/db.js";
import fs from "fs";
import path from "path";
import productService from "../services/productService.js";

const FEATURED_SLOTS = 4;
const DEFAULT_MAIN_IMAGE = "main_screen.jpeg";

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

  /**
   * Get Screensaver Config (Master Screen settings & Featured Products)
   * GET /api/screensavers/config
   */
  async getScreensaverConfig(req, res) {
    try {
      const enabledRes = await pool.query("SELECT value FROM system_settings WHERE key = 'screensaver_master_enabled'");
      const durationRes = await pool.query("SELECT value FROM system_settings WHERE key = 'screensaver_master_duration'");
      const productsRes = await pool.query("SELECT value FROM system_settings WHERE key = 'screensaver_featured_products'");
      const mainImageRes = await pool.query("SELECT value FROM system_settings WHERE key = 'screensaver_main_image'");

      const masterEnabled = enabledRes.rows.length > 0 ? enabledRes.rows[0].value === 'true' : true;
      const masterDuration = durationRes.rows.length > 0 ? parseInt(durationRes.rows[0].value, 10) || 10 : 10;
      const mainImage = (mainImageRes.rows[0]?.value || "").trim() || DEFAULT_MAIN_IMAGE;
      let featuredProductIds = [];
      if (productsRes.rows.length > 0 && productsRes.rows[0].value) {
        try {
          featuredProductIds = JSON.parse(productsRes.rows[0].value);
        } catch {
          featuredProductIds = [];
        }
      }
      if (!Array.isArray(featuredProductIds)) featuredProductIds = [];

      // ดึงสินค้าทั้งหมดที่เรียงตามยอดขายมาแล้วครั้งเดียว ใช้เป็นทั้งแหล่งของสินค้าที่แอดมิน
      // เลือกไว้และสินค้าขายดีที่เอามาเติมช่องว่าง เพื่อให้ราคา (ที่คิดส่วนลดแล้ว) สอดคล้องกัน
      const ranked = await productService.getBestSellers();
      const shape = (p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category_id ?? p.category ?? null
      });

      const byId = new Map(ranked.map(p => [Number(p.id), p]));
      // เรียงตามลำดับที่แอดมินเลือก ตัด id ซ้ำและสินค้าที่ถูกลบไปแล้วออก
      const featuredProducts = [...new Set(featuredProductIds.map(Number))]
        .map(id => byId.get(id))
        .filter(Boolean)
        .map(shape);

      // เติมช่องที่เหลือด้วยสินค้าขายดีที่ยังไม่ถูกเลือก ให้ครบ 4 ช่องเสมอ
      const pickedIds = new Set(featuredProducts.map(p => Number(p.id)));
      const autoFilled = ranked
        .filter(p => !pickedIds.has(Number(p.id)))
        .slice(0, Math.max(0, FEATURED_SLOTS - featuredProducts.length))
        .map(shape);

      return res.json({
        masterEnabled,
        masterDuration,
        mainImage,
        featuredProductIds,
        featuredProducts,
        displayProducts: [...featuredProducts, ...autoFilled]
      });
    } catch (err) {
      console.error("Error in getScreensaverConfig:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Update Screensaver Config
   * PUT /api/screensavers/config
   */
  async updateScreensaverConfig(req, res) {
    try {
      const { masterEnabled, masterDuration, featuredProductIds, mainImage } = req.body;

      if (masterEnabled !== undefined) {
        await pool.query(
          "INSERT INTO system_settings (key, value) VALUES ('screensaver_master_enabled', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
          [masterEnabled ? 'true' : 'false']
        );
      }

      if (masterDuration !== undefined) {
        await pool.query(
          "INSERT INTO system_settings (key, value) VALUES ('screensaver_master_duration', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
          [parseInt(masterDuration, 10).toString()]
        );
      }

      if (featuredProductIds !== undefined && Array.isArray(featuredProductIds)) {
        await pool.query(
          "INSERT INTO system_settings (key, value) VALUES ('screensaver_featured_products', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
          [JSON.stringify(featuredProductIds)]
        );
      }

      // ส่งค่าว่างมา = รีเซ็ตกลับไปใช้รูป default
      if (mainImage !== undefined) {
        await pool.query(
          "INSERT INTO system_settings (key, value) VALUES ('screensaver_main_image', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
          [String(mainImage || "").trim()]
        );
      }

      return res.json({ success: true, message: "Screensaver settings updated successfully." });
    } catch (err) {
      console.error("Error in updateScreensaverConfig:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new ScreensaverController();
