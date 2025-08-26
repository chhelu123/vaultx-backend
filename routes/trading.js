const express = require('express');
const { getPrice, buyUSDT, sellUSDT, getTransactions } = require('../controllers/tradingController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/price', getPrice);
router.post('/buy', protect, buyUSDT);
router.post('/sell', protect, sellUSDT);
router.get('/transactions', protect, getTransactions);

module.exports = router;