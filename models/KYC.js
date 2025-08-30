const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  mobileNumber: { type: String, required: true },
  aadharNumber: { type: String, required: true },
  panNumber: { type: String, required: true },
  aadharFrontWithSelfie: { type: String, required: true }, // Base64 selfie with front Aadhar
  aadharBackWithSelfie: { type: String, required: true }, // Base64 selfie with back Aadhar
  panDocument: { type: String, required: true }, // Base64 or file path
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('KYC', kycSchema);