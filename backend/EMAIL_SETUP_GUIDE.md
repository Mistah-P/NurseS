# 📧 Email Service Setup Guide

This guide will help you set up email functionality for the NurseScript teacher creation feature.

## 🎯 Overview

The email service sends professional password reset emails to newly created teachers using Gmail SMTP and nodemailer.

## 🔧 Setup Instructions

### Step 1: Gmail Configuration

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to Security > App passwords
   - Select "Mail" as the app
   - Generate a 16-character app password
   - **Save this password** - you'll need it for the .env file

### Step 2: Environment Variables

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Add email configuration to .env**
   ```env
   # Email Configuration (Gmail SMTP)
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_APP_PASSWORD=your-16-character-app-password
   ```

   **Example:**
   ```env
   EMAIL_USER=nursescript.admin@gmail.com
   EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ```

### Step 3: Test Email Service

Run the test script to verify your configuration:

```bash
node test-email-setup.js
```

**Expected Output:**
```
🧪 Testing Email Service Configuration...

📋 Environment Variables:
EMAIL_USER: ✅ Set
EMAIL_APP_PASSWORD: ✅ Set

🔧 Initializing email service...
✅ Email service initialized successfully

📧 Testing email sending...
✅ Test email sent successfully!
📧 Email sent to: your-email@gmail.com
📨 Message ID: <message-id>

🎉 Email service is working correctly!
Check your email inbox for the test message.
```

## 🎨 Email Template Features

The email template includes:
- **Professional branding** with NurseScript logo
- **Responsive design** that works on all devices
- **Clear instructions** for password reset
- **Security warnings** about link expiration
- **Contact information** for support

## 🔒 Security Features

- **App passwords** instead of main Gmail password
- **Secure SMTP connection** with TLS encryption
- **No password storage** in database or logs
- **Link expiration** handled by Firebase Auth
- **Error handling** that doesn't expose sensitive info

## 🧪 Testing Teacher Creation

After email setup, test the complete flow:

1. **Start the backend server**
   ```bash
   npm start
   ```

2. **Create a test teacher**
   ```bash
   curl -X POST http://localhost:3000/api/admin/teachers \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Teacher",
       "email": "test.teacher@example.com",
       "adminId": "your-admin-id"
     }'
   ```

3. **Check the response**
   ```json
   {
     "success": true,
     "message": "Teacher account created successfully. Password reset email sent to test.teacher@example.com.",
     "data": {
       "emailSent": true,
       "emailError": null
     }
   }
   ```

4. **Verify email delivery**
   - Check the teacher's email inbox
   - Look for "Welcome to NurseScript - Set Your Password"
   - Test the password reset link

## 🚨 Troubleshooting

### Common Issues

#### 1. "Invalid login" error
- **Cause**: Using regular Gmail password instead of App Password
- **Solution**: Generate and use Gmail App Password

#### 2. "Authentication failed" error
- **Cause**: 2FA not enabled or wrong credentials
- **Solution**: Enable 2FA and regenerate App Password

#### 3. "Connection timeout" error
- **Cause**: Firewall blocking SMTP port 587
- **Solution**: Check firewall settings or try port 465

#### 4. "Email not received" error
- **Cause**: Email in spam folder or wrong email address
- **Solution**: Check spam folder, verify email address

### Debug Steps

1. **Check environment variables**
   ```bash
   node -e "console.log(process.env.EMAIL_USER, process.env.EMAIL_APP_PASSWORD)"
   ```

2. **Test email service directly**
   ```bash
   node test-email-setup.js
   ```

3. **Check server logs**
   - Look for email service initialization messages
   - Check for SMTP connection errors
   - Verify email sending attempts

4. **Verify Gmail settings**
   - Ensure 2FA is enabled
   - Check App Password is correct
   - Verify account is not locked

## 📊 Production Considerations

### For Production Deployment

1. **Use environment variables** (never commit credentials)
2. **Consider email service providers** like SendGrid or AWS SES for higher volume
3. **Monitor email delivery rates** and bounces
4. **Set up email templates** in your email service provider
5. **Implement email queuing** for high-volume scenarios

### Alternative Email Services

If Gmail doesn't work for your use case, you can modify the email service to use:

- **SendGrid**: Professional email service with templates
- **AWS SES**: Amazon's email service with high deliverability
- **Mailgun**: Developer-friendly email API
- **Outlook/Hotmail**: Microsoft's email service

## ✅ Verification Checklist

- [ ] Gmail 2FA enabled
- [ ] App Password generated
- [ ] Environment variables set
- [ ] Test script passes
- [ ] Teacher creation works
- [ ] Email received and formatted correctly
- [ ] Password reset link works
- [ ] Teacher can login after password reset

## 🎉 Success!

Once everything is working, teachers will receive professional welcome emails with secure password reset links, providing a smooth onboarding experience.

---

**Need Help?** Check the troubleshooting section or review the server logs for detailed error messages.