// client/backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const fetchUser = require('../middleware/fetchUser'); // Middleware to verify token

// Register user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get user details
router.post('/getuser', fetchUser, authController.getUser); // Protected route, requires token

module.exports = router;

