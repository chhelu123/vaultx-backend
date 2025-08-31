const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['inr', 'usdt'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  withdrawalDetails: { type: String, required: true }, // UPI ID or USDT address
  paymentMethod: { type: String },
  chain: { type: String, enum: ['trc20', 'bep20', 'aptos'], default: 'trc20' }, // For USDT withdrawals
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);