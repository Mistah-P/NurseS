const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const API_BASE_URL = 'http://localhost:3000/api';

async function testAutomatedFix() {
  try {
    console.log('🧪 Testing automated room typing results fix...\n');
    
    // Step 1: Create a new room with specific module and difficulty
    console.log('📝 Step 1: Creating a new test room...');
    
    const roomData = {
      activityName: "Test Automated Fix",
      section: "BSN-1A", 
      yearLevel: "1st",
      mode: "Timed",
      duration: 5,
      wordCount: null,
      module: "Pediatric Nursing", // Specific module
      difficultyLevel: "Hard", // Specific difficulty
      teacherId: "test-teacher-123",
      teacherName: "Test Teacher"
    };
    
    const roomResponse = await axios.post(`${API_BASE_URL}/rooms`, roomData);
    
    if (!roomResponse.data.success) {
      throw new Error('Failed to create room');
    }
    
    const newRoom = roomResponse.data.data;
    console.log(`✅ Room created successfully!`);
    console.log(`   Room Code: ${newRoom.roomCode}`);
    console.log(`   Module: ${newRoom.module}`);
    console.log(`   Difficulty: ${newRoom.difficultyLevel}`);
    
    // Step 2: Add a student to the room
    console.log('\n👨‍🎓 Step 2: Adding a student to the room...');
    
    const studentData = {
      studentId: "student_test-123",
      studentName: "Test Student",
      email: "test.student@example.com",
      section: "BSN-1A",
      yearLevel: "1st"
    };
    
    const joinResponse = await axios.post(`${API_BASE_URL}/students/join-room`, {
      roomCode: newRoom.roomCode,
      ...studentData
    });
    
    if (!joinResponse.data.success) {
      throw new Error('Failed to join room');
    }
    
    console.log(`✅ Student joined room successfully!`);
    console.log(`   Student ID: ${studentData.studentId}`);
    console.log(`   Student Name: ${studentData.studentName}`);
    
    // Step 3: Simulate a typing result for this room
    console.log('\n📊 Step 3: Simulating a typing test result...');
    
    const typingResultData = {
      userId: studentData.studentId, // Use the student ID that was added to the room
      sessionType: "room",
      roomId: newRoom.roomCode, // This is the key - using the room code
      wpm: 65,
      accuracy: 92,
      duration: 300, // 5 minutes
      wordsTyped: 325,
      errorsCount: 8,
      keystrokeData: {
        totalKeystrokes: 1950,
        correctKeystrokes: 1792,
        backspaces: 158,
        averageSpeed: 65
      },
      content: {
        topic: "This should be overwritten", // This should be replaced by room module
        difficulty: "This should be overwritten", // This should be replaced by room difficulty
        textLength: 1950
      }
    };
    
    const typingResponse = await axios.post(`${API_BASE_URL}/typing-results/save`, typingResultData);
    
    if (!typingResponse.data.success) {
      throw new Error('Failed to save typing result');
    }
    
    console.log(`✅ Typing result saved successfully!`);
    console.log(`   Result ID: ${typingResponse.data.data.resultId}`);
    
    // Step 4: Verify the result has correct module and difficulty
    console.log('\n🔍 Step 4: Verifying the saved result...');
    
    // Wait a moment for the data to be saved
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the saved typing result
    const resultDoc = await db.collection('typingResults').doc(typingResponse.data.data.resultId).get();
    
    if (!resultDoc.exists) {
      throw new Error('Typing result not found in database');
    }
    
    const savedResult = resultDoc.data();
    
    console.log(`📊 Saved typing result details:`);
    console.log(`   Session Type: ${savedResult.sessionType}`);
    console.log(`   Room ID: ${savedResult.roomId}`);
    console.log(`   Content Topic: ${savedResult.content?.topic}`);
    console.log(`   Content Difficulty: ${savedResult.content?.difficulty}`);
    console.log(`   WPM: ${savedResult.wpm}`);
    console.log(`   Accuracy: ${savedResult.accuracy}%`);
    
    // Step 5: Verify the fix worked
    console.log('\n✅ Step 5: Verification Results:');
    
    const expectedModule = "Pediatric Nursing";
    const expectedDifficulty = "Hard";
    const actualModule = savedResult.content?.topic;
    const actualDifficulty = savedResult.content?.difficulty;
    
    if (actualModule === expectedModule && actualDifficulty === expectedDifficulty) {
      console.log(`🎉 SUCCESS! The automated fix is working correctly!`);
      console.log(`   ✅ Module: "${actualModule}" (Expected: "${expectedModule}")`);
      console.log(`   ✅ Difficulty: "${actualDifficulty}" (Expected: "${expectedDifficulty}")`);
      console.log(`\n🔧 This proves that new typing results automatically get the correct module and difficulty from their room!`);
    } else {
      console.log(`❌ FAILED! The fix is not working as expected.`);
      console.log(`   Expected Module: "${expectedModule}", Got: "${actualModule}"`);
      console.log(`   Expected Difficulty: "${expectedDifficulty}", Got: "${actualDifficulty}"`);
    }
    
    // Step 6: Clean up (optional)
    console.log('\n🧹 Step 6: Cleaning up test data...');
    
    // Delete the test room
    await axios.delete(`${API_BASE_URL}/rooms/${newRoom.roomCode}`);
    console.log(`✅ Test room ${newRoom.roomCode} deleted`);
    
    // Delete the test typing result
    await db.collection('typingResults').doc(typingResponse.data.data.resultId).delete();
    console.log(`✅ Test typing result deleted`);
    
    console.log('\n🎯 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    process.exit(0);
  }
}

testAutomatedFix();