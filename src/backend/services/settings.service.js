const storage = require('./storage.service');

const FILE_NAME = 'settings.json';

class SettingsService {
  static async get() {
    const settings = await storage.readJSON(FILE_NAME);
    return {
      ...settings,
      paystackPublicKey: settings.paystackPublicKey || process.env.PAYSTACK_PUBLIC_KEY || ''
    };
  }


  static async update(settingsData) {
    const current = await storage.readJSON(FILE_NAME);
    const updated = {
      ...current,
      ...settingsData
    };
    await storage.writeJSON(FILE_NAME, updated);
    return updated;
  }
}

module.exports = SettingsService;
