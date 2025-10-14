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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function createAdminUser() {
  try {
    const adminId = 'admin-001';
    const adminData = {
      name: 'System Administrator',
      email: 'admin@nursescript.com',
      userType: 'admin',
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
      permissions: {
        createTeachers: true,
        manageTeachers: true,
        viewReports: true,
        systemSettings: true
      }
    };

    // Check if admin already exists
    const adminDoc = await db.collection('users').doc(adminId).get();
    
    if (adminDoc.exists) {
      console.log('✅ Admin user already exists');
      console.log('Admin data:', adminDoc.data());
    } else {
      // Create admin user
      await db.collection('users').doc(adminId).set(adminData);
      console.log('✅ Admin user created successfully');
      console.log('Admin ID:', adminId);
      console.log('Admin Email:', adminData.email);
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();