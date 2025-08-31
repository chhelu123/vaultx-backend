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
    const { amount } = req.body; // INR amount user wants to spend
    const userId = req.user.id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.canTrade || user.kycStatus !== 'approved') {
      return res.status(403).json({ message: 'KYC verification required to trade' });
    }
    
    const prices = await getCurrentPrice();
    const usdtAmount = amount / prices.buy;
    
    // Create pending transaction (admin will approve)
    const transaction = await Transaction.create({
      userId,
      type: 'buy',
      amount: usdtAmount,
      price: prices.buy,
      total: amount,
      fee: 0,
      status: 'pending' // Admin approval required
    });

    res.json({
      message: 'USDT purchase request submitted. Admin will approve and credit USDT to your wallet.',
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sellUSDT = async (req, res) => {
  try {
    const { amount } = req.body; // USDT amount user wants to sell
    const userId = req.user.id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.canTrade || user.kycStatus !== 'approved') {
      return res.status(403).json({ message: 'KYC verification required to trade' });
    }
    
    if (user.wallets.usdt < amount) {
      return res.status(400).json({ message: `Insufficient USDT balance. You have ${user.wallets.usdt} USDT` });
    }
    
    const prices = await getCurrentPrice();
    const inrAmount = amount * prices.sell;

    const transaction = await Transaction.create({
      userId,
      type: 'sell',
      amount,
      price: prices.sell,
      total: inrAmount,
      fee: 0,
      status: 'pending' // Admin will approve and deduct USDT
    });

    res.json({
      message: 'USDT sell request submitted. Admin will approve and process payment.',
      transaction
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