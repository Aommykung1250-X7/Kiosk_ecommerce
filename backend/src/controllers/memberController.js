import pool from "../data/db.js";

class MemberController {
  /**
   * Get member profile by LINE User ID
   * GET /api/members/:lineUserId
   */
  async getMember(req, res) {
    try {
      const { lineUserId } = req.params;
      const result = await pool.query(
        "SELECT * FROM line_members WHERE line_user_id = $1",
        [lineUserId]
      );
      
      if (result.rows.length === 0) {
        return res.json(null);
      }
      
      const member = result.rows[0];
      // Map to camelCase
      return res.json({
        lineUserId: member.line_user_id,
        name: member.customer_name,
        phone: member.customer_phone,
        email: member.customer_email,
        address: member.customer_address
      });
    } catch (err) {
      console.error("Error in MemberController.getMember:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Create or update member profile
   * POST /api/members
   */
  async upsertMember(req, res) {
    try {
      const { lineUserId, name, phone, email, address } = req.body;
      
      if (!lineUserId) {
        return res.status(400).json({ error: "lineUserId is required." });
      }

      await pool.query(
        `INSERT INTO line_members (line_user_id, customer_name, customer_phone, customer_email, customer_address)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (line_user_id) DO UPDATE SET
           customer_name = EXCLUDED.customer_name,
           customer_phone = EXCLUDED.customer_phone,
           customer_email = EXCLUDED.customer_email,
           customer_address = EXCLUDED.customer_address`,
        [lineUserId, name, phone, email, address]
      );

      return res.json({ success: true, message: "Member profile saved." });
    } catch (err) {
      console.error("Error in MemberController.upsertMember:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new MemberController();
