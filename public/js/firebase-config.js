/**
 * Firebase Configuration
 * 
 * This file contains Firebase initialization and configuration.
 * 
 * IMPORTANT: Replace the firebaseConfig object with your actual Firebase project credentials.
 * Get these from: Firebase Console > Project Settings > General > Your apps > Web app
 * 
 * FREE TIER LIMITS (as of 2026):
 * - Authentication: 10,000 users/month
 * - Firestore: 1GB storage, 50K reads/day, 20K writes/day, 20K deletes/day
 * - Storage: 5GB storage, 1GB downloads/day, 50K uploads/day
 * - Hosting: 10GB storage, 360MB/day bandwidth
 * 
 * For personal/family use, these limits should be more than sufficient.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

/**
 * Firebase Configuration Object
 * 
 * TODO: Replace with your actual Firebase project credentials
 * Get from: Firebase Console > Project Settings > General > Your apps > Web app
 */
const firebaseConfig = {
  apiKey: "AIzaSyAtOHSBgPtnMSz9IY3X5mbekAgYeHCDHJM",
  authDomain: "maya-family-trips.firebaseapp.com",
  projectId: "maya-family-trips",
  storageBucket: "maya-family-trips.firebasestorage.app",
  messagingSenderId: "536438489502",
  appId: "1:536438489502:web:61a2d3b793f48558d0d68f"
};

/**
 * Initialize Firebase
 */
let app;
let auth;
let db;
let storage;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Enable offline persistence for Firestore (offline-first)
  // This is enabled by default in web, but we'll make it explicit
  console.log('✅ Firebase initialized successfully');
  console.log('📦 Offline persistence enabled (default)');
  
  // Optional: Connect to emulators in development
  // Uncomment these lines if you want to use Firebase emulators for local testing
  // if (window.location.hostname === 'localhost') {
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectStorageEmulator(storage, 'localhost', 9199);
  //   console.log('🔧 Connected to Firebase emulators');
  // }
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Please check your Firebase configuration in firebase-config.js');
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID";
}

/**
 * Get Firebase configuration status
 */
export function getFirebaseStatus() {
  const configured = isFirebaseConfigured();
  return {
    configured,
    message: configured 
      ? '✅ Firebase is configured and ready' 
      : '⚠️ Firebase not configured. Please update firebase-config.js with your project credentials.'
  };
}

// Export Firebase services
export { app, auth, db, storage };

