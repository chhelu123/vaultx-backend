const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOTPEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: {
      email: process.env.FROM_EMAIL,
      name: 'VaultX Support'
    },
    subject: 'Your VaultX verification code',
    replyTo: process.env.FROM_EMAIL,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0;">VaultX</h1>
            <p style="color: #666; font-size: 16px; margin: 5px 0 0 0;">Secure Trading Platform</p>
          </div>
          
          <h2 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Email Verification</h2>
          
          <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Thank you for registering with VaultX. Please use the verification code below to complete your registration:
          </p>
          
          <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: 700; color: #007bff; letter-spacing: 4px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            This verification code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
          
          <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from VaultX. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    console.log('Sending email via SendGrid to:', email);
    console.log('From email:', process.env.FROM_EMAIL);
    await sgMail.send(msg);
    console.log('OTP email sent successfully via SendGrid');
    return { success: true };
  } catch (error) {
    console.error('SendGrid error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `https://vaultx.co.in/reset-password?token=${resetToken}`;
  
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: 'VaultX - Password Reset Request',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0;">VaultX</h1>
            <p style="color: #666; font-size: 16px; margin: 5px 0 0 0;">Secure Trading Platform</p>
          </div>
          
          <h2 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Password Reset</h2>
          
          <p style="color: #333; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #007bff; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            This link will expire in 15 minutes. If you didn't request this reset, please ignore this email.
          </p>
          
          <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from VaultX. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Password reset email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail, sendPasswordResetEmail };