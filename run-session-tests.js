#!/usr/bin/env node

/**
 * Session Validation Test Runner
 * 
 * This script runs comprehensive tests to verify that the session validation fix
 * is working correctly. It tests various scenarios including:
 * - Blocking students from joining expired countdown sessions
 * - Blocking students from joining long-running sessions
 * - Allowing students to join fresh sessions
 * - Blocking existing students from rejoining expired sessions
 */

const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Ensure we're in the correct directory
process.chdir(__dirname);

console.log('🔧 Session Validation Test Runner');
console.log('==================================');
console.log('');
console.log('This test will verify that the session validation fix prevents students');
console.log('from joining expired or stale sessions, which was causing the timing issue.');
console.log('');

// Check environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('');
  console.error('Please ensure your .env file contains all required Firebase configuration.');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('');

// Import and run the test suite
const SessionValidationTester = require('./backend/scripts/test-session-validation');

async function runTests() {
  console.log('🚀 Starting session validation tests...');
  console.log('');
  
  const tester = new SessionValidationTester();
  
  try {
    const success = await tester.runAllTests();
    
    if (success) {
      console.log('');
      console.log('🎉 SUCCESS: All session validation tests passed!');
      console.log('');
      console.log('The timing issue fix is working correctly:');
      console.log('✅ Students cannot join expired countdown sessions (>10 minutes)');
      console.log('✅ Students cannot join long-running sessions (>30 minutes)');
      console.log('✅ Students can join fresh, valid sessions');
      console.log('✅ Existing students cannot rejoin expired sessions');
      console.log('');
      console.log('Your application is ready for deployment!');
    } else {
      console.log('');
      console.log('❌ FAILURE: Some session validation tests failed.');
      console.log('');
      console.log('Please review the test results above and fix any issues');
      console.log('before deploying the application.');
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('');
    console.error('❌ Test execution failed:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Test execution interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('🛑 Test execution terminated');
  process.exit(1);
});

// Run the tests
runTests();