const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['inr', 'usdt'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String },
  adminNotes: { type: String },
  buyDetails: {
    inrAmount: Number,
    rate: Number,
    usdtAmount: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Deposit', depositSchema);