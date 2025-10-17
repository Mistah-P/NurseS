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
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  process.exit(1);
}

const db = admin.firestore();

async function testTodayStatsAPI() {
  console.log('🧪 Testing Today\'s Statistics API...\n');

  try {
    // First, let's check what typing results exist in the database
    console.log('📊 Checking existing typing results...');
    const typingResultsRef = db.collection('typingResults');
    const snapshot = await typingResultsRef.orderBy('timestamp', 'desc').limit(10).get();
    
    if (snapshot.empty) {
      console.log('❌ No typing results found in database');
      return;
    }

    console.log(`Found ${snapshot.size} recent typing results:`);
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate() || new Date(data.createdAt);
      const today = new Date();
      const isToday = timestamp.toDateString() === today.toDateString();
      
      console.log(`${index + 1}. User: ${data.userEmail || data.userId}`);
      console.log(`   Date: ${timestamp.toDateString()} ${timestamp.toTimeString().split(' ')[0]}`);
      console.log(`   Is Today: ${isToday ? '✅' : '❌'}`);
      console.log(`   WPM: ${data.wpm}, Accuracy: ${data.accuracy}%`);
      console.log(`   Content: ${data.content?.topic || 'N/A'} (${data.content?.difficulty || 'N/A'})`);
      console.log('');
    });

    // Test the API endpoint with dateFilter=today
    console.log('🔍 Testing API endpoint with dateFilter=today...');
    
    // Get a user email from the results to test with
    const firstResult = snapshot.docs[0].data();
    const testUserEmail = firstResult.userEmail;
    const testUserId = firstResult.userId;

    if (testUserEmail) {
      console.log(`Testing with user email: ${testUserEmail}`);
      await testAPIEndpoint('email', testUserEmail);
    }

    if (testUserId) {
      console.log(`Testing with user ID: ${testUserId}`);
      await testAPIEndpoint('userId', testUserId);
    }

  } catch (error) {
    console.error('❌ Error testing Today\'s Statistics:', error);
  }
}

async function testAPIEndpoint(type, identifier) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    let url;
    if (type === 'email') {
      url = `http://localhost:3000/api/typing-results/email/${encodeURIComponent(identifier)}?dateFilter=today&limit=100`;
    } else {
      url = `http://localhost:3000/api/typing-results/user/${identifier}?dateFilter=today&limit=100`;
    }

    console.log(`📡 Making API request to: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ API Response successful (${type})`);
      console.log('📋 Full response data:', JSON.stringify(data, null, 2));
      
      // Check if data is an array or has a results property
      const results = Array.isArray(data) ? data : (data.results || data.data || []);
      console.log(`📈 Today's results count: ${results.length}`);
      
      if (results.length > 0) {
        console.log('Today\'s typing results:');
        results.forEach((result, index) => {
          const timestamp = new Date(result.timestamp?.seconds * 1000 || result.createdAt);
          console.log(`  ${index + 1}. ${timestamp.toTimeString().split(' ')[0]} - WPM: ${result.wpm}, Accuracy: ${result.accuracy}%`);
        });
      } else {
        console.log('⚠️  No typing results found for today');
      }
    } else {
      console.log(`❌ API Error (${type}):`, data);
    }
    
    console.log('');
  } catch (error) {
    console.error(`❌ Error testing ${type} endpoint:`, error.message);
  }
}

// Run the test
testTodayStatsAPI().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});