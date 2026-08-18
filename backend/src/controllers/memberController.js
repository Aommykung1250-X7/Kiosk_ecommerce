import pool from "../data/db.js";

class MemberController {
  /**
   * Helper to fetch addresses formatted for API response
   */
  async _getAddressesForCustomer(customerId) {
    const addrRes = await pool.query(
      `SELECT id, recipient_name AS name, phone, address_line AS address, 
              subdistrict, district, province, postal_code AS zipcode, 
              is_default AS "isDefault" 
       FROM customer_addresses 
       WHERE customer_id = $1 
       ORDER BY is_default DESC, id ASC`,
      [customerId]
    );
    return addrRes.rows.map(row => ({
      id: row.id,
      name: row.name || "",
      phone: row.phone || "",
      address: row.address || "",
      subdistrict: row.subdistrict || "",
      district: row.district || "",
      province: row.province || "",
      zipcode: row.zipcode || "",
      isDefault: Boolean(row.isDefault)
    }));
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
        "SELECT * FROM customer_profiles WHERE LOWER(customer_email) = LOWER($1) ORDER BY id DESC LIMIT 1",
        [cleanEmail]
      );
      
      if (result.rows.length === 0) {
        return res.json(null);
      }
      
      const member = result.rows[0];
      const addressesList = await this._getAddressesForCustomer(member.id);
      const defaultAddr = addressesList.find(a => a.isDefault) || addressesList[0];

      return res.json({
        id: member.id,
        name: defaultAddr ? defaultAddr.name : "",
        phone: defaultAddr ? defaultAddr.phone : "",
        email: member.customer_email,
        address: defaultAddr ? defaultAddr.address : "",
        addresses: addressesList
      });
    } catch (err) {
      console.error("Error in MemberController.getMemberByEmail:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Create or update member profile & addresses (max 3 addresses)
   * POST /api/members
   */
  async upsertMember(req, res) {
    try {
      const { name, phone, email, address, addresses } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }

      const cleanEmail = email.trim();

      // Check if profile exists by email in customer_profiles
      const profileRes = await pool.query(
        "SELECT * FROM customer_profiles WHERE LOWER(customer_email) = LOWER($1)",
        [cleanEmail]
      );

      let customerId;

      if (profileRes && profileRes.rows.length > 0) {
        const existingProfile = profileRes.rows[0];
        customerId = existingProfile.id;

        await pool.query(
          `UPDATE customer_profiles SET
             customer_email = $1,
             updated_at = NOW()
           WHERE id = $2`,
          [cleanEmail, customerId]
        );
      } else {
        const insertRes = await pool.query(
          `INSERT INTO customer_profiles (customer_email)
           VALUES ($1) RETURNING id`,
          [cleanEmail]
        );
        customerId = insertRes.rows[0].id;
      }

      // Handle addresses array if explicitly passed
      if (Array.isArray(addresses)) {
        const sliced = addresses.slice(0, 3);
        // Replace current addresses in customer_addresses
        await pool.query("DELETE FROM customer_addresses WHERE customer_id = $1", [customerId]);
        for (let i = 0; i < sliced.length; i++) {
          const item = sliced[i];
          if (item && item.address && item.address.trim() !== "") {
            await pool.query(
              `INSERT INTO customer_addresses (customer_id, recipient_name, phone, address_line, subdistrict, district, province, postal_code, is_default)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                customerId,
                item.name || name || "",
                item.phone || phone || "",
                item.address.trim(),
                item.subdistrict || null,
                item.district || null,
                item.province || null,
                item.zipcode || item.postal_code || null,
                Boolean(item.isDefault !== undefined ? item.isDefault : (i === 0))
              ]
            );
          }
        }
      } else if (address && address.trim() !== "") {
        const { subdistrict: sub, district: dist, province: prov, zipcode: zip } = req.body;
        // Handle single address upsert logic
        const existingAddrsRes = await pool.query(
          "SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY id ASC",
          [customerId]
        );
        const existingAddrs = existingAddrsRes.rows;
        const match = existingAddrs.find(a => a.address_line === address.trim());

        if (match) {
          await pool.query(
            `UPDATE customer_addresses 
             SET recipient_name = COALESCE($1, recipient_name), 
                 phone = COALESCE($2, phone), 
                 subdistrict = COALESCE($3, subdistrict),
                 district = COALESCE($4, district),
                 province = COALESCE($5, province),
                 postal_code = COALESCE($6, postal_code),
                 updated_at = NOW() 
             WHERE id = $7`,
            [name, phone, sub || null, dist || null, prov || null, zip || null, match.id]
          );
        } else if (existingAddrs.length < 3) {
          const isFirst = existingAddrs.length === 0;
          await pool.query(
            `INSERT INTO customer_addresses (customer_id, recipient_name, phone, address_line, subdistrict, district, province, postal_code, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [customerId, name || "", phone || "", address.trim(), sub || null, dist || null, prov || null, zip || null, isFirst]
          );
        }
      }

      const currentAddresses = await this._getAddressesForCustomer(customerId);
      return res.json({ success: true, message: "Member profile saved.", addresses: currentAddresses });
    } catch (err) {
      console.error("Error in MemberController.upsertMember:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Delete an address from profile
   * DELETE /api/members/address
   */
  async deleteAddress(req, res) {
    try {
      const { email, addressId } = req.body;
      if (!email || !addressId) {
        return res.status(400).json({ error: "Missing email or addressId" });
      }

      const cleanEmail = email.trim();

      const resProfile = await pool.query(
        "SELECT * FROM customer_profiles WHERE LOWER(customer_email) = LOWER($1)",
        [cleanEmail]
      );
      if (resProfile.rows.length === 0) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const profile = resProfile.rows[0];

      // Delete from customer_addresses
      await pool.query(
        "DELETE FROM customer_addresses WHERE customer_id = $1 AND id = $2",
        [profile.id, addressId]
      );

      const currentAddresses = await this._getAddressesForCustomer(profile.id);
      return res.json({ success: true, addresses: currentAddresses });
    } catch (err) {
      console.error("Error in MemberController.deleteAddress:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new MemberController();
