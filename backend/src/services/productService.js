// backend/src/services/productService.js
import fs from "fs";
import path from "path";
import productRepository from "../repositories/productRepository.js";

const defaultIllustrations = ["water", "cola", "chips", "wafer", "noodle", "milo", "pen", "notebook"];

const deleteProductImageFile = (imageFilename) => {
  if (!imageFilename) return;
  if (defaultIllustrations.includes(imageFilename)) return;

  const filepath = path.join(process.cwd(), "uploads", "products", imageFilename);
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`[ProductService] Deleted custom image file: ${filepath}`);
    }
  } catch (error) {
    console.error(`[ProductService] Error deleting file: ${filepath}`, error);
  }
};

class ProductService {
  /**
   * Process product requests based on business rules
   * @param {string} [category]
   * @param {string} [search]
   * @returns {Promise<Array>}
   */
  async getProducts(category, search, applyPromotion = true) {
    return await productRepository.getProducts({ category, search, applyPromotion });
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
    try {
      const oldProduct = await productRepository.getById(id);
      if (oldProduct && oldProduct.image !== productData.image) {
        deleteProductImageFile(oldProduct.image);
      }
    } catch (err) {
      console.error("[ProductService] Failed to check and delete old product image file:", err);
    }
    return await productRepository.update(id, productData);
  }

  /**
   * Delete a product by ID
   * @param {number} id
   */
  async deleteProduct(id) {
    try {
      const product = await productRepository.getById(id);
      if (product) {
        deleteProductImageFile(product.image);
      }
    } catch (err) {
      console.error("[ProductService] Failed to clean up product image on delete:", err);
    }
    return await productRepository.delete(id);
  }

  /**
   * Increment view count of a product by 1
   * @param {number|string} productId
   */
  async incrementProductViews(productId) {
    return await productRepository.incrementViews(productId);
  }

  /**
   * Get best selling products ordered by quantity sold
   * @returns {Promise<Array>}
   */
  async getBestSellers() {
    return await productRepository.getBestSellers();
  }

  /**
   * Fetch popular search tags
   * @returns {Promise<Array<string>>}
   */
  async getPopularSearchTags() {
    return await productRepository.getPopularSearchTags();
  }

  /**
   * Update popular search tags
   * @param {Array<string>} tags 
   */
  async updatePopularSearchTags(tags) {
    if (!Array.isArray(tags)) {
      throw new Error("Tags must be an array of strings.");
    }
    const cleanTags = tags.map(t => String(t).trim()).filter(t => t.length > 0);
    return await productRepository.updatePopularSearchTags(cleanTags);
  }
}

export default new ProductService();

