const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Default admin already exists');
      process.exit(0);
    }

    // Create default admin
    const admin = await Admin.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Default admin created successfully:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createDefaultAdmin();