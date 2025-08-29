const User = require('../models/User');
const EmailOTP = require('../models/EmailOTP');
const { sendOTPEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Get user IP address (handle proxies and load balancers)
    const ipAddress = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
                     req.headers['x-real-ip'] || 
                     req.ip || 
                     req.connection.remoteAddress || 
                     '127.0.0.1';

    const user = await User.create({ 
      name, 
      email, 
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
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Rate limiting: Check recent OTP requests
    const recentOTP = await EmailOTP.findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // 1 minute
    });
    
    if (recentOTP) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing OTP for this email
    await EmailOTP.deleteMany({ email });
    
    // Save new OTP
    await EmailOTP.create({ email, otp });
    
    // Send email
    const emailResult = await sendOTPEmail(email, otp, name);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }
    
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

    const otpRecord = await EmailOTP.findOne({ email, verified: false });
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found or already used' });
    }
    
    if (otpRecord.expiresAt < new Date()) {
      await EmailOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    if (otpRecord.attempts >= 5) {
      await EmailOTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Too many attempts. Please request a new OTP' });
    }
    
    const isValidOTP = await otpRecord.compareOTP(otp);
    
    if (!isValidOTP) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid OTP' });
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
      email, 
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