// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY || "AIzaSyC23l35ymdBbukwneaaSLkp5W_i81XZKcY",
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || "nursescriptfirebase.firebaseapp.com",
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID || "nursescriptfirebase",
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || "nursescriptfirebase.firebasestorage.app",
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || "78287123313",
  appId: process.env.VUE_APP_FIREBASE_APP_ID || "1:78287123313:web:1e9ff1a53e86d84dc2fcd0",
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID || "G-ED9T6V7L4D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Authentication

// Export Firebase services
export { app, analytics, db, auth, onAuthStateChanged };