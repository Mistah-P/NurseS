// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC23l35ymdBbukwneaaSLkp5W_i81XZKcY",
  authDomain: "nursescriptfirebase.firebaseapp.com",
  projectId: "nursescriptfirebase",
  storageBucket: "nursescriptfirebase.firebasestorage.app",
  messagingSenderId: "78287123313",
  appId: "1:78287123313:web:1e9ff1a53e86d84dc2fcd0",
  measurementId: "G-ED9T6V7L4D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Authentication

// Export Firebase services
export { app, analytics, db, auth };