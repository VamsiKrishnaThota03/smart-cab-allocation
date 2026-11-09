const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { requireEnv, listEnv } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, requireEnv('JWT_SECRET'), {
    expiresIn: '1h',
  });

// Admin rights are granted only to emails listed in ADMIN_EMAILS.
const isAdminEmail = (email) =>
  listEnv('ADMIN_EMAILS')
    .map((item) => item.toLowerCase())
    .includes(String(email).toLowerCase());

exports.register = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
  body('email').trim().isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  validate,
  async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashed, name, isAdmin: isAdminEmail(email) });

      res.status(201).json({ token: signToken(user), isAdmin: user.isAdmin });
    } catch (error) {
      console.error('Register error:', error.message);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  },
];

exports.login = [
  body('email').trim().isEmail().withMessage('Invalid email address'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      res.json({ token: signToken(user), isAdmin: user.isAdmin });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  },
];

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
