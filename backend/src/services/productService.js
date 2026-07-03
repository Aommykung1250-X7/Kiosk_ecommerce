// backend/src/services/productService.js
import productRepository from "../repositories/productRepository.js";

class ProductService {
  /**
   * Process product requests based on business rules
   * @param {string} [category]
   * @returns {Promise<Array>}
   */
  async getProducts(category) {
    // If no category specified or "all", return everything
    if (!category || category === "all") {
      return await productRepository.getAll();
    }

    // Special category filter for promotion products
    if (category === "promotion") {
      return await productRepository.getPromotions();
    }

    // Otherwise, filter by the specific category
    return await productRepository.getByCategory(category);
  }
}

export default new ProductService();
