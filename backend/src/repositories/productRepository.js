// backend/src/repositories/productRepository.js
import { products } from "../data/mockData.js";

class ProductRepository {
  /**
   * Fetch all products from the mock database
   * @returns {Promise<Array>}
   */
  async getAll() {
    // Return a copy to mimic database retrieval and prevent accidental mutability
    return [...products];
  }

  /**
   * Fetch products filtered by category
   * @param {string} category 
   * @returns {Promise<Array>}
   */
  async getByCategory(category) {
    const list = [...products];
    return list.filter(p => p.category === category);
  }

  /**
   * Fetch products on promotion
   * @returns {Promise<Array>}
   */
  async getPromotions() {
    const list = [...products];
    return list.filter(p => p.promotion === true);
  }
}

export default new ProductRepository();
