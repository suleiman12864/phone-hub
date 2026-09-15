const express = require('express');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const adminRoutes = require('./admin.routes');
const settingsRoutes = require('./settings.routes');

const router = express.Router();

router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
