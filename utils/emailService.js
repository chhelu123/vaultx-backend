const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'VaultX <noreply@vaultx.com>',
    to: email,
    subject: 'VaultX - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #1e2329; padding: 30px; border-radius: 8px; text-align: center;">
          <h1 style="color: #fcd535; margin-bottom: 20px;">VaultX</h1>
          <h2 style="color: #eaecef; margin-bottom: 20px;">Email Verification</h2>
          <p style="color: #848e9c; margin-bottom: 30px;">Your OTP for account verification:</p>
          <div style="background-color: #2b3139; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h1 style="color: #fcd535; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #848e9c; font-size: 14px; margin-top: 20px;">
            This OTP will expire in 10 minutes.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
        <p style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px;">
          © 2024 VaultX. Secure USDT Trading Platform.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

module.exports = { sendOTPEmail };