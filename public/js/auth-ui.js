/**
 * Authentication UI Handler
 * 
 * Manages the authentication modal and UI interactions
 */

import { 
  initAuth, 
  signUpWithEmail, 
  signInWithEmail, 
  signInWithGoogle, 
  logOut, 
  resetPassword,
  getCurrentUser,
  onAuthChange,
  isLoggedIn
} from './auth.js';
import { isFirebaseConfigured } from './firebase-config.js';

/**
 * Initialize authentication UI
 */
export function initAuthUI() {
  // Check if Firebase is configured
  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase not configured. Hiding auth UI.');
    document.getElementById('authButtonContainer').style.display = 'none';
    return;
  }
  
  // Initialize Firebase Auth
  initAuth();
  
  // Set up event listeners
  setupEventListeners();
  
  // Listen for auth state changes
  onAuthChange(updateAuthButton);
  
  // Listen for custom auth state change events
  window.addEventListener('authStateChanged', (e) => {
    updateAuthButton(e.detail.user);
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Sign In button
  document.getElementById('signInButton')?.addEventListener('click', () => {
    if (isLoggedIn()) {
      // Show user menu (logout option)
      showUserMenu();
    } else {
      openAuthModal('signin');
    }
  });
  
  // Modal close
  document.getElementById('authModalClose')?.addEventListener('click', closeAuthModal);
  
  // Click outside modal to close
  document.getElementById('authModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'authModal') {
      closeAuthModal();
    }
  });
  
  // Tab switching
  document.getElementById('signInTab')?.addEventListener('click', () => switchTab('signin'));
  document.getElementById('signUpTab')?.addEventListener('click', () => switchTab('signup'));
  
  // Sign In form
  document.getElementById('signInForm')?.addEventListener('submit', handleSignIn);
  
  // Sign Up form
  document.getElementById('signUpForm')?.addEventListener('submit', handleSignUp);
  
  // Google Sign In buttons
  document.getElementById('googleSignInBtn')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('googleSignUpBtn')?.addEventListener('click', handleGoogleSignIn);
  
  // Forgot password
  document.getElementById('forgotPasswordLink')?.addEventListener('click', handleForgotPassword);
}

/**
 * Open authentication modal
 */
function openAuthModal(tab = 'signin') {
  document.getElementById('authModal').style.display = 'flex';
  switchTab(tab);
  clearMessages();
}

/**
 * Close authentication modal
 */
function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
  clearMessages();
  clearForms();
}

/**
 * Switch between sign in and sign up tabs
 */
function switchTab(tab) {
  const signInTab = document.getElementById('signInTab');
  const signUpTab = document.getElementById('signUpTab');
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  const modalTitle = document.getElementById('authModalTitle');
  
  if (tab === 'signin') {
    signInTab.classList.add('active');
    signUpTab.classList.remove('active');
    signInForm.style.display = 'block';
    signUpForm.style.display = 'none';
    modalTitle.textContent = 'Sign In';
  } else {
    signInTab.classList.remove('active');
    signUpTab.classList.add('active');
    signInForm.style.display = 'none';
    signUpForm.style.display = 'block';
    modalTitle.textContent = 'Sign Up';
  }
  
  clearMessages();
}

/**
 * Handle sign in
 */
async function handleSignIn(e) {
  e.preventDefault();
  clearMessages();
  
  const email = document.getElementById('signInEmail').value;
  const password = document.getElementById('signInPassword').value;
  
  const result = await signInWithEmail(email, password);
  
  if (result.success) {
    showSuccess('Signed in successfully!');
    setTimeout(closeAuthModal, 1500);
  } else {
    showError(result.error);
  }
}

/**
 * Handle sign up
 */
async function handleSignUp(e) {
  e.preventDefault();
  clearMessages();
  
  const name = document.getElementById('signUpName').value;
  const email = document.getElementById('signUpEmail').value;
  const password = document.getElementById('signUpPassword').value;
  const confirmPassword = document.getElementById('signUpPasswordConfirm').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  
  const result = await signUpWithEmail(email, password, name);
  
  if (result.success) {
    showSuccess('Account created! Please check your email to verify your account.');
    setTimeout(closeAuthModal, 2000);
  } else {
    showError(result.error);
  }
}

/**
 * Handle Google sign in
 */
async function handleGoogleSignIn() {
  clearMessages();

  const result = await signInWithGoogle();

  if (result.success) {
    showSuccess('Signed in with Google!');
    setTimeout(closeAuthModal, 1500);
  } else {
    showError(result.error);
  }
}

/**
 * Handle forgot password
 */
async function handleForgotPassword(e) {
  e.preventDefault();

  const email = document.getElementById('signInEmail').value;

  if (!email) {
    showError('Please enter your email address');
    return;
  }

  const result = await resetPassword(email);

  if (result.success) {
    showSuccess('Password reset email sent! Check your inbox.');
  } else {
    showError(result.error);
  }
}

/**
 * Update auth button based on user state
 */
function updateAuthButton(user) {
  // Update trip selection header button
  const tripSelectionButton = document.getElementById('signInButton');
  if (tripSelectionButton) {
    if (user) {
      // User is logged in
      tripSelectionButton.textContent = user.displayName || user.email.split('@')[0];
      tripSelectionButton.title = user.email;
    } else {
      // User is logged out
      tripSelectionButton.textContent = 'Sign In';
      tripSelectionButton.title = 'Sign in to sync your trips';
    }
  }

  // Update map view header button
  const mapAuthContainer = document.getElementById('mapAuthButtonContainer');
  if (mapAuthContainer) {
    if (user) {
      // User is logged in - show user name and sign out button
      const userName = user.displayName || user.email.split('@')[0];
      mapAuthContainer.innerHTML = `
        <button class="btn btn-secondary map-user-btn" id="mapUserButton" title="${user.email}">
          ${userName}
        </button>
      `;

      // Add click handler for sign out
      const mapUserButton = document.getElementById('mapUserButton');
      if (mapUserButton) {
        mapUserButton.addEventListener('click', showUserMenu);
      }
    } else {
      // User is logged out - show sign in button
      mapAuthContainer.innerHTML = `
        <button class="btn btn-secondary" id="mapSignInButton" style="font-size: 11px; padding: 8px 16px;">
          Sign In
        </button>
      `;

      // Add click handler for sign in
      const mapSignInButton = document.getElementById('mapSignInButton');
      if (mapSignInButton) {
        mapSignInButton.addEventListener('click', () => openAuthModal('signin'));
      }
    }
  }
}

/**
 * Show user menu (logout option)
 */
function showUserMenu() {
  const user = getCurrentUser();

  if (!user) return;

  const confirmed = confirm(`Signed in as ${user.email}\n\nDo you want to sign out?`);

  if (confirmed) {
    handleLogout();
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  const result = await logOut();

  if (result.success) {
    console.log('✅ Logged out successfully');
  } else {
    alert('Error signing out: ' + result.error);
  }
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('authError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';

  // Hide success message
  document.getElementById('authSuccess').style.display = 'none';
}

/**
 * Show success message
 */
function showSuccess(message) {
  const successDiv = document.getElementById('authSuccess');
  successDiv.textContent = message;
  successDiv.style.display = 'block';

  // Hide error message
  document.getElementById('authError').style.display = 'none';
}

/**
 * Clear all messages
 */
function clearMessages() {
  document.getElementById('authError').style.display = 'none';
  document.getElementById('authSuccess').style.display = 'none';
}

/**
 * Clear all forms
 */
function clearForms() {
  document.getElementById('signInForm').reset();
  document.getElementById('signUpForm').reset();
}

