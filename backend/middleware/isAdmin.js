// Must run after fetchUser. Allows the request through only for admin tokens.
module.exports = function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Access denied. Please log in.' });
  if (!req.isAdmin) return res.status(403).json({ message: 'Access denied, you are not an admin' });
  next();
};
