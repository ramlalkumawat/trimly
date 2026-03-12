/**
 * Password Reset Utilities
 * Handles secure password reset token generation and email delivery
 */

const nodemailer = require('nodemailer');
const { auditLogger } = require('./auditLogger');

/**
 * Initialize email transporter
 * Supports multiple email providers via environment variables
 */
const getEmailTransporter = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
  
  if (emailProvider === 'gmail') {
    // Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // Use app-specific password, not regular password
      }
    });
  } else if (emailProvider === 'sendgrid') {
    // SendGrid configuration
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else if (emailProvider === 'aws-ses') {
    // AWS SES configuration
    return nodemailer.createTransport({
      host: 'email-smtp.' + (process.env.AWS_REGION || 'us-east-1') + '.amazonaws.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_SES_USER,
        pass: process.env.AWS_SES_PASSWORD
      }
    });
  } else {
    // Default SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
};

/**
 * Send password reset email with secure token link
 * @param {Object} user - User document with email
 * @param {string} resetToken - Plain reset token (will be included in reset link)
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    // Determine app URL from environment
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    
    // Build reset URL
    // Frontend will extract the token and send it to the reset endpoint
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    // Prepare email content
    const subject = 'Password Reset Request - Trimly';
    const htmlContent = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.firstName || user.name || 'User'},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="
        display: inline-block;
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 15px;
      ">Reset Password</a>
      <p style="margin-top: 20px;">
        Or copy and paste this link in your browser:
        <br/>
        <code>${resetUrl}</code>
      </p>
      <p style="color: #999; margin-top: 30px; font-size: 12px;">
        This link will expire in 1 hour.
        <br/>
        If you didn't request this, please ignore this email.
        <br/>
        Your account is safe.
      </p>
    `;
    
    const plainTextContent = `
      Password Reset Request
      
      Hi ${user.firstName || user.name || 'User'},
      
      You requested to reset your password. Visit this link to reset it:
      ${resetUrl}
      
      This link will expire in 1 hour.
      If you didn't request this, please ignore this email.
      
      Best regards,
      Trimly Team
    `;
    
    // Initialize transporter
    const transporter = getEmailTransporter();
    
    // Verify connection (in development only, to avoid blocking)
    if (process.env.NODE_ENV === 'development') {
      try {
        await transporter.verify();
      } catch (err) {
        console.warn('Email transporter verification failed:', err.message);
        // Continue anyway - transporter will fail on actual send
      }
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@trimly.com',
      to: user.email,
      subject,
      text: plainTextContent,
      html: htmlContent
    });
    
    // Log successful email send
    auditLogger.log(
      'AUTHENTICATION',
      'PASSWORD_RESET_EMAIL_SENT',
      `Password reset email sent to ${user.email}`,
      { userId: user._id, email: user.email, messageId: info.messageId }
    );
    
    return true;
  } catch (error) {
    // Log email failure
    auditLogger.log(
      'SECURITY',
      'PASSWORD_RESET_EMAIL_FAILED',
      `Failed to send password reset email: ${error.message}`,
      { userId: user._id, email: user.email, errorCode: error.code }
    );
    
    console.error('Password reset email send failed:', error.message);
    throw error;
  }
};

/**
 * Validate reset token and return user if valid
 * @param {string} token - Plain reset token from request
 * @param {Object} user - User document
 * @returns {boolean} - Is token valid
 */
const isResetTokenValid = (token, user) => {
  if (!user.passwordResetToken || !user.passwordResetExpires) {
    return false;
  }
  
  return user.verifyPasswordResetToken(token);
};

/**
 * Clear password reset token from user document
 * @param {Object} user - User document
 */
const clearResetToken = (user) => {
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
};

module.exports = {
  sendPasswordResetEmail,
  isResetTokenValid,
  clearResetToken,
  getEmailTransporter
};
