const jwt = require('jsonwebtoken');
const { requireEnv } = require('../config/env');

// Verifies the JWT in the `auth-token` header and exposes the user id on
// `req.user` and the admin flag on `req.isAdmin`.
module.exports = function fetchUser(req, res, next) {
  const token = req.header('auth-token');
  if (!token) return res.status(401).json({ message: 'Access denied. Please log in.' });

  try {
    const decoded = jwt.verify(token, requireEnv('JWT_SECRET'));
    req.user = decoded.userId;
    req.isAdmin = Boolean(decoded.isAdmin);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};
