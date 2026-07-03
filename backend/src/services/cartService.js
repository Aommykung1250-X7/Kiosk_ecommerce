// backend/src/services/cartService.js
import cartRepository from "../repositories/cartRepository.js";
import productRepository from "../repositories/productRepository.js";

class CartService {
  /**
   * Get complete details of the cart including totals
   * @returns {object}
   */
  getCartDetails() {
    const items = cartRepository.getCart();
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      totalPrice,
      totalItems
    };
  }

  /**
   * Add a product to the cart by ID
   * @param {string} productId 
   * @param {number} quantity 
   * @returns {Promise<object>}
   */
  async addItemToCart(productId, quantity = 1) {
    const products = await productRepository.getAll();
    const product = products.find(p => p.id === productId);

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    cartRepository.addItem(product, quantity);
    return this.getCartDetails();
  }

  /**
   * Update quantity of a product in the cart
   * @param {string} productId 
   * @param {number} quantity 
   * @returns {object}
   */
  updateItemQuantity(productId, quantity) {
    cartRepository.updateQuantity(productId, quantity);
    return this.getCartDetails();
  }

  /**
   * Remove a product from the cart
   * @param {string} productId 
   * @returns {object}
   */
  removeItemFromCart(productId) {
    cartRepository.removeItem(productId);
    return this.getCartDetails();
  }

  /**
   * Clear the entire cart
   * @returns {object}
   */
  clearCart() {
    cartRepository.clearCart();
    return this.getCartDetails();
  }
}

export default new CartService();
