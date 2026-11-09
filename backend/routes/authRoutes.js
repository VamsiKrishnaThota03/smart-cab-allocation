const express = require('express');
const authController = require('../controllers/authController');
const fetchUser = require('../middleware/fetchUser');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/getuser', fetchUser, authController.getUser);
router.get('/getuser', fetchUser, authController.getUser);

module.exports = router;
