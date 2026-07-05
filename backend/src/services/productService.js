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

  /**
   * Create a new product
   * @param {object} productData 
   */
  async createProduct(productData) {
    return await productRepository.create(productData);
  }

  /**
   * Update a product by ID
   * @param {number} id 
   * @param {object} productData 
   */
  async updateProduct(id, productData) {
    return await productRepository.update(id, productData);
  }

  /**
   * Delete a product by ID
   * @param {number} id 
   */
  async deleteProduct(id) {
    return await productRepository.delete(id);
  }
}

export default new ProductService();
