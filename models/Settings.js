const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  buyPrice: { type: Number, default: 92 },
  sellPrice: { type: Number, default: 89 },
  upiId: { type: String, default: 'chhelu@paytm' },
  bankAccount: { type: String, default: '1234567890' },
  bankIFSC: { type: String, default: 'HDFC0001234' },
  bankName: { type: String, default: 'P2P Trading' },
  usdtAddress: { type: String, default: 'TQn9Y2khEsLMWD5uP5sVxnzeLcEwQQhAvh' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);