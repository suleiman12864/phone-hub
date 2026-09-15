const SettingsService = require('../services/settings.service');
const asyncWrapper = require('../utils/asyncWrapper');

exports.getSettings = asyncWrapper(async (req, res) => {
  const settings = await SettingsService.get();
  res.status(200).json(settings);
});

exports.updateSettings = asyncWrapper(async (req, res) => {
  const updatedSettings = await SettingsService.update(req.body);
  res.status(200).json(updatedSettings);
});
