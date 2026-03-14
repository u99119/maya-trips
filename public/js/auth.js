/**
 * Authentication Module
 * 
 * Handles user authentication using Firebase Auth
 * Supports: Email/Password, Google Sign-In
 * 
 * FREE TIER: 10,000 users/month (more than enough for personal/family use)
 */

import { auth, isFirebaseConfigured } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

/**
 * Current user state
 */
let currentUser = null;
let authStateListeners = [];

/**
 * Initialize authentication
 */
export function initAuth() {
  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase not configured. Authentication disabled.');
    return;
  }
  
  // Listen for auth state changes
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    console.log('🔐 Auth state changed:', user ? `Logged in as ${user.email}` : 'Logged out');
    
    // Notify all listeners
    authStateListeners.forEach(listener => listener(user));
    
    // Update UI
    updateAuthUI(user);
  });
}

/**
 * Register a listener for auth state changes
 */
export function onAuthChange(callback) {
  authStateListeners.push(callback);
  
  // Immediately call with current state
  if (currentUser !== null) {
    callback(currentUser);
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return currentUser !== null;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Send email verification
    await sendEmailVerification(user);
    
    console.log('✅ User created:', user.email);
    return { success: true, user };
    
  } catch (error) {
    console.error('❌ Sign up error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Signed in:', userCredential.user.email);
    return { success: true, user: userCredential.user };
    
  } catch (error) {
    console.error('❌ Sign in error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Signed in with Google:', result.user.email);
    return { success: true, user: result.user };
    
  } catch (error) {
    console.error('❌ Google sign in error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Sign out
 */
export async function logOut() {
  try {
    await signOut(auth);
    console.log('✅ Signed out');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Sign out error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/weak-password': 'Password is too weak (min 6 characters)',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/popup-closed-by-user': 'Sign-in popup was closed',
    'auth/cancelled-popup-request': 'Sign-in cancelled'
  };
  
  return errorMessages[error.code] || error.message;
}

/**
 * Update auth UI based on user state
 */
function updateAuthUI(user) {
  // This will be called by the main app to update UI elements
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
}

