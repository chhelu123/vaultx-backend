const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

emailOTPSchema.pre('save', async function(next) {
  if (!this.isModified('otp')) return next();
  this.otp = await bcrypt.hash(this.otp, 10);
  next();
});

emailOTPSchema.methods.compareOTP = async function(candidateOTP) {
  return bcrypt.compare(candidateOTP, this.otp);
};

emailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailOTP', emailOTPSchema);