const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const axios = require('axios');

const getCurrentPrice = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return {
    buy: settings.buyRate || 92,
    sell: settings.sellRate || 89
  };
};

exports.getPrice = async (req, res) => {
  try {
    const prices = await getCurrentPrice();
    res.json({ buyPrice: prices.buy, sellPrice: prices.sell });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.buyUSDT = async (req, res) => {
  try {
    const { inrAmount, usdtAmount, paymentMethod, transactionId } = req.body;
    const userId = req.user.id;
    
    if (!inrAmount || inrAmount <= 0 || !usdtAmount || !transactionId) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.canTrade || user.kycStatus !== 'approved') {
      return res.status(403).json({ message: 'KYC verification required to trade' });
    }
    
    const prices = await getCurrentPrice();
    
    // Create USDT deposit request for admin approval
    const Deposit = require('../models/Deposit');
    const deposit = await Deposit.create({
      userId,
      type: 'usdt',
      amount: usdtAmount,
      paymentMethod: paymentMethod || 'UPI',
      transactionId: transactionId, // User's actual transaction ID
      status: 'pending',
      buyDetails: {
        inrAmount: inrAmount,
        rate: prices.buy,
        usdtAmount: usdtAmount
      }
    });

    res.json({
      message: `USDT purchase request submitted. You will receive ${usdtAmount.toFixed(6)} USDT after admin approval.`,
      deposit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sellUSDT = async (req, res) => {
  try {
    const { usdtAmount, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;
    
    if (!usdtAmount || usdtAmount <= 0 || !paymentDetails) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.canTrade || user.kycStatus !== 'approved') {
      return res.status(403).json({ message: 'KYC verification required to trade' });
    }
    
    if (user.wallets.usdt < usdtAmount) {
      return res.status(400).json({ message: `Insufficient USDT balance. You have ${user.wallets.usdt} USDT` });
    }
    
    const prices = await getCurrentPrice();
    const inrAmount = usdtAmount * prices.sell;
    
    // Create USDT withdrawal request for admin approval
    const Withdrawal = require('../models/Withdrawal');
    const withdrawal = await Withdrawal.create({
      userId,
      type: 'usdt',
      amount: usdtAmount,
      paymentMethod: paymentMethod || 'UPI',
      withdrawalDetails: paymentDetails, // User's payment details
      status: 'pending',
      sellDetails: {
        usdtAmount: usdtAmount,
        rate: prices.sell,
        inrAmount: inrAmount
      }
    });

    res.json({
      message: `USDT sell request submitted. You will receive ₹${inrAmount.toFixed(2)} after admin approval.`,
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments({ userId: req.user.id });
    
    res.json({
      transactions,
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