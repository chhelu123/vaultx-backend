const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.adminProtect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(401).json({ message: 'Admin access required' });
    }
    
    const admin = await Admin.findById(decoded.id);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Admin not found or inactive' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Admin access required' });
  }
};