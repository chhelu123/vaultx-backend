const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const { sendUSDT } = require('../services/paymentService');

exports.getWalletInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      wallets: user.wallets,
      depositInfo: {
        upi: 'chhelu@paytm',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        usdtAddress: 'TQn9Y2khEsLMWD5uP5sVxnzeLcEwQQhAvh'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestDeposit = async (req, res) => {
  try {
    const { type, amount, paymentMethod, transactionId } = req.body;
    const userId = req.user.id;

    const deposit = await Deposit.create({
      userId,
      type,
      amount,
      paymentMethod,
      transactionId
    });

    res.json({
      message: 'Deposit request submitted successfully',
      deposit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeposits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const deposits = await Deposit.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Deposit.countDocuments({ userId: req.user.id });
    
    res.json({
      deposits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const { type, amount, withdrawalDetails } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user.wallets[type] < amount) {
      return res.status(400).json({ message: `Insufficient ${type.toUpperCase()} balance` });
    }

    const withdrawal = await Withdrawal.create({
      userId,
      type,
      amount,
      withdrawalDetails
    });

    res.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const withdrawals = await Withdrawal.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Withdrawal.countDocuments({ userId: req.user.id });
    
    res.json({
      withdrawals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process USDT withdrawal (manual for now)
exports.processUSDTWithdrawal = async (req, res) => {
  try {
    const { amount, address } = req.body;
    
    // Create withdrawal request for manual processing
    await Withdrawal.create({
      userId: req.user.id,
      type: 'usdt',
      amount,
      withdrawalDetails: address,
      status: 'pending'
    });
    
    res.json({ 
      success: true, 
      message: 'USDT withdrawal request submitted for manual processing'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};