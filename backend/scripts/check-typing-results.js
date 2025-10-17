const admin = require('firebase-admin');
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

async function checkTypingResults() {
  try {
    console.log('🔍 Checking typing results data...\n');
    
    // Get recent typing results
    const snapshot = await db.collection('typingResults')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No typing results found in database');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} recent typing results:\n`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Result ID: ${doc.id}`);
      console.log(`   Session Type: ${data.sessionType}`);
      console.log(`   Room ID: ${data.roomId || 'N/A'}`);
      console.log(`   Content Topic: ${data.content?.topic || 'N/A'}`);
      console.log(`   Content Difficulty: ${data.content?.difficulty || 'N/A'}`);
      console.log(`   WPM: ${data.wpm}`);
      console.log(`   Accuracy: ${data.accuracy}%`);
      console.log(`   Timestamp: ${data.timestamp?.toDate?.()?.toISOString() || 'N/A'}`);
      console.log(`   User Email: ${data.userEmail || 'N/A'}`);
      console.log('   ---');
    });
    
    // Check if there are any room-type results
    const roomResults = await db.collection('typingResults')
      .where('sessionType', '==', 'room')
      .limit(5)
      .get();
    
    console.log(`\n🏠 Found ${roomResults.size} room-type results:`);
    roomResults.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Room Result - Topic: ${data.content?.topic}, Difficulty: ${data.content?.difficulty}, Room ID: ${data.roomId}`);
    });
    
    // Check rooms collection to see what data is available
    console.log('\n🏠 Checking rooms collection...');
    const roomsSnapshot = await db.collection('rooms')
      .limit(5)
      .get();
    
    if (!roomsSnapshot.empty) {
      console.log(`📊 Found ${roomsSnapshot.size} rooms:\n`);
      roomsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Room Code: ${data.roomCode}`);
        console.log(`   Module: ${data.module || 'N/A'}`);
        console.log(`   Difficulty: ${data.difficultyLevel || 'N/A'}`);
        console.log(`   Status: ${data.status || 'N/A'}`);
        console.log(`   Created: ${data.createdAt?.toDate?.()?.toISOString() || 'N/A'}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No rooms found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking typing results:', error);
  } finally {
    process.exit(0);
  }
}

checkTypingResults();