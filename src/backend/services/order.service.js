const storage = require('./storage.service');
const AppError = require('../utils/appError');

const FILE_NAME = 'orders.json';

class OrderService {
  static async getAll() {
    return await storage.readJSON(FILE_NAME);
  }

  static async create(orderData) {
    const orders = await storage.readJSON(FILE_NAME);
    const newOrder = {
      orderId: `PH-${Date.now()}`,
      paymentMethod: orderData.paymentMethod || 'Paystack',
      paymentStatus: orderData.paymentStatus || 'Pending',
      paystackReference: orderData.paystackReference || '',
      ...orderData,
      date: new Date().toISOString(),
      status: 'New'
    };

    orders.unshift(newOrder);
    await storage.writeJSON(FILE_NAME, orders);
    return newOrder;
  }

  static async updateStatus(id, status) {
    const orders = await storage.readJSON(FILE_NAME);
    const order = orders.find((o) => o.orderId === id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    order.status = status;
    await storage.writeJSON(FILE_NAME, orders);
    return order;
  }
}

module.exports = OrderService;
