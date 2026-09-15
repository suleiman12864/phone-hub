const storage = require('./storage.service');
const AppError = require('../utils/appError');

const FILE_NAME = 'products.json';

class ProductService {
  static async getAll() {
    return await storage.readJSON(FILE_NAME);
  }

  static async getById(id) {
    const products = await storage.readJSON(FILE_NAME);
    const product = products.find((p) => p.id === id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  static async create(productData) {
    const products = await storage.readJSON(FILE_NAME);
    const newProduct = {
      ...productData,
      id: productData.id || `PH-${Date.now()}`
    };
    products.push(newProduct);
    await storage.writeJSON(FILE_NAME, products);
    return newProduct;
  }

  static async update(id, updateData) {
    const products = await storage.readJSON(FILE_NAME);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new AppError('Product not found', 404);
    }
    products[index] = {
      ...products[index],
      ...updateData,
      id: products[index].id // ID cannot be overwritten
    };
    await storage.writeJSON(FILE_NAME, products);
    return products[index];
  }

  static async delete(id) {
    const products = await storage.readJSON(FILE_NAME);
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) {
      throw new AppError('Product not found', 404);
    }
    await storage.writeJSON(FILE_NAME, filtered);
    return true;
  }
}

module.exports = ProductService;
