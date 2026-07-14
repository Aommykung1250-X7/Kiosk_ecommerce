// backend/src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../data/db.js";
import { getJwtSecret } from "../config/security.js";

const JWT_SECRET = getJwtSecret();

class AuthController {
  /**
   * Handle user login (POST /api/auth/login)
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
      }

      // ค้นหาผู้ใช้จากตาราง users
      const query = "SELECT * FROM users WHERE username = $1";
      const result = await pool.query(query, [username]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      const user = result.rows[0];

      // เปรียบเทียบรหัสผ่านด้วย bcrypt
      const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordMatch) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      // ลงนาม JWT Token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          name: user.name 
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name
        }
      });
    } catch (error) {
      console.error("Error in AuthController.login:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Get current authenticated user details (GET /api/auth/me)
   */
  async getMe(req, res) {
    try {
      // ข้อมูลผู้ใช้จะอยู่ใน req.user ที่ได้จาก authenticateJWT middleware
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      return res.json({ user: req.user });
    } catch (error) {
      console.error("Error in AuthController.getMe:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Register a new user/staff (POST /api/auth/users) - Admin Only
   */
  async registerUser(req, res) {
    try {
      const { username, password, role, name } = req.body;

      if (!username || !password || !role || !name) {
        return res.status(400).json({ error: "All fields are required (username, password, role, name)." });
      }

      if (role !== "admin" && role !== "staff") {
        return res.status(400).json({ error: "Invalid role. Allowed roles are 'admin' or 'staff'." });
      }

      // ตรวจสอบชื่อผู้ใช้งานซ้ำ
      const checkQuery = "SELECT id FROM users WHERE username = $1";
      const checkRes = await pool.query(checkQuery, [username]);
      if (checkRes.rows.length > 0) {
        return res.status(400).json({ error: "Username is already taken." });
      }

      // แฮชรหัสผ่านด้วย bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      // บันทึกลงฐานข้อมูล
      const insertQuery = `
        INSERT INTO users (username, password_hash, role, name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, role, name, created_at AS "createdAt"
      `;
      const insertRes = await pool.query(insertQuery, [username, passwordHash, role, name]);

      return res.status(201).json(insertRes.rows[0]);
    } catch (error) {
      console.error("Error in AuthController.registerUser:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Get all registered users/staff (GET /api/auth/users) - Admin Only
   */
  async getUsers(req, res) {
    try {
      const query = `
        SELECT id, username, role, name, created_at AS "createdAt"
        FROM users 
        ORDER BY id ASC
      `;
      const result = await pool.query(query);
      return res.json(result.rows);
    } catch (error) {
      console.error("Error in AuthController.getUsers:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Delete a user/staff (DELETE /api/auth/users/:id) - Admin Only
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // ห้ามลบตัวเอง
      if (req.user.id === parseInt(id, 10)) {
        return res.status(400).json({ error: "You cannot delete your own account." });
      }

      const query = "DELETE FROM users WHERE id = $1";
      const result = await pool.query(query, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "User not found." });
      }

      return res.json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Error in AuthController.deleteUser:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
}

export default new AuthController();
