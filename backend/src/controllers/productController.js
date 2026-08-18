// backend/src/controllers/productController.js
import productService from "../services/productService.js";

class ProductController {
  /**
   * Handle HTTP request to get products
   * @param {object} req - Express Request
   * @param {object} res - Express Response
   */
  async getProducts(req, res) {
    try {
      const { category, search } = req.query;

      // Basic input validation/safety
      if (category !== undefined && typeof category !== "string") {
        return res.status(400).json({ error: "Query parameter 'category' must be a string." });
      }
      if (search !== undefined && typeof search !== "string") {
        return res.status(400).json({ error: "Query parameter 'search' must be a string." });
      }

      // Business logic delegation
      const products = await productService.getProducts(category, search);

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

