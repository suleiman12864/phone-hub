const express = require('express');
const productController = require('../controllers/product.controller');
const adminAuth = require('../middleware/auth.middleware');

const router = express.Router();

router
  .route('/')
  .get(productController.getAllProducts)
  .post(adminAuth, productController.createProduct);

router
  .route('/:id')
  .get(productController.getProductById)
  .put(adminAuth, productController.updateProduct)
  .delete(adminAuth, productController.deleteProduct);

module.exports = router;
