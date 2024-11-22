const express = require('express');
const router = express.Router();
const fetchUser = require('../middleware/fetchUser'); // Import fetchUser middleware
const { getAllUsers, deleteUser } = require('../controllers/adminController'); // Import controller functions
const isAdmin = require('../middleware/isAdmin'); // Import the isAdmin middleware

// Route to get all users (admin only)
router.get('/users', fetchUser, isAdmin, getAllUsers);

// Route to delete a user (admin only)
router.delete('/users/:id', fetchUser, isAdmin, deleteUser);

module.exports = router;
