// backend/src/controllers/productController.js
import productService from "../services/productService.js";
import { MAX_DISCOUNT_PERCENT } from "../services/promotionService.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** วันนี้ในรูปแบบ YYYY-MM-DD ตามเวลาเครื่อง เทียบกับค่าจาก <input type="date"> ได้ตรงๆ */
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * ตรวจส่วนลดที่ตั้งไว้ที่ตัวสินค้า รองรับทั้งลดเป็นเปอร์เซ็นต์และลดเป็นจำนวนเงิน
 * @param {object} body
 * @returns {string|null} ข้อความ error หรือ null ถ้าผ่าน
 */
function validatePromotionFields(body) {
  const { promotion, promotionType, promotionValue, promotionStartDate, promotionEndDate } = body;

  // ตรวจรูปแบบวันที่ก่อนเสมอ แม้สวิตช์โปรโมชั่นจะปิดอยู่ เพราะ repository เขียนคอลัมน์วันที่
  // ลง DB ทุกครั้ง วันที่ผิดรูปแบบจึงหลุดไปถึง Postgres แล้วกลายเป็น 500 กลางๆ
  const start = (promotionStartDate || "").trim();
  const end = (promotionEndDate || "").trim();
  if (start && !DATE_PATTERN.test(start)) return "รูปแบบวันเริ่มต้องเป็น YYYY-MM-DD";
  if (end && !DATE_PATTERN.test(end)) return "รูปแบบวันสิ้นสุดต้องเป็น YYYY-MM-DD";

  if (!promotion) return null;

  if (end && start && end < start) return "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";
  // เปิดโปรที่หมดอายุไปแล้วจะไม่มีผลอะไรเลย และหน้าจอจะดูเหมือนระบบพัง จึงต้องกันตั้งแต่ต้นทาง
  if (end && end < todayKey()) {
    return "วันสิ้นสุดโปรโมชั่นผ่านไปแล้ว เลือกวันใหม่ก่อนเปิดโปรโมชั่น";
  }

  const type = promotionType === "amount" ? "amount" : "percent";
  const value = Number(promotionValue);

  if (!Number.isFinite(value) || value <= 0) {
    return type === "amount"
      ? "ส่วนลดต้องมากกว่า 0 บาท"
      : "เปอร์เซ็นต์ส่วนลดต้องมากกว่า 0";
  }

  if (type === "percent") {
    if (value > MAX_DISCOUNT_PERCENT) {
      return `เปอร์เซ็นต์ส่วนลดของสินค้าต้องอยู่ระหว่าง 1 ถึง ${MAX_DISCOUNT_PERCENT}`;
    }
  } else {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return "ต้องระบุราคาสินค้าก่อนจึงจะตั้งส่วนลดเป็นจำนวนเงินได้";
    }
    if (value >= price) {
      return `ส่วนลดต้องน้อยกว่าราคาสินค้า (${price} บาท)`;
    }
  }

  return null;
}

class ProductController {
  /**
   * Handle HTTP request to get products
   * @param {object} req - Express Request
   * @param {object} res - Express Response
   */
  async getProducts(req, res) {
    try {
      const { category, search, pricing } = req.query;

      // Basic input validation/safety
      if (category !== undefined && typeof category !== "string") {
        return res.status(400).json({ error: "Query parameter 'category' must be a string." });
      }
      if (search !== undefined && typeof search !== "string") {
        return res.status(400).json({ error: "Query parameter 'search' must be a string." });
      }

      // pricing=original คืนราคาเต็มจาก DB ไม่หักส่วนลด
      // หน้าแอดมินต้องใช้ตัวนี้ เพราะฟอร์มแก้ไขสินค้าเขียนราคาที่โหลดมากลับลง DB
      const applyPromotion = pricing !== "original";

      // Business logic delegation
      const products = await productService.getProducts(category, search, applyPromotion);

      // Return success response
      return res.json(products);
    } catch (error) {
      console.error("Error in ProductController.getProducts:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle POST /api/products
   */
  async createProduct(req, res) {
    try {
      const invalid = validatePromotionFields(req.body);
      if (invalid) return res.status(400).json({ error: invalid });

      const product = await productService.createProduct(req.body);
      return res.status(201).json(product);
    } catch (error) {
      console.error("Error in ProductController.createProduct:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle PUT /api/products/:id
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const invalid = validatePromotionFields(req.body);
      if (invalid) return res.status(400).json({ error: invalid });

      const product = await productService.updateProduct(parseInt(id, 10), req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.json(product);
    } catch (error) {
      console.error("Error in ProductController.updateProduct:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle DELETE /api/products/:id
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const success = await productService.deleteProduct(parseInt(id, 10));
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error in ProductController.deleteProduct:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle POST /api/products/:id/view
   */
  async viewProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.incrementProductViews(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.json({ message: "Product view incremented successfully", product });
    } catch (error) {
      console.error("Error in ProductController.viewProduct:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle GET /api/products/bestsellers
   */
  async getBestSellers(req, res) {
    try {
      const products = await productService.getBestSellers();
      return res.json(products);
    } catch (error) {
      console.error("Error in ProductController.getBestSellers:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle product image upload (POST /api/products/upload)
   */
  async uploadProductImage(req, res) {
    try {
      if (req.files && req.files.length > 0) {
        const filenames = req.files.map(f => f.filename);
        const urls = filenames.map(fn => `/uploads/products/${fn}`);
        return res.status(201).json({
          success: true,
          image: filenames[0],
          images: filenames,
          url: urls[0],
          urls: urls
        });
      }
      if (!req.file) {
        return res.status(400).json({ error: "Please upload image file(s)." });
      }
      return res.status(201).json({
        success: true,
        image: req.file.filename,
        images: [req.file.filename],
        url: `/uploads/products/${req.file.filename}`,
        urls: [`/uploads/products/${req.file.filename}`]
      });
    } catch (error) {
      console.error("Error in ProductController.uploadProductImage:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
  /**
   * Handle GET /api/settings/search-tags
   */
  async getPopularSearchTags(req, res) {
    try {
      const tags = await productService.getPopularSearchTags();
      return res.json({ popularSearchTags: tags });
    } catch (error) {
      console.error("Error in ProductController.getPopularSearchTags:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle POST /api/settings/search-tags
   */
  async updatePopularSearchTags(req, res) {
    try {
      const { popularSearchTags } = req.body;
      if (!Array.isArray(popularSearchTags)) {
        return res.status(400).json({ error: "popularSearchTags must be an array of strings." });
      }
      const updated = await productService.updatePopularSearchTags(popularSearchTags);
      return res.json({ message: "Popular search tags updated successfully.", popularSearchTags: updated });
    } catch (error) {
      console.error("Error in ProductController.updatePopularSearchTags:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
}

export default new ProductController();

