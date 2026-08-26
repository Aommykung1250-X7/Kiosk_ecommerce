// backend/src/repositories/productRepository.js
import pool from "../data/db.js";
import { computePricing, toDateKey } from "../services/promotionService.js";

class ProductRepository {
  /**
   * Fetch products with optional category and search filters
   * @param {object} params
   * @param {string} [params.category]
   * @param {string} [params.search]
   * @returns {Promise<Array>}
   */
  /**
   * Helper to fetch all product images for product IDs
   */
  async fetchImagesForProducts(productIds) {
    if (!productIds || productIds.length === 0) return {};
    const res = await pool.query(
      `SELECT product_id, image_url, is_primary, display_order 
       FROM product_images 
       WHERE product_id = ANY($1) 
       ORDER BY is_primary DESC, display_order ASC, id ASC`,
      [productIds]
    );
    const imagesMap = {};
    res.rows.forEach(row => {
      if (!imagesMap[row.product_id]) {
        imagesMap[row.product_id] = [];
      }
      imagesMap[row.product_id].push(row.image_url);
    });
    return imagesMap;
  }

  /**
   * @param {object} params
   * @param {boolean} [params.applyPromotion=true] false = คืนราคาเต็มจาก DB (สำหรับหน้าแอดมินที่ต้องเขียนราคากลับ)
   */
  async getProducts({ category, search, applyPromotion = true } = {}) {
    try {
      let query = `
        SELECT p.* 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
      `;
      const whereConditions = [];
      const queryParams = [];

      if (category && category !== "all") {
        const catList = typeof category === "string"
          ? category.split(",").map(c => c.trim()).filter(Boolean)
          : (Array.isArray(category) ? category.map(c => String(c).trim()).filter(Boolean) : [String(category).trim()]);

        const hasPromo = catList.includes("promotion");
        const nonPromoCats = catList.filter(c => c !== "promotion" && c !== "hot" && c !== "all");

        if (nonPromoCats.length > 0) {
          queryParams.push(nonPromoCats);
          whereConditions.push(`p.category_id = ANY($${queryParams.length})`);
        }

        if (hasPromo) {
          whereConditions.push(`p.promotion = true`);
        }
      }

      if (search && search.trim() !== "") {
        queryParams.push(`%${search.trim()}%`);
        const paramIdx = queryParams.length;
        whereConditions.push(
          `(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR p.category_id ILIKE $${paramIdx} OR c.name ILIKE $${paramIdx})`
        );
      }

      if (whereConditions.length > 0) {
        query += " WHERE " + whereConditions.join(" AND ");
      }

      // เรียงให้ตรงกับ comparator ฝั่งหน้าบ้าน (Home.jsx): ของหมดลงล่าง -> โปรโมชั่น ->
      // ขายดี -> ยอดเข้าชม -> id  โดยชั้น "ขายดี" ใช้ sold_count ซึ่งเป็นเกณฑ์เดียวกับป้าย HOT NOW
      query += ` ORDER BY
        CASE WHEN (p.status = 'In Stock' AND p.stock <= 0) THEN 1 ELSE 0 END ASC,
        CASE WHEN (p.promotion = true) THEN 0 ELSE 1 END ASC,
        p.sold_count DESC,
        p.views DESC,
        p.id ASC`;

      const res = await pool.query(query, queryParams);
      const productIds = res.rows.map(r => r.id);
      const imagesMap = await this.fetchImagesForProducts(productIds);

      return res.rows.map(row => {
        const dbImages = imagesMap[row.id] || [];
        const fallbackImage = dbImages.length > 0 ? dbImages[0] : row.image;
        const imagesList = dbImages.length > 0 ? dbImages : (row.image ? [row.image] : []);

        // Auto-check Pre-Order release date
        let computedStatus = row.status;
        if (computedStatus === "Pre-Order" && row.preorder_release_date) {
          const releaseDate = new Date(row.preorder_release_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          releaseDate.setHours(0, 0, 0, 0);
          if (releaseDate <= today) {
            computedStatus = "In Stock";
            // Persist status update to DB in background
            pool.query("UPDATE products SET status = 'In Stock' WHERE id = $1", [row.id]).catch(err => {
              console.error(`Error auto-updating status for product ${row.id}:`, err);
            });
          }
        }

        return {
          ...row,
          status: computedStatus,
          category: row.category_id,
          image: fallbackImage,
          images: imagesList.slice(0, 5),
          ...computePricing(parseFloat(row.price), row, applyPromotion),
          // ค่าที่แอดมินตั้งไว้ที่ตัวสินค้า (discountType/discountValue ด้านบนคือส่วนลดที่มีผลจริง)
          promotionType: row.discount_type === "amount" ? "amount" : "percent",
          promotionValue: parseFloat(row.discount_value) || 0,
          promotionStartDate: toDateKey(row.discount_start_date),
          promotionEndDate: toDateKey(row.discount_end_date),
          quantity: row.stock,
          pickupLocation: row.pickup_location,
          preorderReleaseDate: row.preorder_release_date,
          purchaseLimit: row.purchase_limit,
          soldCount: parseInt(row.sold_count, 10) || 0,
          soldRevenue: parseFloat(row.sold_revenue) || 0,
          additional_info: row.additional_info,
          additionalInfo: row.additional_info
        };
      });
    } catch (error) {
      console.error("Error in ProductRepository.getProducts:", error);
      throw error;
    }
  }

  /**
   * Fetch all products from the PostgreSQL database
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    return this.getProducts({ category: "all", ...options });
  }

  /**
   * Fetch products filtered by category
   * @param {string} category 
   * @returns {Promise<Array>}
   */
  async getByCategory(category) {
    return this.getProducts({ category });
  }

  /**
   * Fetch products on promotion
   * @returns {Promise<Array>}
   */
  async getPromotions() {
    return this.getProducts({ category: "promotion" });
  }

  /**
   * Create a new product in DB
   * @param {object} p - Product details
   */
  async create(p) {
    const rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images.slice(0, 5) : (p.image ? [p.image] : []);
    const primaryImg = rawImages.length > 0 ? rawImages[0] : (p.image || null);

    const query = `
      INSERT INTO products (name, description, price, stock, category_id, image, promotion, pickup_location, status, preorder_release_date, purchase_limit, additional_info, discount_type, discount_value, discount_start_date, discount_end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const values = [p.name, p.description, p.price, p.stock || 0, p.category || p.categoryId, primaryImg, p.promotion || false, p.pickupLocation || null, p.status || 'In Stock', p.preorderReleaseDate || null, p.purchaseLimit || null, p.additional_info || p.additionalInfo || null, p.promotionType === 'amount' ? 'amount' : 'percent', p.promotionValue || 0, p.promotionStartDate || null, p.promotionEndDate || null];
    try {
      const res = await pool.query(query, values);
      const newProduct = res.rows[0];

      // Save up to 5 images into product_images
      if (rawImages.length > 0) {
        await pool.query("DELETE FROM product_images WHERE product_id = $1", [newProduct.id]);
        for (let i = 0; i < rawImages.length; i++) {
          const imgUrl = rawImages[i];
          if (imgUrl && imgUrl.trim() !== '') {
            await pool.query(
              `INSERT INTO product_images (product_id, image_url, display_order, is_primary)
               VALUES ($1, $2, $3, $4)`,
              [newProduct.id, imgUrl.trim(), i, i === 0]
            );
          }
        }
      }

      return {
        ...newProduct,
        image: primaryImg,
        images: rawImages
      };
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
    const rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images.slice(0, 5) : (p.image ? [p.image] : []);
    const primaryImg = rawImages.length > 0 ? rawImages[0] : (p.image || null);

    const query = `
      UPDATE products 
      SET name = $1, description = $2, price = $3, stock = $4, category_id = $5, image = COALESCE($6, image), promotion = $7, pickup_location = $8, status = $9, preorder_release_date = $10, purchase_limit = $11, additional_info = $12, discount_type = $13, discount_value = $14, discount_start_date = $15, discount_end_date = $16
      WHERE id = $17
      RETURNING *
    `;
    const values = [p.name, p.description, p.price, p.stock, p.category || p.categoryId, primaryImg, p.promotion, p.pickupLocation, p.status, p.preorderReleaseDate || null, p.purchaseLimit || null, p.additional_info || p.additionalInfo || null, p.promotionType === 'amount' ? 'amount' : 'percent', p.promotionValue || 0, p.promotionStartDate || null, p.promotionEndDate || null, id];
    try {
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;
      const updatedProduct = res.rows[0];

      if (Array.isArray(p.images)) {
        await pool.query("DELETE FROM product_images WHERE product_id = $1", [id]);
        for (let i = 0; i < rawImages.length; i++) {
          const imgUrl = rawImages[i];
          if (imgUrl && imgUrl.trim() !== '') {
            await pool.query(
              `INSERT INTO product_images (product_id, image_url, display_order, is_primary)
               VALUES ($1, $2, $3, $4)`,
              [id, imgUrl.trim(), i, i === 0]
            );
          }
        }
      }

      return {
        ...updatedProduct,
        image: primaryImg || updatedProduct.image,
        images: rawImages.length > 0 ? rawImages : [updatedProduct.image]
      };
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
   * บันทึกยอดขายสะสมของสินค้าหลังออเดอร์จ่ายเงินสำเร็จ
   * อัปเดตทั้งสองคอลัมน์ใน query เดียว จำนวนชิ้นกับยอดเงินจะได้ไม่หลุดจากกัน
   * @param {number|string} productId
   * @param {number} quantity จำนวนชิ้นที่ขายได้
   * @param {number} revenue ยอดเงินของรายการนี้ (ราคาต่อชิ้นที่ขายจริง x จำนวน)
   */
  async recordSale(productId, quantity, revenue) {
    const query = `
      UPDATE products
      SET sold_count = sold_count + $1,
          sold_revenue = sold_revenue + $2
      WHERE id = $3
    `;
    try {
      await pool.query(query, [quantity, revenue, parseInt(productId, 10)]);
    } catch (error) {
      console.error(`Error recording sale for product ${productId}:`, error);
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

  /**
   * Fetch products ordered by best selling (total quantity in paid orders)
   * @returns {Promise<Array>}
   */
  async getBestSellers() {
    try {
      // อ่านจากคอลัมน์ sold_count ที่นับสะสมไว้ตอนจ่ายเงินสำเร็จ
      // (เดิมคำนวณสดด้วย subquery แล้ว alias ทับชื่อคอลัมน์จริงจนได้คอลัมน์ชื่อซ้ำ)
      const query = `
        SELECT p.*
        FROM products p
        ORDER BY p.sold_count DESC, p.sold_revenue DESC, p.views DESC, p.id ASC
      `;
      const res = await pool.query(query);
      return res.rows.map(row => ({
        ...row,
        ...computePricing(parseFloat(row.price), row),
        // ค่าที่แอดมินตั้งไว้ที่ตัวสินค้า (discountType/discountValue ด้านบนคือส่วนลดที่มีผลจริง)
        promotionType: row.discount_type === "amount" ? "amount" : "percent",
        promotionValue: parseFloat(row.discount_value) || 0,
        promotionStartDate: toDateKey(row.discount_start_date),
        promotionEndDate: toDateKey(row.discount_end_date),
        quantity: row.stock,
        pickupLocation: row.pickup_location,
        preorderReleaseDate: row.preorder_release_date,
        purchaseLimit: row.purchase_limit,
        soldCount: parseInt(row.sold_count, 10) || 0,
        soldRevenue: parseFloat(row.sold_revenue) || 0
      }));
    } catch (error) {
      console.error("Error in ProductRepository.getBestSellers:", error);
      throw error;
    }
  }

  /**
   * Fetch a single product by ID
   * @param {number|string} id 
   * @returns {Promise<object|null>}
   */
  async getById(id) {
    try {
      const res = await pool.query("SELECT * FROM products WHERE id = $1", [parseInt(id, 10)]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        ...row,
        ...computePricing(parseFloat(row.price), row),
        // ค่าที่แอดมินตั้งไว้ที่ตัวสินค้า (discountType/discountValue ด้านบนคือส่วนลดที่มีผลจริง)
        promotionType: row.discount_type === "amount" ? "amount" : "percent",
        promotionValue: parseFloat(row.discount_value) || 0,
        promotionStartDate: toDateKey(row.discount_start_date),
        promotionEndDate: toDateKey(row.discount_end_date),
        quantity: row.stock,
        pickupLocation: row.pickup_location,
        preorderReleaseDate: row.preorder_release_date,
        purchaseLimit: row.purchase_limit,
        soldCount: parseInt(row.sold_count, 10) || 0,
        soldRevenue: parseFloat(row.sold_revenue) || 0
      };
    } catch (error) {
      console.error("Error in ProductRepository.getById:", error);
      throw error;
    }
  }
  /**
   * Fetch popular search tags from system_settings
   * @returns {Promise<Array<string>>}
   */
  async getPopularSearchTags() {
    try {
      const res = await pool.query("SELECT value FROM system_settings WHERE key = 'popular_search_tags'");
      if (res.rows.length > 0 && res.rows[0].value) {
        return JSON.parse(res.rows[0].value);
      }
      return ["น้ำดื่ม", "ชาเขียว", "เลย์", "KitKat", "แก้วน้ำ", "เสื้อ"];
    } catch (error) {
      console.error("Error in ProductRepository.getPopularSearchTags:", error);
      return ["น้ำดื่ม", "ชาเขียว", "เลย์", "KitKat", "แก้วน้ำ", "เสื้อ"];
    }
  }

  /**
   * Update popular search tags in system_settings
   * @param {Array<string>} tags 
   */
  async updatePopularSearchTags(tags) {
    try {
      const tagsJson = JSON.stringify(tags);
      await pool.query(
        "INSERT INTO system_settings (key, value) VALUES ('popular_search_tags', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
        [tagsJson]
      );
      return tags;
    } catch (error) {
      console.error("Error in ProductRepository.updatePopularSearchTags:", error);
      throw error;
    }
  }
}

export default new ProductRepository();

