const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Admin = require('../models/Admin');
const KYC = require('../models/KYC');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Admin Authentication
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Hardcoded admin for now
    if (username === 'admin' && password === 'admin123') {
      const token = generateToken('admin-id');
      return res.json({ token, admin: { id: 'admin-id', username: 'admin' } });
    }
    
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const pendingDeposits = await Deposit.countDocuments({ status: 'pending' });
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    
    const totalVolume = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      totalUsers,
      totalTransactions,
      pendingDeposits,
      pendingWithdrawals,
      totalVolume: totalVolume[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User Management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { inr, usdt } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.wallets.inr = inr;
    user.wallets.usdt = usdt;
    await user.save();
    
    res.json({ message: 'Wallet updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deposit Management
exports.getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { status, adminNotes } = req.body;
    
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }
    
    deposit.status = status;
    deposit.adminNotes = adminNotes;
    await deposit.save();
    
    if (status === 'completed') {
      const user = await User.findById(deposit.userId);
      user.wallets[deposit.type] += deposit.amount;
      await user.save();
    }
    
    res.json({ message: 'Deposit updated successfully', deposit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Withdrawal Management
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.processWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, adminNotes } = req.body;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    
    withdrawal.status = status;
    withdrawal.adminNotes = adminNotes;
    await withdrawal.save();
    
    if (status === 'completed') {
      const user = await User.findById(withdrawal.userId);
      user.wallets[withdrawal.type] -= withdrawal.amount;
      await user.save();
    }
    
    res.json({ message: 'Withdrawal updated successfully', withdrawal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Transaction Management
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// KYC Management
exports.getAllKYC = async (req, res) => {
  try {
    const kycRecords = await KYC.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(kycRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reviewKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { status, adminNotes } = req.body;
    
    const kyc = await KYC.findByIdAndUpdate(kycId, {
      status,
      adminNotes,
      reviewedAt: new Date()
    }, { new: true });
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }
    
    // Update user trading permissions
    await User.findByIdAndUpdate(kyc.userId, {
      kycStatus: status,
      canTrade: status === 'approved'
    });
    
    res.json({ message: 'KYC reviewed successfully', kyc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getKYCById = async (req, res) => {
  try {
    const { kycId } = req.params;
    const kyc = await KYC.findById(kycId).populate('userId', 'name email');
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }
    
    res.json(kyc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};