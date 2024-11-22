const User = require('../models/User');

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied, you are not an admin' });
  }
};

// Controller to fetch all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users excluding their passwords
    const users = await User.find().select('-password');
    
    // Return the list of users
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// Controller to delete a user by admin
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    
    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of admin user
    if (user.isAdmin) {
      return res.status(400).json({ message: 'Cannot delete an admin user' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Return success message
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
