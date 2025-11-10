const nodemailer = require('nodemailer');

/**
 * Email Utility for sending OTP and password reset emails
 * Uses SMTP configuration from environment variables
 * 
 * Required environment variables:
 * - EMAIL_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP port (e.g., 587 for TLS, 465 for SSL)
 * - EMAIL_USER: SMTP username (usually your email address)
 * - EMAIL_PASS: SMTP password or app-specific password
 * - EMAIL_FROM: Display name and email (e.g., "FinanceAI <noreply@financeai.com>")
 */

let transporter = null;

/**
 * Initialize the email transporter
 * Creates a reusable transporter object using SMTP transport
 */
function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT || 587;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM || emailUser;

  // Validate required environment variables
  if (!emailHost || !emailUser || !emailPass) {
    console.error('⚠️ Email configuration missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort, 10),
      secure: emailPort === '465', // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass
      },
      // For Gmail, you may need to enable "Less secure app access" or use App Password
      // For other providers, check their SMTP documentation
    });

    console.log('✅ Email transporter initialized successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Error initializing email transporter:', error.message);
    return null;
  }
}

/**
 * Verify email transporter connection
 * Useful for testing SMTP configuration
 */
async function verifyConnection() {
  const trans = initializeTransporter();
  if (!trans) {
    return false;
  }

  try {
    await trans.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

/**
 * Send OTP email for password reset
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise
 */
async function sendOTPEmail(to, otp) {
  const trans = initializeTransporter();
  if (!trans) {
    console.error('Email transporter not initialized. Check SMTP configuration.');
    return false;
  }

  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const appName = process.env.APP_NAME || 'FinanceAI';

  const mailOptions = {
    from: emailFrom,
    to: to,
    subject: `[${appName}] OTP to reset your password`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${appName}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>You requested to reset your password. Use the following OTP code to verify your identity:</p>
            <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">Your OTP Code:</p>
              <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              <strong>This code will expire in 10 minutes.</strong>
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      ${appName} - Password Reset OTP
      
      You requested to reset your password. Use the following OTP code to verify your identity:
      
      OTP: ${otp}
      
      This code will expire in 10 minutes.
      
      If you didn't request this password reset, please ignore this email or contact support.
    `
  };

  try {
    const info = await trans.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending OTP email to ${to}:`, error.message);
    return false;
  }
}

/**
 * Send password reset success confirmation email
 * @param {string} to - Recipient email address
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise
 */
async function sendPasswordResetSuccessEmail(to) {
  const trans = initializeTransporter();
  if (!trans) {
    return false;
  }

  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const appName = process.env.APP_NAME || 'FinanceAI';

  const mailOptions = {
    from: emailFrom,
    to: to,
    subject: `[${appName}] Password reset successful`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${appName}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <p style="color: #666; font-size: 14px;">
              If you did not make this change, please contact support immediately.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      ${appName} - Password Reset Successful
      
      Your password has been successfully reset.
      
      If you did not make this change, please contact support immediately.
    `
  };

  try {
    await trans.sendMail(mailOptions);
    console.log(`✅ Password reset confirmation email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending confirmation email to ${to}:`, error.message);
    return false;
  }
}

module.exports = {
  initializeTransporter,
  verifyConnection,
  sendOTPEmail,
  sendPasswordResetSuccessEmail
};

