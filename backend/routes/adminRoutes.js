const express = require('express');
const fetchUser = require('../middleware/fetchUser');
const isAdmin = require('../middleware/isAdmin');
const { getAllUsers, deleteUser } = require('../controllers/adminController');

const router = express.Router();

router.get('/users', fetchUser, isAdmin, getAllUsers);
router.delete('/users/:id', fetchUser, isAdmin, deleteUser);

module.exports = router;
