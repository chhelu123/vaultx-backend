const KYC = require('../models/KYC');
const User = require('../models/User');

// Submit KYC documents
exports.submitKYC = async (req, res) => {
  try {
    const { fullName, dateOfBirth, mobileNumber, streetAddress, city, state, pincode, aadharNumber, panNumber, aadharFrontWithSelfie, aadharBackWithSelfie, panDocument } = req.body;
    const userId = req.user.id;

    // Check if KYC already exists
    const existingKYC = await KYC.findOne({ userId });
    if (existingKYC) {
      return res.status(400).json({ message: 'KYC already submitted' });
    }

    // Create KYC record
    const kyc = await KYC.create({
      userId,
      fullName,
      dateOfBirth,
      mobileNumber,
      streetAddress,
      city,
      state,
      pincode,
      aadharNumber,
      panNumber,
      aadharFrontWithSelfie,
      aadharBackWithSelfie,
      panDocument
    });

    // Update user KYC status
    await User.findByIdAndUpdate(userId, { kycStatus: 'pending' });

    res.json({ message: 'KYC documents submitted successfully', kyc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's KYC status
exports.getKYCStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const kyc = await KYC.findOne({ userId });
    const user = await User.findById(userId);

    res.json({
      kycStatus: user.kycStatus,
      canTrade: user.canTrade,
      kyc: kyc ? {
        status: kyc.status,
        submittedAt: kyc.submittedAt,
        adminNotes: kyc.adminNotes,
        fullName: kyc.fullName,
        dateOfBirth: kyc.dateOfBirth,
        mobileNumber: kyc.mobileNumber,
        panNumber: kyc.panNumber
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update KYC documents (if rejected)
exports.updateKYC = async (req, res) => {
  try {
    const { fullName, dateOfBirth, mobileNumber, aadharNumber, panNumber, aadharFrontWithSelfie, aadharBackWithSelfie, panDocument } = req.body;
    const userId = req.user.id;

    const kyc = await KYC.findOne({ userId });
    if (!kyc || kyc.status !== 'rejected') {
      return res.status(400).json({ message: 'Cannot update KYC at this time' });
    }

    // Update KYC record
    kyc.fullName = fullName;
    kyc.dateOfBirth = dateOfBirth;
    kyc.mobileNumber = mobileNumber;
    kyc.aadharNumber = aadharNumber;
    kyc.panNumber = panNumber;
    kyc.aadharFrontWithSelfie = aadharFrontWithSelfie;
    kyc.aadharBackWithSelfie = aadharBackWithSelfie;
    kyc.panDocument = panDocument;
    kyc.status = 'pending';
    kyc.submittedAt = new Date();
    kyc.adminNotes = '';
    await kyc.save();

    // Update user status
    await User.findByIdAndUpdate(userId, { kycStatus: 'pending' });

    res.json({ message: 'KYC documents updated successfully', kyc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};