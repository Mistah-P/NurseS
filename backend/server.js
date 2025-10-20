const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration for multiple environments
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://nurse-s.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'x-request-id',
    'x-student-id',
    'x-room-code'
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Database reference
const db = admin.firestore();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NurseScript Backend API is running',
    timestamp: new Date().toISOString(),
    firebase: 'Connected'
  });
});

// Routes
const roomsRouter = require('./routes/rooms');
const studentsRouter = require('./routes/students');
const adminRouter = require('./routes/admin');
const liveSessionRouter = require('./routes/liveSession');
const typingResultsRouter = require('./routes/typingResults');
const consultationsRouter = require('./routes/consultations');
const aiRouter = require('./routes/ai');

app.use('/api/rooms', roomsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/live-sessions', liveSessionRouter);
app.use('/api/typing-results', typingResultsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/ai', aiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NurseScript Backend running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Export for testing
module.exports = app;