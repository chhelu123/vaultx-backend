const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  userNumber: { type: Number, unique: true },
  isVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  wallets: {
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
  resetToken: { type: String, default: undefined },
  resetTokenExpiry: { type: Date, default: undefined }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Auto-increment userNumber
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.userNumber) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'user_id',
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.userNumber = counter.sequence_value;
    } catch (error) {
      return next(error);
    }
  }
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