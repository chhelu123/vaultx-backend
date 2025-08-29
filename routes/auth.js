const express = require('express');
const { register, login, getProfile, sendOTP, verifyOTP } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

module.exports = router;