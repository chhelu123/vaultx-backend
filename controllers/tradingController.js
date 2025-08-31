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
    console.log('Buy USDT request:', req.body);
    console.log('User:', req.user);
    
    const { amount } = req.body;
    const userId = req.user.id;
    
    if (!amount || amount <= 0) {
      console.log('Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const user = await User.findById(userId);
    console.log('Found user:', user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize wallets if they don't exist
    if (!user.wallets) {
      user.wallets = { inr: 0, usdt: 0 };
      await user.save();
    }
    
    console.log('User wallets:', user.wallets);
    
    const prices = await getCurrentPrice();
    const usdtAmount = amount / prices.buy;
    
    console.log('Prices:', prices, 'USDT Amount:', usdtAmount);

    if (user.wallets.inr < amount) {
      return res.status(400).json({ message: `Insufficient INR balance. You have ₹${user.wallets.inr}` });
    }

    user.wallets.inr -= amount;
    user.wallets.usdt += usdtAmount;
    await user.save();

    const transaction = await Transaction.create({
      userId,
      type: 'buy',
      amount: usdtAmount,
      price: prices.buy,
      total: amount,
      fee: 0,
      status: 'completed'
    });

    console.log('Transaction created:', transaction);

    res.json({
      message: 'USDT purchased successfully',
      transaction,
      wallets: user.wallets
    });
  } catch (error) {
    console.error('Buy USDT error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.sellUSDT = async (req, res) => {
  try {
    const { amount } = req.body;
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
    
    if (!user.canTrade || user.kycStatus !== 'approved') {
      return res.status(403).json({ message: 'KYC verification required to trade' });
    }
    
    // Initialize wallets if they don't exist
    if (!user.wallets) {
      user.wallets = { inr: 0, usdt: 0 };
    }
    
    const prices = await getCurrentPrice();
    const inrAmount = amount * prices.sell;

    if (user.wallets.usdt < amount) {
      return res.status(400).json({ message: `Insufficient USDT balance. You have ${user.wallets.usdt} USDT` });
    }

    user.wallets.usdt -= amount;
    user.wallets.inr += inrAmount;
    await user.save();

    const transaction = await Transaction.create({
      userId,
      type: 'sell',
      amount,
      price: prices.sell,
      total: inrAmount,
      fee: 0,
      status: 'completed'
    });

    res.json({
      message: 'USDT sold successfully',
      transaction,
      wallets: user.wallets
    });
  } catch (error) {
    console.error('Sell USDT error:', error);
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