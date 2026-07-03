// backend/src/repositories/orderRepository.js

class OrderRepository {
  constructor() {
    this.orders = []; // Array of orders
    this.orderCounter = 1;
    this.lastCounterDate = this.getDateString();
  }

  /**
   * Helper to get date string in YYYYMMDD format
   * @returns {string}
   */
  getDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  }

  /**
   * Generate unique order ID: CAMT-YYYYMMDD-XXXX
   * @returns {string}
   */
  generateOrderId() {
    const dateStr = this.getDateString();
    
    // Reset counter if date changed
    if (this.lastCounterDate !== dateStr) {
      this.lastCounterDate = dateStr;
      this.orderCounter = 1;
    }

    const counterStr = String(this.orderCounter++).padStart(4, "0");
    return `CAMT-${dateStr}-${counterStr}`;
  }

  /**
   * Create a new order
   * @param {Array} items 
   * @param {number} totalPrice 
   * @returns {object}
   */
  create(items, totalPrice) {
    const orderId = this.generateOrderId();
    const newOrder = {
      id: orderId,
      items: [...items],
      totalPrice,
      status: "pending",
      customerName: null,
      customerPhone: null,
      slipUrl: null,
      createdAt: new Date(),
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  /**
   * Fetch order by ID
   * @param {string} id 
   * @returns {object|null}
   */
  get(id) {
    const order = this.orders.find(o => o.id === id);
    return order ? { ...order } : null;
  }

  /**
   * Update order status and details
   * @param {string} id 
   * @param {object} updates 
   * @returns {object|null}
   */
  update(id, updates) {
    const index = this.orders.findIndex(o => o.id === id);
    if (index > -1) {
      this.orders[index] = { ...this.orders[index], ...updates };
      return { ...this.orders[index] };
    }
    return null;
  }
}

export default new OrderRepository();
