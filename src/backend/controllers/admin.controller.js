const asyncWrapper = require('../utils/asyncWrapper');

exports.login = asyncWrapper(async (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'phonehub123';
  const { password } = req.body;

  const isValid = password === adminPassword;
  if (!isValid) {
    return res.status(401).json({ ok: false, message: 'Invalid admin password' });
  }

  return res.status(200).json({ ok: true });
});
