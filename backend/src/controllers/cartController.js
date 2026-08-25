// backend/src/controllers/cartController.js
import cartService from "../services/cartService.js";

class CartController {
  /**
   * Handle GET /api/cart
   */
  async getCart(req, res) {
    try {
      const cart = await cartService.getCartDetails();
      return res.json(cart);
    } catch (error) {
      console.error("Error in CartController.getCart:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle POST /api/cart
   */
  async addItem(req, res) {
    try {
      const { productId, quantity } = req.body;
      if (!productId || (typeof productId !== "string" && typeof productId !== "number")) {
        return res.status(400).json({ error: "Invalid product ID format." });
      }

      const qty = quantity !== undefined ? parseInt(quantity, 10) : 1;
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: "Quantity must be a positive integer." });
      }

      const cart = await cartService.addItemToCart(String(productId), qty);
      return res.json(cart);
    } catch (error) {
      console.error("Error in CartController.addItem:", error);
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle PUT /api/cart
   */
  async updateQuantity(req, res) {
    try {
      const { productId, quantity } = req.body;
      if (!productId || (typeof productId !== "string" && typeof productId !== "number")) {
        return res.status(400).json({ error: "Invalid product ID format." });
      }

      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ error: "Quantity must be a non-negative integer." });
      }

      const cart = await cartService.updateItemQuantity(String(productId), qty);
      return res.json(cart);
    } catch (error) {
      console.error("Error in CartController.updateQuantity:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle DELETE /api/cart/:productId
   */
  async removeItem(req, res) {
    try {
      const { productId } = req.params;
      if (!productId || (typeof productId !== "string" && typeof productId !== "number")) {
        return res.status(400).json({ error: "Invalid product ID format." });
      }

      const cart = await cartService.removeItemFromCart(String(productId));
      return res.json(cart);
    } catch (error) {
      console.error("Error in CartController.removeItem:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }

  /**
   * Handle POST /api/cart/clear
   */
  async clear(req, res) {
    try {
      const cart = await cartService.clearCart();
      return res.json(cart);
    } catch (error) {
      console.error("Error in CartController.clear:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
}

export default new CartController();
