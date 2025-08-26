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
router.get('/stats', adminProtect, getDashboardStats);

// User Management
router.get('/users', adminProtect, getAllUsers);
router.put('/users/:userId/wallet', adminProtect, updateUserWallet);

// Deposit Management
router.get('/deposits', adminProtect, getAllDeposits);
router.put('/deposits/:depositId', adminProtect, approveDeposit);

// Withdrawal Management
router.get('/withdrawals', adminProtect, getAllWithdrawals);
router.put('/withdrawals/:withdrawalId', adminProtect, processWithdrawal);

// Transaction Management
router.get('/transactions', adminProtect, getAllTransactions);

// KYC Management
router.get('/kyc', adminProtect, getAllKYC);
router.get('/kyc/:kycId', adminProtect, getKYCById);
router.put('/kyc/:kycId', adminProtect, reviewKYC);

// Settings Management
router.get('/settings', adminProtect, require('../controllers/adminController').getSettings);
router.put('/settings', adminProtect, require('../controllers/adminController').updateSettings);

module.exports = router;