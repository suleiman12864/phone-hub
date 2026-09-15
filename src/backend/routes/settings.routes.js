const express = require('express');
const settingsController = require('../controllers/settings.controller');
const adminAuth = require('../middleware/auth.middleware');

const router = express.Router();

router
  .route('/')
  .get(settingsController.getSettings)
  .put(adminAuth, settingsController.updateSettings);

module.exports = router;
