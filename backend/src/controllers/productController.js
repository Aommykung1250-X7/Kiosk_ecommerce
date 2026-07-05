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
      const { category } = req.query;

      // Basic input validation/safety
      if (category !== undefined && typeof category !== "string") {
        return res.status(400).json({ error: "Query parameter 'category' must be a string." });
      }

      // Business logic delegation
      const products = await productService.getProducts(category);

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
}

export default new ProductController();
