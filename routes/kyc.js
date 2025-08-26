const express = require('express');
const { submitKYC, getKYCStatus, updateKYC } = require('../controllers/kycController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/submit', protect, submitKYC);
router.get('/status', protect, getKYCStatus);
router.put('/update', protect, updateKYC);

module.exports = router;