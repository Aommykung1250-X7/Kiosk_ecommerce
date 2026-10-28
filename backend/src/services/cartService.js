// backend/src/services/cartService.js
import cartRepository from "../repositories/cartRepository.js";
import productRepository from "../repositories/productRepository.js";
import { applyDiscount } from "../services/promotionService.js";

class CartService {
  /**
   * Get complete details of the cart including totals
   * @returns {object}
   */
  async getCartDetails() {
    // ตะกร้าเก็บ snapshot ของสินค้าไว้ตอนกดเพิ่ม จึงต้องดึงข้อมูลสดมาคิดราคาใหม่ทุกครั้ง
    // ไม่งั้นถ้าแอดมินแก้ส่วนลด (ทั้งของร้านและของสินค้าชิ้นนั้น) ระหว่างที่ของค้างอยู่ ราคาจะค้างตาม
    const freshProducts = await productRepository.getAll();
    const freshById = new Map(freshProducts.map(product => [String(product.id), product]));

    const items = cartRepository.getCart().map(item => {
      // สินค้าที่ถูกลบไปแล้วจะไม่มีในรายการสด ให้ใช้ snapshot เดิมต่อไป
      const source = freshById.get(String(item.product.id)) || item.product;
      return { ...item, product: applyDiscount(source) };
    });

    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const discountTotal = items.reduce(
      (sum, item) => sum + ((item.product.originalPrice - item.product.price) * item.quantity),
      0
    );

    return {
      items,
      totalPrice: Math.round(totalPrice * 100) / 100,
      totalItems,
      discountTotal: Math.round(discountTotal * 100) / 100
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
    const product = products.find(p => String(p.id) === String(productId));

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
  async updateItemQuantity(productId, quantity) {
    cartRepository.updateQuantity(productId, quantity);
    return this.getCartDetails();
  }

  /**
   * Remove a product from the cart
   * @param {string} productId 
   * @returns {object}
   */
  async removeItemFromCart(productId) {
    cartRepository.removeItem(productId);
    return this.getCartDetails();
  }

  /**
   * Clear the entire cart
   * @returns {object}
   */
  async clearCart() {
    cartRepository.clearCart();
    return this.getCartDetails();
  }
}

export default new CartService();
