const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  wallets: {
    inr: { type: Number, default: 0 },
    usdt: { type: Number, default: 0 }
  },
  kycStatus: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
  canTrade: { type: Boolean, default: false },
  ipAddress: { type: String },
  location: {
    country: String,
    state: String,
    city: String
  },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Normalize email before saving
userSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);