const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_ROOM_CODE = 'TEST01';
const TEST_STUDENT = {
  studentId: 'test-student-001',
  studentName: 'Test Student',
  email: 'test@example.com'
};

class SessionValidationTester {
  constructor() {
    this.testResults = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async recordResult(testName, passed, message) {
    this.testResults.push({ testName, passed, message });
    await this.log(`${testName}: ${passed ? 'PASSED' : 'FAILED'} - ${message}`, passed ? 'success' : 'error');
  }

  async cleanup() {
    try {
      // Clean up test room
      const roomSnapshot = await db.collection('rooms')
        .where('roomCode', '==', TEST_ROOM_CODE)
        .get();

      if (!roomSnapshot.empty) {
        await roomSnapshot.docs[0].ref.delete();
        await this.log('Cleaned up test room');
      }

      // Clean up live session
      const liveSessionRef = db.collection('liveSessions').doc(TEST_ROOM_CODE);
      const liveSessionDoc = await liveSessionRef.get();
      if (liveSessionDoc.exists) {
        await liveSessionRef.delete();
        await this.log('Cleaned up live session');
      }
    } catch (error) {
      await this.log(`Cleanup error: ${error.message}`, 'warning');
    }
  }

  async createTestRoom() {
    try {
      const roomData = {
        roomCode: TEST_ROOM_CODE,
        activityName: 'Session Validation Test',
        mode: 'Timed',
        duration: 60,
        module: 'Test Module',
        difficultyLevel: 'Intermediate',
        status: 'waiting',
        studentsJoined: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('rooms').add(roomData);
      await this.log('Created test room');
      return true;
    } catch (error) {
      await this.log(`Failed to create test room: ${error.message}`, 'error');
      return false;
    }
  }

  async createExpiredCountdownSession() {
    try {
      // Create a live session with countdown started 15 minutes ago (should be expired)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const liveSessionData = {
        roomCode: TEST_ROOM_CODE,
        status: 'countdown',
        countdownStartedAt: admin.firestore.Timestamp.fromDate(fifteenMinutesAgo),
        countdownDuration: 10,
        startedAt: null,
        moduleContent: { text: 'Test content' },
        timeLimit: 60,
        settings: {},
        studentProgress: {},
        leaderboard: [],
        createdAt: admin.firestore.Timestamp.fromDate(fifteenMinutesAgo),
        updatedAt: admin.firestore.Timestamp.fromDate(fifteenMinutesAgo)
      };

      await db.collection('liveSessions').doc(TEST_ROOM_CODE).set(liveSessionData);
      
      // Update room status to active
      const roomSnapshot = await db.collection('rooms')
        .where('roomCode', '==', TEST_ROOM_CODE)
        .get();
      
      if (!roomSnapshot.empty) {
        await roomSnapshot.docs[0].ref.update({
          status: 'active',
          'liveActivity.isActive': true
        });
      }

      await this.log('Created expired countdown session (15 minutes old)');
      return true;
    } catch (error) {
      await this.log(`Failed to create expired countdown session: ${error.message}`, 'error');
      return false;
    }
  }

  async createExpiredActiveSession() {
    try {
      // Create a live session that started 45 minutes ago (should be expired)
      const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000);
      const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000);
      
      const liveSessionData = {
        roomCode: TEST_ROOM_CODE,
        status: 'active',
        countdownStartedAt: admin.firestore.Timestamp.fromDate(fortyFiveMinutesAgo),
        countdownDuration: 10,
        startedAt: admin.firestore.Timestamp.fromDate(thirtyFiveMinutesAgo),
        moduleContent: { text: 'Test content' },
        timeLimit: 60,
        settings: {},
        studentProgress: {},
        leaderboard: [],
        createdAt: admin.firestore.Timestamp.fromDate(fortyFiveMinutesAgo),
        updatedAt: admin.firestore.Timestamp.fromDate(thirtyFiveMinutesAgo)
      };

      await db.collection('liveSessions').doc(TEST_ROOM_CODE).set(liveSessionData);
      
      // Update room status to active
      const roomSnapshot = await db.collection('rooms')
        .where('roomCode', '==', TEST_ROOM_CODE)
        .get();
      
      if (!roomSnapshot.empty) {
        await roomSnapshot.docs[0].ref.update({
          status: 'active',
          'liveActivity.isActive': true
        });
      }

      await this.log('Created expired active session (35 minutes old)');
      return true;
    } catch (error) {
      await this.log(`Failed to create expired active session: ${error.message}`, 'error');
      return false;
    }
  }

  async createFreshSession() {
    try {
      // Create a fresh live session (just started)
      const now = new Date();
      
      const liveSessionData = {
        roomCode: TEST_ROOM_CODE,
        status: 'countdown',
        countdownStartedAt: admin.firestore.Timestamp.fromDate(now),
        countdownDuration: 10,
        startedAt: null,
        moduleContent: { text: 'Test content' },
        timeLimit: 60,
        settings: {},
        studentProgress: {},
        leaderboard: [],
        createdAt: admin.firestore.Timestamp.fromDate(now),
        updatedAt: admin.firestore.Timestamp.fromDate(now)
      };

      await db.collection('liveSessions').doc(TEST_ROOM_CODE).set(liveSessionData);
      
      // Update room status to active
      const roomSnapshot = await db.collection('rooms')
        .where('roomCode', '==', TEST_ROOM_CODE)
        .get();
      
      if (!roomSnapshot.empty) {
        await roomSnapshot.docs[0].ref.update({
          status: 'active',
          'liveActivity.isActive': true
        });
      }

      await this.log('Created fresh session (just started)');
      return true;
    } catch (error) {
      await this.log(`Failed to create fresh session: ${error.message}`, 'error');
      return false;
    }
  }

  async attemptStudentJoin() {
    try {
      const response = await axios.post(`${BASE_URL}/api/students/join-room`, {
        roomCode: TEST_ROOM_CODE,
        studentId: TEST_STUDENT.studentId,
        studentName: TEST_STUDENT.studentName,
        email: TEST_STUDENT.email
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        data: error.response?.data || { error: error.message }
      };
    }
  }

  async testExpiredCountdownBlocking() {
    await this.log('\n🧪 Testing: Expired Countdown Session Blocking');
    
    await this.cleanup();
    
    if (!(await this.createTestRoom())) {
      await this.recordResult('Expired Countdown Test', false, 'Failed to create test room');
      return;
    }

    if (!(await this.createExpiredCountdownSession())) {
      await this.recordResult('Expired Countdown Test', false, 'Failed to create expired countdown session');
      return;
    }

    const result = await this.attemptStudentJoin();
    
    if (!result.success && result.status === 400 && result.data.error === 'Session expired') {
      await this.recordResult('Expired Countdown Test', true, 'Successfully blocked student from joining expired countdown session');
    } else {
      await this.recordResult('Expired Countdown Test', false, `Expected 400 error, got: ${result.status} - ${JSON.stringify(result.data)}`);
    }
  }

  async testExpiredActiveBlocking() {
    await this.log('\n🧪 Testing: Expired Active Session Blocking');
    
    await this.cleanup();
    
    if (!(await this.createTestRoom())) {
      await this.recordResult('Expired Active Test', false, 'Failed to create test room');
      return;
    }

    if (!(await this.createExpiredActiveSession())) {
      await this.recordResult('Expired Active Test', false, 'Failed to create expired active session');
      return;
    }

    const result = await this.attemptStudentJoin();
    
    if (!result.success && result.status === 400 && result.data.error === 'Session expired') {
      await this.recordResult('Expired Active Test', true, 'Successfully blocked student from joining expired active session');
    } else {
      await this.recordResult('Expired Active Test', false, `Expected 400 error, got: ${result.status} - ${JSON.stringify(result.data)}`);
    }
  }

  async testFreshSessionAllowing() {
    await this.log('\n🧪 Testing: Fresh Session Allowing');
    
    await this.cleanup();
    
    if (!(await this.createTestRoom())) {
      await this.recordResult('Fresh Session Test', false, 'Failed to create test room');
      return;
    }

    if (!(await this.createFreshSession())) {
      await this.recordResult('Fresh Session Test', false, 'Failed to create fresh session');
      return;
    }

    const result = await this.attemptStudentJoin();
    
    if (result.success && result.status === 200) {
      await this.recordResult('Fresh Session Test', true, 'Successfully allowed student to join fresh session');
    } else {
      await this.recordResult('Fresh Session Test', false, `Expected 200 success, got: ${result.status} - ${JSON.stringify(result.data)}`);
    }
  }

  async testRejoiningExpiredSession() {
    await this.log('\n🧪 Testing: Rejoining Expired Session Blocking');
    
    await this.cleanup();
    
    if (!(await this.createTestRoom())) {
      await this.recordResult('Rejoining Expired Test', false, 'Failed to create test room');
      return;
    }

    // First, add student to room
    const roomSnapshot = await db.collection('rooms')
      .where('roomCode', '==', TEST_ROOM_CODE)
      .get();
    
    if (!roomSnapshot.empty) {
      await roomSnapshot.docs[0].ref.update({
        studentsJoined: admin.firestore.FieldValue.arrayUnion({
          studentId: TEST_STUDENT.studentId,
          studentName: TEST_STUDENT.studentName,
          email: TEST_STUDENT.email,
          joinedAt: new Date().toISOString(),
          status: 'ready'
        })
      });
    }

    if (!(await this.createExpiredCountdownSession())) {
      await this.recordResult('Rejoining Expired Test', false, 'Failed to create expired session');
      return;
    }

    const result = await this.attemptStudentJoin();
    
    if (!result.success && result.status === 400 && result.data.error === 'Session expired') {
      await this.recordResult('Rejoining Expired Test', true, 'Successfully blocked existing student from rejoining expired session');
    } else {
      await this.recordResult('Rejoining Expired Test', false, `Expected 400 error, got: ${result.status} - ${JSON.stringify(result.data)}`);
    }
  }

  async runAllTests() {
    await this.log('🚀 Starting Session Validation Tests\n');

    await this.testExpiredCountdownBlocking();
    await this.testExpiredActiveBlocking();
    await this.testFreshSessionAllowing();
    await this.testRejoiningExpiredSession();

    await this.cleanup();

    // Print summary
    await this.log('\n📊 TEST SUMMARY');
    await this.log('='.repeat(50));
    
    let passed = 0;
    let failed = 0;

    for (const result of this.testResults) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      await this.log(`${status} ${result.testName}: ${result.message}`);
      
      if (result.passed) passed++;
      else failed++;
    }

    await this.log('='.repeat(50));
    await this.log(`Total Tests: ${this.testResults.length}`);
    await this.log(`Passed: ${passed}`);
    await this.log(`Failed: ${failed}`);
    
    if (failed === 0) {
      await this.log('🎉 ALL TESTS PASSED! Session validation is working correctly.', 'success');
    } else {
      await this.log(`⚠️ ${failed} test(s) failed. Session validation needs attention.`, 'error');
    }

    return failed === 0;
  }
}

// Run tests
async function main() {
  const tester = new SessionValidationTester();
  
  try {
    const allPassed = await tester.runAllTests();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SessionValidationTester;