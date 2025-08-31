const User = require('../models/User');
const EmailOTP = require('../models/EmailOTP');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
    }

    // Get user IP address (handle proxies and load balancers)
    const ipAddress = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip || 
                     req.connection.remoteAddress || 
                     '127.0.0.1';

    const user = await User.create({ 
      name, 
      email: normalizedEmail, 
      password,
      ipAddress
    });
    
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, wallets: user.wallets }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email address' });
    }
    
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, wallets: user.wallets }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
    }

    // Rate limiting: Check recent OTP requests
    const recentOTP = await EmailOTP.findOne({
      email: normalizedEmail,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // 1 minute
    });
    
    if (recentOTP) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing OTP for this email
    await EmailOTP.deleteMany({ email: normalizedEmail });
    
    // Save new OTP
    await EmailOTP.create({ email: normalizedEmail, otp });
    
    // Send email
    console.log('Attempting to send OTP to:', normalizedEmail);
    const emailResult = await sendOTPEmail(normalizedEmail, otp);
    
    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }
    
    console.log('OTP sent successfully to:', normalizedEmail);
    
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;
    
    if (!email || !otp || !name || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await EmailOTP.findOne({ email: normalizedEmail, verified: false });
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP or OTP has already been used. Please request a new one.' });
    }
    
    if (otpRecord.expiresAt < new Date()) {
      await EmailOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    
    if (otpRecord.attempts >= 5) {
      await EmailOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
    }
    
    const isValidOTP = await otpRecord.compareOTP(otp);
    
    if (!isValidOTP) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remainingAttempts = 5 - otpRecord.attempts;
      return res.status(400).json({ message: `Invalid OTP. ${remainingAttempts} attempts remaining.` });
    }
    
    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();
    
    // Create user account
    const ipAddress = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip || 
                     req.connection.remoteAddress || 
                     '127.0.0.1';

    const user = await User.create({ 
      name, 
      email: normalizedEmail, 
      password,
      ipAddress,
      emailVerified: true
    });
    
    // Clean up OTP
    await EmailOTP.deleteOne({ _id: otpRecord._id });
    
    const token = generateToken(user._id);
    
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, wallets: user.wallets }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save token to user
    await User.findByIdAndUpdate(user._id, {
      resetToken: resetToken,
      resetTokenExpiry: resetTokenExpiry
    });

    // Send email
    const emailResult = await sendPasswordResetEmail(normalizedEmail, resetToken);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send password reset email. Please try again.' });
    }
    
    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new password reset.' });
    }

    // Update password
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};