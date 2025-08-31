const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  upiId: { type: String, default: 'chhelu@paytm' },
  bankAccount: { type: String, default: '1234567890' },
  bankIFSC: { type: String, default: 'SBIN0001234' },
  bankName: { type: String, default: 'State Bank of India' },
  trc20Address: { type: String, default: 'TQn9Y2khEsLMWD5uP5sVxnzeLcEwQQhAvh' },
  bep20Address: { type: String, default: '0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C' },
  aptosAddress: { type: String, default: '0x1234567890abcdef1234567890abcdef12345678' },
  usdtAddress: { type: String, default: 'TQn9Y2khEsLMWD5uP5sVxnzeLcEwQQhAvh' } // Legacy field
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);