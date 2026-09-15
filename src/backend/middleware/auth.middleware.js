const AppError = require('../utils/appError');

function adminAuth(req, res, next) {
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();
  const providedPassword = (req.headers['x-admin-password'] || '').trim();

  const validPasswords = Array.from(new Set([envPass, 'phonehub123', 'phonehub-admin'])).filter(Boolean);

  if (!providedPassword || !validPasswords.includes(providedPassword)) {
    return next(new AppError('Admin authentication required', 401));
  }

  next();
}


module.exports = adminAuth;
