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

async function fixTypingResults() {
  try {
    console.log('🔧 Starting typing results migration...\n');
    
    // Get all room-type typing results that need fixing
    const typingResultsSnapshot = await db.collection('typingResults')
      .where('sessionType', '==', 'room')
      .get();
    
    if (typingResultsSnapshot.empty) {
      console.log('❌ No room-type typing results found');
      return;
    }
    
    console.log(`📊 Found ${typingResultsSnapshot.size} room-type typing results to check\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each typing result
    for (const doc of typingResultsSnapshot.docs) {
      const resultData = doc.data();
      const resultId = doc.id;
      const roomId = resultData.roomId;
      
      console.log(`Processing result ${resultId} for room ${roomId}...`);
      
      if (!roomId) {
        console.log(`  ⚠️ Skipping - No room ID found`);
        skippedCount++;
        continue;
      }
      
      try {
        // Find the room by roomCode (not document ID)
        const roomSnapshot = await db.collection('rooms')
          .where('roomCode', '==', roomId)
          .limit(1)
          .get();
        
        if (roomSnapshot.empty) {
          console.log(`  ⚠️ Skipping - Room ${roomId} not found`);
          skippedCount++;
          continue;
        }
        
        const roomData = roomSnapshot.docs[0].data();
        const currentTopic = resultData.content?.topic;
        const currentDifficulty = resultData.content?.difficulty;
        
        // Check if this result needs updating
        const needsUpdate = (
          currentTopic === 'Medical Typing Practice' || 
          currentTopic === 'General Practice' ||
          currentDifficulty === 'Medium'
        );
        
        if (!needsUpdate) {
          console.log(`  ✅ Already correct - Topic: ${currentTopic}, Difficulty: ${currentDifficulty}`);
          skippedCount++;
          continue;
        }
        
        // Update the typing result with correct room data
        const updateData = {
          'content.topic': roomData.module || 'General Practice',
          'content.difficulty': roomData.difficultyLevel || 'Medium',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await doc.ref.update(updateData);
        
        console.log(`  ✅ Updated - Topic: "${currentTopic}" → "${roomData.module}", Difficulty: "${currentDifficulty}" → "${roomData.difficultyLevel}"`);
        updatedCount++;
        
      } catch (error) {
        console.error(`  ❌ Error updating result ${resultId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⚠️ Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total processed: ${typingResultsSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    process.exit(0);
  }
}

// Add confirmation prompt
console.log('🚨 IMPORTANT: This script will update existing typing results in your database.');
console.log('📋 It will change the module and difficulty information for room-based typing results.');
console.log('💾 Make sure you have a backup of your database before proceeding.\n');

// Run the migration
fixTypingResults();