// backend/src/repositories/cartRepository.js

class CartRepository {
  constructor() {
    this.cart = []; // Array of { product, quantity }
  }

  /**
   * Get all items in the cart
   * @returns {Array}
   */
  getCart() {
    return [...this.cart];
  }

  /**
   * Add a product to the cart or increment its quantity
   * @param {object} product 
   * @param {number} quantity 
   * @returns {object}
   */
  addItem(product, quantity = 1) {
    const existingIndex = this.cart.findIndex(item => String(item.product.id) === String(product.id));

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
      return this.cart[existingIndex];
    } else {
      const newItem = { product, quantity };
      this.cart.push(newItem);
      return newItem;
    }
  }

  /**
   * Update the quantity of a product in the cart
   * @param {string} productId 
   * @param {number} quantity 
   * @returns {object|null}
   */
  updateQuantity(productId, quantity) {
    const index = this.cart.findIndex(item => String(item.product.id) === String(productId));

    if (index > -1) {
      if (quantity <= 0) {
        this.cart.splice(index, 1);
        return null;
      }
      this.cart[index].quantity = quantity;
      return this.cart[index];
    }
    return null;
  }

  /**
   * Remove a product from the cart
   * @param {string} productId 
   * @returns {object|null}
   */
  removeItem(productId) {
    const index = this.cart.findIndex(item => String(item.product.id) === String(productId));

    if (index > -1) {
      const removed = this.cart.splice(index, 1);
      return removed[0];
    }
    return null;
  }

  /**
   * Clear all items from the cart
   * @returns {Array}
   */
  clearCart() {
    this.cart = [];
    return this.cart;
  }
}

export default new CartRepository();
