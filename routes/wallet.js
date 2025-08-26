const express = require('express');
const { getWalletInfo, requestDeposit, getDeposits, requestWithdrawal, getWithdrawals, processUSDTWithdrawal } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/info', protect, getWalletInfo);
router.post('/deposit', protect, requestDeposit);
router.get('/deposits', protect, getDeposits);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/withdrawals', protect, getWithdrawals);
router.post('/withdraw-usdt', protect, processUSDTWithdrawal);

module.exports = router;