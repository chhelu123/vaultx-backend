const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Ensure JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.env.JWT_SECRET = 'fallback-secret-key-for-development-only';
}

const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const kycRoutes = require('./routes/kyc');

const app = express();

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'P2P Trading Platform API', status: 'Running' });
});
app.get('/api', (req, res) => {
  res.json({
    message: 'P2P Trading API Endpoints',
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login'],
      trading: ['/api/trading/price', '/api/trading/buy', '/api/trading/sell', '/api/trading/transactions']
    }
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Create default admin if not exists
    const Admin = require('./models/Admin');
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const admin = new Admin({
        username: 'admin',
        password: 'admin123',
        isActive: true
      });
      await admin.save();
      console.log('Default admin created: admin/admin123');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});