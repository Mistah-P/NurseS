/**
 * Manual Functional Test for Teacher Creation with Random Password and Email
 * 
 * This script tests the actual implementation by making HTTP requests to the running server.
 * Run this after starting your backend server with: npm start
 * 
 * Usage: node tests/manual-teacher-creation-test.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_ADMIN_ID = 'test-admin-id'; // Replace with actual admin ID from your database
const TEST_EMAIL = 'test.teacher@example.com'; // Replace with your test email

// Test data
const testTeacher = {
  name: 'Test Teacher Manual',
  email: TEST_EMAIL,
  adminId: TEST_ADMIN_ID
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testTeacherCreation() {
  try {
    logInfo('Testing Teacher Creation with Random Password and Email...');
    logInfo(`Server: ${BASE_URL}`);
    logInfo(`Test Email: ${TEST_EMAIL}`);
    logInfo('---');

    // Test 1: Create teacher account
    logInfo('Test 1: Creating teacher account...');
    
    const response = await axios.post(`${BASE_URL}/api/admin/teachers`, testTeacher, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 201) {
      logSuccess('Teacher account created successfully!');
      
      // Verify response structure
      const data = response.data;
      
      if (data.success) {
        logSuccess('Response indicates success');
      } else {
        logError('Response does not indicate success');
      }

      if (data.message && data.message.includes('Password reset email sent')) {
        logSuccess('Success message mentions email sent');
      } else {
        logWarning('Success message does not mention email sent');
      }

      if (data.data && data.data.emailSent === true) {
        logSuccess('Response indicates email was sent');
      } else {
        logWarning('Response does not indicate email was sent');
      }

      // Verify no password in response
      const responseString = JSON.stringify(data);
      if (!responseString.match(/password/i) && !responseString.match(/tempPassword/i)) {
        logSuccess('No password exposed in response (security check passed)');
      } else {
        logError('Password found in response (security issue!)');
      }

      logInfo('Response data:');
      console.log(JSON.stringify(data, null, 2));

    } else {
      logError(`Unexpected status code: ${response.status}`);
    }

  } catch (error) {
    if (error.response) {
      logError(`HTTP Error ${error.response.status}: ${error.response.statusText}`);
      logError('Response data:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      // Common error scenarios
      if (error.response.status === 401) {
        logWarning('Admin authentication failed. Make sure TEST_ADMIN_ID is valid.');
      } else if (error.response.status === 409) {
        logWarning('Teacher already exists. Try with a different email.');
      } else if (error.response.status === 500) {
        logWarning('Server error. Check server logs for details.');
      }
    } else if (error.request) {
      logError('No response received. Is the server running?');
      logError('Make sure to start the server with: npm start');
    } else {
      logError(`Request error: ${error.message}`);
    }
  }
}

async function testMultipleCreations() {
  try {
    logInfo('---');
    logInfo('Test 2: Testing multiple teacher creations for password uniqueness...');
    
    const passwords = [];
    const promises = [];
    
    for (let i = 1; i <= 3; i++) {
      const teacherData = {
        name: `Test Teacher ${i}`,
        email: `test.teacher${i}@example.com`,
        adminId: TEST_ADMIN_ID
      };
      
      promises.push(
        axios.post(`${BASE_URL}/api/admin/teachers`, teacherData, {
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => ({ error: err, index: i }))
      );
    }
    
    const results = await Promise.all(promises);
    let successCount = 0;
    
    results.forEach((result, index) => {
      if (result.error) {
        logWarning(`Teacher ${index + 1} creation failed: ${result.error.response?.status || 'Network error'}`);
      } else if (result.status === 201) {
        successCount++;
        logSuccess(`Teacher ${index + 1} created successfully`);
      }
    });
    
    if (successCount > 0) {
      logSuccess(`${successCount} teachers created successfully`);
      logInfo('Note: Each teacher should have received a unique password via email');
    }
    
  } catch (error) {
    logError(`Multiple creation test failed: ${error.message}`);
  }
}

async function runTests() {
  log('🧪 Manual Teacher Creation Test Suite', colors.yellow);
  log('=====================================', colors.yellow);
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    logSuccess('Server is running');
  } catch (error) {
    logError('Server is not running or not accessible');
    logError('Please start the server with: npm start');
    return;
  }
  
  await testTeacherCreation();
  await testMultipleCreations();
  
  log('---');
  log('🎯 Manual Verification Steps:', colors.yellow);
  logInfo('1. Check your email inbox for password reset emails');
  logInfo('2. Verify the emails contain the correct branding and links');
  logInfo('3. Click the password reset link and set a new password');
  logInfo('4. Try logging in with the new password');
  logInfo('5. Check Firebase Console to verify teacher accounts were created');
  logInfo('6. Check Firestore to verify teacher data was stored correctly');
  
  log('---');
  log('✨ Test completed!', colors.green);
}

// Run the tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});