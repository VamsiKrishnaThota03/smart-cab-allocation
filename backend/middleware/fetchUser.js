const jwt = require('jsonwebtoken');
const JWT_SECRET = 'IamVamsiKrishna$21BCS222';

module.exports = function(req, res, next) {
  const token = req.header('auth-token');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};
