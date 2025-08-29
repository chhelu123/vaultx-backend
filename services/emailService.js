const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (email, otp, name = 'User') => {
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: `Verify your VaultX account - OTP: ${otp}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0e11; color: #ffffff;">
        <div style="background: #1e2329; padding: 40px 30px; text-align: center; border-bottom: 3px solid #fcd535;">
          <h1 style="color: #fcd535; font-size: 32px; margin: 0; font-weight: 700;">VaultX</h1>
          <p style="color: #b7bdc6; margin: 10px 0 0 0; font-size: 16px;">Professional USDT Trading Platform</p>
        </div>
        
        <div style="padding: 40px 30px; background: #2b3139;">
          <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">Email Verification</h2>
          <p style="color: #b7bdc6; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Hello ${name},<br><br>
            Welcome to VaultX! Please use the following OTP to verify your email address and complete your registration.
          </p>
          
          <div style="background: #1e2329; border: 2px solid #fcd535; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
            <p style="color: #b7bdc6; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
            <div style="font-size: 36px; font-weight: 700; color: #fcd535; letter-spacing: 8px; margin: 0;">${otp}</div>
          </div>
          
          <div style="background: #f84960; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #ffffff; font-size: 14px; margin: 0; text-align: center;">
              ⚠️ This OTP will expire in 10 minutes. Do not share this code with anyone.
            </p>
          </div>
          
          <p style="color: #848e9c; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            If you didn't request this verification, please ignore this email or contact our support team.
          </p>
        </div>
        
        <div style="background: #1e2329; padding: 30px; text-align: center; border-top: 1px solid #474d57;">
          <p style="color: #848e9c; font-size: 12px; margin: 0 0 10px 0;">
            © 2024 VaultX. All rights reserved.
          </p>
          <p style="color: #848e9c; font-size: 12px; margin: 0;">
            Need help? Contact us at support@vaultx.com
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`OTP email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail };