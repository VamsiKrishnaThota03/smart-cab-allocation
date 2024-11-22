// client/backend/controllers/authController.js
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'IamVamsiKrishna$21BCS222';

// Middleware for fetching user details based on JWT
const fetchUser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send('Access Denied');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId; // Attach the user's ID to req object
    next();
  } catch (error) {
    res.status(401).send('Invalid Token');
  }
};

exports.register = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password, name } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }

      // Set isAdmin for the admin user
      const isAdmin = email === 'admin@gmail.com';

      user = new User({ email, password, name, isAdmin });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      // Create a JWT token right after registering the user
      const payload = { userId: user._id, isAdmin: user.isAdmin };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      // Send the token back to the client
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  },
];


exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const payload = { userId: user._id, isAdmin: user.isAdmin };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, isAdmin: user.isAdmin }); // Return isAdmin flag
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

// Add this getuser function to get the user details
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password'); // Fetch user without password
    res.json(user);
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
