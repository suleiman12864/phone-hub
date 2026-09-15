const OrderService = require('../services/order.service');
const asyncWrapper = require('../utils/asyncWrapper');

exports.getAllOrders = asyncWrapper(async (req, res) => {
  const orders = await OrderService.getAll();
  res.status(200).json(orders);
});

exports.createOrder = asyncWrapper(async (req, res) => {
  const newOrder = await OrderService.create(req.body);
  res.status(201).json(newOrder);
});

exports.updateOrderStatus = asyncWrapper(async (req, res) => {
  const updatedOrder = await OrderService.updateStatus(req.params.id, req.body.status);
  res.status(200).json(updatedOrder);
});
