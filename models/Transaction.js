const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  fee: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);