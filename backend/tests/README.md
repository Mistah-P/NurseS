# Teacher Creation with Random Password - Testing Guide

## Overview
This directory contains tests for the new teacher creation functionality that generates random temporary passwords and sends them via email using Firebase Authentication.

## Test Files

### 1. `password-generation.test.js`
**Status: ✅ PASSING**
- Unit tests for the password generation function
- Verifies password strength, uniqueness, and character requirements
- Run with: `npx jest tests/password-generation.test.js`

### 2. `manual-teacher-creation-test.js`
**Status: 📋 MANUAL TEST**
- Functional test that makes actual HTTP requests to your running server
- Tests the complete teacher creation flow including email sending
- **Prerequisites:**
  - Backend server must be running (`npm start`)
  - Valid admin ID in your Firestore database
  - Firebase Authentication configured with email templates

**To run:**
```bash
# 1. Start the backend server
npm start

# 2. In another terminal, run the manual test
node tests/manual-teacher-creation-test.js
```

**Configuration:**
Edit the following variables in `manual-teacher-creation-test.js`:
- `TEST_ADMIN_ID`: Replace with actual admin ID from your database
- `TEST_EMAIL`: Replace with your test email address

### 3. `teacher-creation-email.test.js`
**Status: ⚠️ NEEDS MOCKING FIXES**
- Comprehensive Jest tests with mocking
- Currently has issues with Firebase Admin SDK mocking
- Use the manual test instead for verification

## Implementation Details

### What Changed
1. **Random Password Generation**: Replaced hardcoded "teacher123" with secure random passwords
2. **Email Delivery**: Uses Firebase Auth's `generatePasswordResetLink()` to send emails
3. **Security**: Passwords are never stored or returned in API responses
4. **User Experience**: Teachers receive professional password reset emails

### API Changes
The `POST /api/admin/teachers` endpoint now:
- Generates a random 12-character password with mixed case, numbers, and symbols
- Creates the Firebase Auth user with the random password
- Immediately sends a password reset email
- Returns `emailSent: true` instead of exposing the password
- Stores teacher data in Firestore without the password

### Response Format
```json
{
  "success": true,
  "message": "Teacher account created successfully. Password reset email sent to teacher@example.com",
  "data": {
    "teacherId": "generated-id",
    "name": "Teacher Name",
    "email": "teacher@example.com",
    "userType": "teacher",
    "emailSent": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Manual Verification Steps

After running the tests:

1. **Check Email Inbox**: Verify password reset emails are received
2. **Email Content**: Confirm emails have proper branding and working links
3. **Password Reset**: Click the link and set a new password
4. **Login Test**: Try logging in with the new password
5. **Firebase Console**: Verify teacher accounts appear in Authentication
6. **Firestore**: Confirm teacher data is stored correctly (without passwords)

## Security Considerations

✅ **Implemented:**
- Random password generation with high entropy
- No password storage in database or API responses
- Secure email delivery via Firebase Auth
- Proper error handling without information leakage

⚠️ **Note:**
- Teachers must check their email and set a new password before first login
- Password reset links expire according to Firebase Auth settings
- Ensure your Firebase project has email templates configured

## Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Check that `TEST_ADMIN_ID` exists in your database
2. **500 Server Error**: Verify Firebase Admin SDK is properly configured
3. **No Email Received**: Check Firebase Auth email settings and spam folder
4. **Network Errors**: Ensure backend server is running on correct port

### Debug Steps:
1. Check server logs for detailed error messages
2. Verify Firebase project configuration
3. Test with Firebase Console directly
4. Check network connectivity and firewall settings