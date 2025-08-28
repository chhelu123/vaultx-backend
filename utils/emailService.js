const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const sendOTPEmail = async (email, otp) => {
  // Try SendGrid first, then Gmail, then console log
  
  // Method 1: SendGrid (most reliable)
  if (process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@vaultx.com',
        subject: 'VaultX - Email Verification OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1e2329; padding: 30px; border-radius: 8px; text-align: center; color: white;">
              <h1 style="color: #fcd535; margin-bottom: 20px;">VaultX</h1>
              <h2 style="margin-bottom: 20px;">Email Verification</h2>
              <p style="margin-bottom: 30px;">Your OTP for account verification:</p>
              <div style="background-color: #2b3139; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h1 style="color: #fcd535; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p style="font-size: 14px; margin-top: 20px;">
                This OTP will expire in 10 minutes.<br>
                If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
        `
      };
      
      await sgMail.send(msg);
      console.log(`✅ Email sent via SendGrid to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid error:', error.message);
    }
  }
  
  // Method 2: Gmail (backup)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'VaultX - Email Verification OTP',
        text: `Your VaultX verification OTP is: ${otp}. This OTP will expire in 10 minutes.`
      });
      
      console.log(`✅ Email sent via Gmail to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Gmail error:', error.message);
    }
  }
  
  // Method 3: Console log (fallback)
  console.log(`\n📧 === OTP FOR ${email} ===`);
  console.log(`🔢 OTP: ${otp}`);
  console.log(`⏰ Expires in 10 minutes`);
  console.log(`========================\n`);
  return true;
};

module.exports = { sendOTPEmail };