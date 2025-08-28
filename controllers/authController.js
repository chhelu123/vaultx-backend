const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const { sendOTPEmail } = require('../utils/emailService');

// Send OTP for registration
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in memory (in production, use Redis)
    global.otpStore = global.otpStore || {};
    global.otpStore[email] = { otp, expiry: otpExpiry };

    // Send OTP via email (always returns true now)
    await sendOTPEmail(email, otp);
    
    console.log(`OTP generated for ${email}: ${otp}`);
    res.json({ message: 'OTP sent successfully', success: true });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Verify OTP
    const storedOTP = global.otpStore?.[email];
    if (!storedOTP || storedOTP.otp !== otp || new Date() > storedOTP.expiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
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
      ipAddress,
      isVerified: true
    });
    
    // Clear OTP
    delete global.otpStore[email];
    
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

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};