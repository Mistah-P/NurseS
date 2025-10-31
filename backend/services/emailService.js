const nodemailer = require('nodemailer');

/**
 * Email Service for NurseScript
 * Handles sending emails using nodemailer with Gmail SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize the email transporter
   */
  async initialize() {
    try {
      // Create transporter using Gmail SMTP
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
        }
      });

      // Verify connection
      await this.transporter.verify();
      this.initialized = true;
      console.log('📧 Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Send password reset email to teacher
   * @param {string} teacherEmail - Teacher's email address
   * @param {string} teacherName - Teacher's name
   * @param {string} resetLink - Password reset link from Firebase
   * @param {string} tempPassword - Temporary password (for backup info)
   */
  async sendTeacherPasswordResetEmail(teacherEmail, teacherName, resetLink, tempPassword) {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult) {
        throw new Error('Email service not available');
      }
    }

    const emailTemplate = this.getPasswordResetEmailTemplate(teacherName, teacherEmail, resetLink, tempPassword);

    const mailOptions = {
      from: {
        name: 'NurseScript Team',
        address: process.env.EMAIL_USER
      },
      to: teacherEmail,
      subject: 'Welcome to NurseScript - Set Your Password',
      html: emailTemplate,
      text: `
Welcome to NurseScript, ${teacherName}!

Your teacher account has been created successfully. To get started, you need to set your password.

Click the link below to set your password:
${resetLink}

This link will expire in 24 hours for security reasons.

If you have any questions, please contact your administrator.

Best regards,
The NurseScript Team
      `.trim()
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Password reset email sent to ${teacherEmail}:`, result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        email: teacherEmail
      };
    } catch (error) {
      console.error(`❌ Failed to send email to ${teacherEmail}:`, error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Generate HTML email template for password reset
   * @param {string} teacherName - Teacher's name
   * @param {string} teacherEmail - Teacher's email address
   * @param {string} resetLink - Password reset link
   * @param {string} tempPassword - Temporary password (for reference)
   */
  getPasswordResetEmailTemplate(teacherName, teacherEmail, resetLink, tempPassword) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to NurseScript</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #2c5aa0;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #1e3d6f;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #2c5aa0;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🩺 NurseScript</div>
            <div class="subtitle">Medical Typing Education Platform</div>
        </div>
        
        <div class="content">
            <h2>Welcome, ${teacherName}!</h2>
            
            <p>Your teacher account has been successfully created on NurseScript. To get started, you need to set your password.</p>
            
            <div class="info-box">
                <strong>📧 Email:</strong> ${teacherEmail}<br>
                <strong>👤 Role:</strong> Teacher<br>
                <strong>🔐 Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; color: #d63384;">${tempPassword}</code>
            </div>
            
            <p><strong>To log in to your account:</strong></p>
            <ol>
                <li>Go to <a href="https://nursescript.uic.edu.ph/login" style="color: #2c5aa0;">NurseScript Login Page</a></li>
                <li>Use your email: <strong>${teacherEmail}</strong></li>
                <li>Use the temporary password above</li>
                <li>You'll be prompted to change your password on first login</li>
            </ol>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> This is your temporary password. You'll be prompted to change it when you first log in for security reasons.
            </div>
            
            <p>After setting your password, you'll be able to:</p>
            <ul>
                <li>✅ Access your teacher dashboard</li>
                <li>✅ Create and manage typing exercises</li>
                <li>✅ Monitor student progress</li>
                <li>✅ Generate performance reports</li>
            </ul>
            
            <p>If you have any questions or need assistance, please contact your administrator.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br><strong>The NurseScript Team</strong></p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Check if email service is available
   */
  isAvailable() {
    return this.initialized && this.transporter !== null;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;