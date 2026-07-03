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
}

export default new ProductController();
