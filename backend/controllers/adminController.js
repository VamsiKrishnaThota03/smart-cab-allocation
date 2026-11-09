const mongoose = require('mongoose');
const User = require('../models/User');

// List all users without their password hashes (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('List users error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// Delete a non-admin user (admin only)
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete an admin user' });

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
