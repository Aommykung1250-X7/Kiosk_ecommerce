import pool from "../data/db.js";

class MemberController {
  /**
   * Get member profile by LINE User ID
   * GET /api/members/:lineUserId
   */
  async getMember(req, res) {
    try {
      const { lineUserId } = req.params;
      if (!lineUserId) return res.json(null);

      const result = await pool.query(
        "SELECT * FROM customer_profiles WHERE line_user_id = $1",
        [lineUserId]
      );

      if (result.rows.length === 0) {
        return res.json(null);
      }
      
      const member = result.rows[0];
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
   * Get member profile by Email address
   * GET /api/members/email/:email
   */
  async getMemberByEmail(req, res) {
    try {
      const { email } = req.params;
      if (!email) return res.json(null);

      const cleanEmail = email.trim();

      const result = await pool.query(
        "SELECT * FROM customer_profiles WHERE LOWER(customer_email) = LOWER($1) AND customer_address IS NOT NULL AND customer_address != '' ORDER BY id DESC LIMIT 1",
        [cleanEmail]
      );
      
      if (result.rows.length === 0) {
        return res.json(null);
      }
      
      const member = result.rows[0];
      return res.json({
        lineUserId: member.line_user_id,
        name: member.customer_name,
        phone: member.customer_phone,
        email: member.customer_email,
        address: member.customer_address
      });
    } catch (err) {
      console.error("Error in MemberController.getMemberByEmail:", err);
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
      
      if (!lineUserId && !email) {
        return res.status(400).json({ error: "lineUserId or email is required." });
      }

      const cleanEmail = email ? email.trim() : null;

      // Check if profile exists by lineUserId or email in customer_profiles
      let profileRes = null;
      if (lineUserId && cleanEmail) {
        profileRes = await pool.query(
          "SELECT id FROM customer_profiles WHERE line_user_id = $1 OR LOWER(customer_email) = LOWER($2)",
          [lineUserId, cleanEmail]
        );
      } else if (lineUserId) {
        profileRes = await pool.query(
          "SELECT id FROM customer_profiles WHERE line_user_id = $1",
          [lineUserId]
        );
      } else if (cleanEmail) {
        profileRes = await pool.query(
          "SELECT id FROM customer_profiles WHERE LOWER(customer_email) = LOWER($1)",
          [cleanEmail]
        );
      }

      if (profileRes && profileRes.rows.length > 0) {
        const profileId = profileRes.rows[0].id;
        await pool.query(
          `UPDATE customer_profiles SET
             line_user_id = COALESCE($1, line_user_id),
             customer_email = COALESCE($2, customer_email),
             customer_name = $3,
             customer_phone = $4,
             customer_address = $5,
             updated_at = NOW()
           WHERE id = $6`,
          [lineUserId || null, cleanEmail, name, phone, address, profileId]
        );
      } else {
        await pool.query(
          `INSERT INTO customer_profiles (line_user_id, customer_email, customer_name, customer_phone, customer_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [lineUserId || null, cleanEmail, name, phone, address]
        );
      }

      return res.json({ success: true, message: "Member profile saved." });
    } catch (err) {
      console.error("Error in MemberController.upsertMember:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new MemberController();
