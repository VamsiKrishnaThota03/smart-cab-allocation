const jwt = require('jsonwebtoken');
const JWT_SECRET = 'IamVamsiKrishna$21BCS222';

module.exports = function(req, res, next) {
  // Retrieve the token from the request header
  const token = req.header('auth-token');
  
  // If no token is provided, return an "Access Denied" error
  if (!token) {
    return res.status(401).json({ message: 'Access Denied' });
  }

  try {
    // Decode the token to extract user information
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user information to the request object
    req.user = decoded;

    // Check if the user is an admin
    if (req.user && req.user.isAdmin) {
      return next();  // Proceed to the next middleware or route handler
    } else {
      // If not an admin, return a "Forbidden" response
      return res.status(403).json({ message: 'Access denied, you are not an admin' });
    }

  } catch (error) {
    // If there's an error verifying the token, return an "Invalid Token" error
    res.status(401).json({ message: 'Invalid Token' });
  }
};
