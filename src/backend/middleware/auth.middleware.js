const AppError = require('../utils/appError');

function adminAuth(req, res, next) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'phonehub123';
  const providedPassword = req.headers['x-admin-password'];

  if (!providedPassword || providedPassword !== adminPassword) {
    return next(new AppError('Admin authentication required', 401));
  }

  next();
}

module.exports = adminAuth;
