import pool from "../data/db.js";

class SettingController {
  /**
   * GET /api/settings/contact
   * Fetch staff contact settings
   */
  async getContactSettings(req, res) {
    try {
      const keys = [
        "contact_hotline",
        "contact_line_id",
        "contact_line_url",
        "contact_line_qr_image",
        "contact_service_hours"
      ];
      
      const result = await pool.query(
        "SELECT key, value FROM system_settings WHERE key = ANY($1)",
        [keys]
      );

      const settingsMap = {};
      result.rows.forEach(row => {
        settingsMap[row.key] = row.value;
      });

      return res.json({
        hotline: settingsMap["contact_hotline"] ?? "02-123-4567 / 081-234-5678",
        lineId: settingsMap["contact_line_id"] ?? "@ditcsupport",
        lineUrl: settingsMap["contact_line_url"] ?? "https://line.me/ti/p/@ditcsupport",
        lineQrImage: settingsMap["contact_line_qr_image"] ?? "",
        serviceHours: settingsMap["contact_service_hours"] ?? "เปิดบริการ 08:00 - 20:00 น."
      });
    } catch (error) {
      console.error("Error in getContactSettings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * POST /api/settings/contact
   * Update staff contact settings (Admin only)
   */
  async updateContactSettings(req, res) {
    try {
      const { hotline, lineId, lineUrl, lineQrImage, serviceHours } = req.body;

      const updates = [
        ["contact_hotline", hotline ?? "02-123-4567 / 081-234-5678"],
        ["contact_line_id", lineId ?? "@ditcsupport"],
        ["contact_line_url", lineUrl ?? "https://line.me/ti/p/@ditcsupport"],
        ["contact_line_qr_image", lineQrImage ?? ""],
        ["contact_service_hours", serviceHours ?? "เปิดบริการ 08:00 - 20:00 น."]
      ];

      for (const [key, value] of updates) {
        await pool.query(
          "INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          [key, value.toString()]
        );
      }

      return res.json({ success: true, message: "Contact settings updated successfully." });
    } catch (error) {
      console.error("Error in updateContactSettings:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * POST /api/settings/contact/upload-qr
   * Handle LINE QR code image upload
   */
  async uploadContactQr(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Please upload an image file." });
      }

      const imageUrl = `/uploads/contact/${req.file.filename}`;
      return res.json({
        success: true,
        url: imageUrl
      });
    } catch (error) {
      console.error("Error in uploadContactQr:", error);
      return res.status(500).json({ error: "Failed to upload image." });
    }
  }
  /**
   * POST /api/settings/reset-visitors
   * Reset kiosk visitor / wakeup session count to 0 (Admin only - Temporary)
   */
  async resetVisitorCount(req, res) {
    try {
      await pool.query(
        "INSERT INTO kiosk_stats (key, value) VALUES ('session_wakeups', 0) ON CONFLICT (key) DO UPDATE SET value = 0"
      );
      return res.json({ success: true, message: "Visitor count reset to 0 successfully." });
    } catch (error) {
      console.error("Error in resetVisitorCount:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * POST /api/settings/reset-product-views
   * Reset views count for all products to 0 (Admin only - Temporary)
   */
  async resetProductViews(req, res) {
    try {
      await pool.query("UPDATE products SET views = 0");
      return res.json({ success: true, message: "Product views reset to 0 successfully." });
    } catch (error) {
      console.error("Error in resetProductViews:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new SettingController();
