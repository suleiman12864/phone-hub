const express = require('express');
const orderController = require('../controllers/order.controller');
const adminAuth = require('../middleware/auth.middleware');

const router = express.Router();

router
  .route('/')
  .get(adminAuth, orderController.getAllOrders)
  .post(orderController.createOrder);

router
  .route('/:id/status')
  .put(adminAuth, orderController.updateOrderStatus);

module.exports = router;
