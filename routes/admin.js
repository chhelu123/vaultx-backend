const express = require('express');
const {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  updateUserWallet,
  getAllDeposits,
  approveDeposit,
  getAllWithdrawals,
  processWithdrawal,
  getAllTransactions,
  getAllKYC,
  reviewKYC,
  getKYCById
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuth');
const router = express.Router();

// Authentication
router.post('/login', adminLogin);

// Dashboard
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:userId/wallet', updateUserWallet);

// Deposit Management
router.get('/deposits', getAllDeposits);
router.put('/deposits/:depositId', approveDeposit);

// Withdrawal Management
router.get('/withdrawals', getAllWithdrawals);
router.put('/withdrawals/:withdrawalId', processWithdrawal);

// Transaction Management
router.get('/transactions', getAllTransactions);

// KYC Management
router.get('/kyc', getAllKYC);
router.get('/kyc/:kycId', getKYCById);
router.put('/kyc/:kycId', reviewKYC);

// Settings Management
router.get('/settings', require('../controllers/adminController').getSettings);
router.put('/settings', require('../controllers/adminController').updateSettings);

module.exports = router;