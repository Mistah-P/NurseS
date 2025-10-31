/**
 * Email Service Test Script
 * 
 * This script helps you test the email service configuration
 * Run with: node test-email-setup.js
 */

require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log('❌ Email configuration incomplete!');
    console.log('\n📝 Setup Instructions:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Set EMAIL_USER to your Gmail address');
    console.log('3. Set EMAIL_APP_PASSWORD to your Gmail App Password');
    console.log('\n🔐 To create Gmail App Password:');
    console.log('1. Go to Google Account settings');
    console.log('2. Enable 2-Factor Authentication');
    console.log('3. Go to Security > App passwords');
    console.log('4. Generate password for "Mail"');
    console.log('5. Use that password in EMAIL_APP_PASSWORD');
    return;
  }

  try {
    // Test email service initialization
    console.log('🔧 Initializing email service...');
    const initialized = await emailService.initialize();
    
    if (!initialized) {
      console.log('❌ Email service initialization failed');
      return;
    }

    console.log('✅ Email service initialized successfully');
    
    // Test sending a sample email
    console.log('\n📧 Testing email sending...');
    
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    const testName = 'Test Teacher';
    const testResetLink = 'https://nursescript.uic.edu.ph/login?reset=test';
    const testPassword = 'TestPass123!';

    const result = await emailService.sendTeacherPasswordResetEmail(
      testEmail,
      testName,
      testResetLink,
      testPassword
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Email sent to: ${result.email}`);
      console.log(`📨 Message ID: ${result.messageId}`);
      console.log('\n🎉 Email service is working correctly!');
      console.log('Check your email inbox for the test message.');
    } else {
      console.log('❌ Test email failed to send');
    }

  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.log('\n🔍 Common Issues:');
    console.log('1. Check Gmail credentials are correct');
    console.log('2. Ensure 2FA is enabled and App Password is used');
    console.log('3. Check internet connection');
    console.log('4. Verify Gmail SMTP is not blocked by firewall');
  }
}

// Run the test
testEmailService().then(() => {
  console.log('\n✨ Email service test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});