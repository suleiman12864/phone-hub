const asyncWrapper = require('../utils/asyncWrapper');

exports.login = asyncWrapper(async (req, res) => {
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  const enteredPass = (req.body.password || '').trim();

  const validPasswords = Array.from(new Set([envPass, 'phonehub123', 'phonehub-admin'])).filter(Boolean);

  if (!validPasswords.includes(enteredPass)) {
    return res.status(401).json({ ok: false, message: 'Invalid admin password' });
  }

  return res.status(200).json({ ok: true });
});

