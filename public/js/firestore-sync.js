/**
 * Firestore Sync Module
 * 
 * Handles bidirectional sync between IndexedDB (local) and Firestore (cloud)
 * 
 * Architecture:
 * - IndexedDB is the source of truth (offline-first)
 * - Firestore is the cloud backup/sync layer
 * - Syncs only on important events (not GPS updates)
 * - Stays within FREE tier limits
 * 
 * FREE TIER LIMITS:
 * - Reads: 50,000/day (we'll use ~500/day = 1%)
 * - Writes: 20,000/day (we'll use ~200/day = 1%)
 * - Storage: 1 GB (we'll use ~50 MB = 5%)
 */

import { db, isFirebaseConfigured } from './firebase-config.js';
import { getCurrentUser } from './auth.js';
import storage from './storage.js';
import {
  SOCIAL_CONFIG,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  FRIEND_REQUEST_STATUS,
  TRIP_ROLES,
  TRIP_VISIBILITY
} from './config/social-config.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

/**
 * Configuration
 *
 * ⚠️⚠️⚠️ IMPORTANT - DEBUG_MODE REMINDER ⚠️⚠️⚠️
 *
 * DEBUG_MODE is currently: false (PRODUCTION MODE - REAL FIRESTORE WRITES!)
 *
 * TODO: Set DEBUG_MODE = true during development to prevent excessive API calls!
 * TODO: Set DEBUG_MODE = false before deploying to production!
 *
 * When DEBUG_MODE = true:
 *   - Logs all sync operations to console
 *   - Does NOT write to Firestore (saves reads/writes)
 *   - Perfect for testing without API costs
 *
 * When DEBUG_MODE = false:
 *   - Real Firestore sync enabled
 *   - Writes to cloud database
 *   - Use for production/testing actual sync
 */
const DEBUG_MODE = false; // ⚠️ TODO: Set to true during development!
const ENABLE_SYNC = !DEBUG_MODE; // Sync is disabled in debug mode
const SYNC_DEBOUNCE_MS = 5000; // Wait 5 seconds before syncing settings changes

/**
 * Sync state
 */
let syncEnabled = ENABLE_SYNC;
let syncInProgress = false;
let pendingSyncs = new Set();
let debounceTimers = {};

class FirestoreSync {
  constructor() {
    this.userId = null;
    this.listeners = {
      syncStarted: [],
      syncCompleted: [],
      syncError: []
    };
  }

  /**
   * Initialize sync (call after user logs in)
   */
  async init(user) {
    if (!isFirebaseConfigured()) {
      console.warn('⚠️ Firebase not configured. Sync disabled.');
      return false;
    }

    if (!user) {
      console.warn('⚠️ No user logged in. Sync disabled.');
      return false;
    }

    this.userId = user.uid;
    console.log('🔄 Firestore sync initialized for user:', user.email);

    // Sync user profile
    await this.syncUserProfile(user);

    // Initial sync: pull from Firestore
    await this.pullFromFirestore();

    return true;
  }

  /**
   * Check if sync is enabled
   */
  isSyncEnabled() {
    return syncEnabled && this.userId && navigator.onLine;
  }

  /**
   * Enable/disable sync (for development)
   */
  setSyncEnabled(enabled) {
    syncEnabled = enabled;
    console.log(`🔄 Sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Sync user profile to Firestore
   */
  async syncUserProfile(user) {
    if (!this.isSyncEnabled()) return;

    try {
      const userRef = doc(db, 'users', this.userId);
      const userDoc = await getDoc(userRef);

      const profileData = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLoginAt: serverTimestamp(),
        settings: {
          defaultAutoCenter: true,
          defaultBatterySaver: false,
          theme: 'auto'
        }
      };

      if (!userDoc.exists()) {
        // Create new user profile
        profileData.createdAt = serverTimestamp();
        profileData.stats = {
          totalTrips: 0,
          totalDistance: 0,
          totalTime: 0
        };
        await setDoc(userRef, profileData);
        console.log('✅ User profile created in Firestore');
      } else {
        // Update last login
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp()
        });
        console.log('✅ User profile updated in Firestore');
      }

    } catch (error) {
      console.error('❌ Error syncing user profile:', error);
      this.emit('syncError', { type: 'userProfile', error });
    }
  }

  /**
   * Pull all data from Firestore to IndexedDB
   * (Called on app start when user is logged in)
   */
  async pullFromFirestore() {
    if (!this.isSyncEnabled()) return;

    console.log('⬇️ Pulling data from Firestore...');
    syncInProgress = true;
    this.emit('syncStarted', { direction: 'pull' });

    try {
      // Pull trips
      await this.pullTrips();

      console.log('✅ Pull from Firestore complete');
      this.emit('syncCompleted', { direction: 'pull' });

    } catch (error) {
      console.error('❌ Error pulling from Firestore:', error);
      this.emit('syncError', { type: 'pull', error });
    } finally {
      syncInProgress = false;
    }
  }

  /**
   * Pull trips from Firestore (handles additions, updates, AND deletions)
   */
  async pullTrips() {
    const tripsRef = collection(db, 'users', this.userId, 'trips');
    const snapshot = await getDocs(tripsRef);

    console.log(`📥 Found ${snapshot.size} trips in Firestore for user: ${this.userId}`);

    // Get all local trips for comparison
    const localTrips = await storage.getAllTrips();
    console.log(`📱 Found ${localTrips.length} trips in local IndexedDB`);

    // Create a Set of Firestore trip IDs for quick lookup
    const firestoreTripIds = new Set();

    // Process Firestore trips (add/update)
    for (const docSnap of snapshot.docs) {
      const firestoreTrip = docSnap.data();
      firestoreTripIds.add(firestoreTrip.tripId);

      const localTrip = await storage.getTrip(firestoreTrip.tripId);

      console.log(`🔄 Syncing trip: ${firestoreTrip.tripName} (${firestoreTrip.tripId})`);
      console.log(`   Firestore version: ${firestoreTrip.syncVersion || 0}, Local version: ${localTrip?.syncVersion || 0}`);

      // Check if Firestore version is newer
      if (!localTrip) {
        console.log(`   ➕ Creating new local trip (doesn't exist locally)`);
        await this.updateLocalTrip(firestoreTrip);
        console.log(`   ✅ Created local trip: ${firestoreTrip.tripName}`);
      } else if (this.isNewerVersion(firestoreTrip, localTrip)) {
        console.log(`   🔄 Updating local trip (Firestore is newer)`);
        await this.updateLocalTrip(firestoreTrip);
        console.log(`   ✅ Updated local trip: ${firestoreTrip.tripName}`);
      } else {
        console.log(`   ⏭️  Skipping (local is up-to-date or newer)`);
      }
    }

    // IMPORTANT: Delete local trips that no longer exist in Firestore
    // This handles the case where a trip was deleted on another device
    let deletedCount = 0;
    for (const localTrip of localTrips) {
      if (!firestoreTripIds.has(localTrip.tripId)) {
        // This trip exists locally but NOT in Firestore - it was deleted elsewhere
        console.log(`🗑️ Deleting local trip (deleted from Firestore): ${localTrip.tripName} (${localTrip.tripId})`);
        await storage.deleteTrip(localTrip.tripId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🗑️ Removed ${deletedCount} locally-cached trips that were deleted from Firestore`);
    }

    console.log(`✅ Sync complete. Local trips: ${(await storage.getAllTrips()).length}`);
  }

  /**
   * Push trip to Firestore
   */
  async pushTrip(tripId) {
    if (!this.isSyncEnabled()) {
      if (DEBUG_MODE) {
        console.log(`🐛 [DEBUG] Would sync trip ${tripId} to Firestore (skipped in debug mode)`);
      }
      return;
    }

    try {
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        console.warn(`⚠️ Trip ${tripId} not found in IndexedDB`);
        return;
      }

      // Add sync metadata
      const firestoreTrip = {
        ...trip,
        lastSyncedAt: new Date().toISOString(),
        syncVersion: (trip.syncVersion || 0) + 1
      };

      const tripRef = doc(db, 'users', this.userId, 'trips', tripId);
      await setDoc(tripRef, firestoreTrip);

      // Update local trip with sync metadata
      await storage.updateTrip(tripId, {
        lastSyncedAt: firestoreTrip.lastSyncedAt,
        syncVersion: firestoreTrip.syncVersion
      });

      console.log(`✅ Pushed trip to Firestore: ${trip.tripName}`);

    } catch (error) {
      console.error(`❌ Error pushing trip ${tripId}:`, error);
      this.emit('syncError', { type: 'pushTrip', tripId, error });
    }
  }

  /**
   * Sync trip (called when trip is created or updated)
   */
  async syncTrip(tripId) {
    if (!this.isSyncEnabled()) return;

    // Debounce: don't sync too frequently
    if (pendingSyncs.has(tripId)) {
      console.log(`⏳ Sync already pending for trip ${tripId}`);
      return;
    }

    pendingSyncs.add(tripId);

    try {
      await this.pushTrip(tripId);
    } finally {
      pendingSyncs.delete(tripId);
    }
  }

  /**
   * Sync all trips (called manually or on app start)
   */
  async syncAllTrips() {
    if (!this.isSyncEnabled()) return;

    console.log('🔄 Syncing all trips...');
    const trips = await storage.getAllTrips();

    for (const trip of trips) {
      await this.pushTrip(trip.tripId);
    }

    console.log(`✅ Synced ${trips.length} trips to Firestore`);
  }

  /**
   * Update local trip from Firestore data
   */
  async updateLocalTrip(firestoreTrip) {
    const existingTrip = await storage.getTrip(firestoreTrip.tripId);

    if (existingTrip) {
      // Update existing trip
      await storage.updateTrip(firestoreTrip.tripId, firestoreTrip);
    } else {
      // Create new trip (from another device)
      const transaction = storage.db.transaction(['trips'], 'readwrite');
      const store = transaction.objectStore('trips');
      await store.put(firestoreTrip);
    }
  }

  /**
   * Check if Firestore version is newer than local version
   */
  isNewerVersion(firestoreTrip, localTrip) {
    // Compare sync versions
    const firestoreVersion = firestoreTrip.syncVersion || 0;
    const localVersion = localTrip.syncVersion || 0;

    if (firestoreVersion > localVersion) {
      return true;
    }

    // If versions are equal, compare timestamps
    if (firestoreVersion === localVersion) {
      const firestoreTime = new Date(firestoreTrip.lastSyncedAt || 0).getTime();
      const localTime = new Date(localTrip.lastSyncedAt || 0).getTime();
      return firestoreTime > localTime;
    }

    return false;
  }

  /**
   * Event listener registration
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Delete trip from Firestore
   */
  async deleteTrip(tripId) {
    if (!this.isSyncEnabled()) {
      console.log('🔇 DEBUG MODE: Would delete trip from Firestore:', tripId);
      return;
    }

    try {
      const tripRef = doc(db, 'users', this.userId, 'trips', tripId);
      await deleteDoc(tripRef);
      console.log(`🗑️ Deleted trip from Firestore: ${tripId}`);
    } catch (error) {
      console.error('❌ Error deleting trip from Firestore:', error);
      throw error;
    }
  }

  /**
   * Listen to trips (real-time) - detects additions, updates, and DELETIONS
   * This ensures deleted trips are immediately removed on all devices
   * @param {Function} callback - Callback function (tripId, changeType: 'added'|'modified'|'removed')
   * @returns {Function} Unsubscribe function
   */
  listenToTrips(callback) {
    if (!this.userId) {
      console.warn('Cannot listen to trips: not logged in');
      return () => {};
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would listen to trips');
      return () => {};
    }

    const tripsRef = collection(db, 'users', this.userId, 'trips');

    const unsubscribe = onSnapshot(tripsRef,
      async (snapshot) => {
        // Process document changes
        snapshot.docChanges().forEach(async (change) => {
          const tripData = change.doc.data();
          const tripId = tripData.tripId || change.doc.id;

          if (change.type === 'added') {
            console.log(`🔔 Real-time: Trip added - ${tripData.tripName}`);
            // Add to IndexedDB if not exists
            const localTrip = await storage.getTrip(tripId);
            if (!localTrip) {
              await this.updateLocalTrip(tripData);
              callback?.(tripId, 'added', tripData);
            }
          } else if (change.type === 'modified') {
            console.log(`🔔 Real-time: Trip modified - ${tripData.tripName}`);
            // Update in IndexedDB if Firestore is newer
            const localTrip = await storage.getTrip(tripId);
            if (!localTrip || this.isNewerVersion(tripData, localTrip)) {
              await this.updateLocalTrip(tripData);
              callback?.(tripId, 'modified', tripData);
            }
          } else if (change.type === 'removed') {
            console.log(`🔔 Real-time: Trip DELETED - ${tripData.tripName || tripId}`);
            // DELETE from IndexedDB immediately!
            await storage.deleteTrip(tripId);
            callback?.(tripId, 'removed', tripData);
          }
        });
      },
      (error) => {
        console.error('❌ Error listening to trips:', error);
      }
    );

    console.log('🎧 Started real-time trips listener');
    return unsubscribe;
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // ========================================
  // PHASE 2.4: FRIENDS SYSTEM
  // ========================================

  /**
   * Send friend request to another user
   * @param {string} toUserEmail - Email of user to send request to
   * @param {string} message - Optional message
   * @returns {Promise<{success: boolean, requestId?: string, error?: string}>}
   */
  async sendFriendRequest(toUserEmail, message = '') {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would send friend request to:', toUserEmail);
      return { success: true, requestId: 'debug_request_id' };
    }

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'Not logged in' };
      }

      // Validate email
      if (!toUserEmail || !toUserEmail.includes('@')) {
        return { success: false, error: 'Invalid email address' };
      }

      // Can't send request to self
      if (toUserEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        return { success: false, error: 'Cannot send friend request to yourself' };
      }

      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', toUserEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: 'User not found' };
      }

      const toUserDoc = querySnapshot.docs[0];
      const toUserId = toUserDoc.id;
      const toUserData = toUserDoc.data();

      // Check if already friends
      const friendRef = doc(db, 'users', this.userId, 'friends', toUserId);
      const friendDoc = await getDoc(friendRef);
      if (friendDoc.exists()) {
        return { success: false, error: 'Already friends with this user' };
      }

      // Check for existing pending request
      const existingRequestQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', this.userId),
        where('toUserId', '==', toUserId),
        where('status', '==', FRIEND_REQUEST_STATUS.PENDING)
      );
      const existingRequests = await getDocs(existingRequestQuery);
      if (!existingRequests.empty) {
        return { success: false, error: 'Friend request already sent' };
      }

      // Check pending requests limit
      const sentRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', this.userId),
        where('status', '==', FRIEND_REQUEST_STATUS.PENDING)
      );
      const sentRequests = await getDocs(sentRequestsQuery);
      if (sentRequests.size >= SOCIAL_CONFIG.MAX_PENDING_REQUESTS) {
        return { success: false, error: 'Too many pending requests. Please wait for responses.' };
      }

      // Create friend request
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + SOCIAL_CONFIG.REQUEST_EXPIRY_DAYS);

      const requestData = {
        requestId,
        fromUserId: this.userId,
        fromUserEmail: currentUser.email,
        fromUserName: currentUser.displayName || currentUser.email.split('@')[0],
        fromUserPhotoURL: currentUser.photoURL || '',
        toUserId,
        toUserEmail: toUserData.email,
        status: FRIEND_REQUEST_STATUS.PENDING,
        message: message || '',
        createdAt: serverTimestamp(),
        respondedAt: null,
        expiresAt: Timestamp.fromDate(expiresAt)
      };

      await setDoc(doc(db, 'friendRequests', requestId), requestData);

      // Create notification for recipient
      await this.createNotification(toUserId, {
        type: NOTIFICATION_TYPES.FRIEND_REQUEST,
        priority: NOTIFICATION_PRIORITY.NORMAL,
        title: 'New Friend Request',
        message: `${requestData.fromUserName} sent you a friend request`,
        icon: '👥',
        relatedUserId: this.userId,
        relatedUserName: requestData.fromUserName,
        relatedUserPhotoURL: requestData.fromUserPhotoURL,
        relatedRequestId: requestId,
        actionUrl: '/friends/requests',
        actionType: 'friend_request',
        actionData: { requestId }
      });

      console.log('✅ Friend request sent:', requestId);
      return { success: true, requestId };
    } catch (error) {
      console.error('❌ Error sending friend request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Accept friend request
   * @param {string} requestId - Friend request ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async acceptFriendRequest(requestId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would accept friend request:', requestId);
      return { success: true };
    }

    try {
      // Get request
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        return { success: false, error: 'Friend request not found' };
      }

      const requestData = requestDoc.data();

      // Verify this user is the recipient
      if (requestData.toUserId !== this.userId) {
        return { success: false, error: 'Not authorized to accept this request' };
      }

      // Verify request is still pending
      if (requestData.status !== FRIEND_REQUEST_STATUS.PENDING) {
        return { success: false, error: 'Request is no longer pending' };
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'Not logged in' };
      }

      // U2 creates their own friend document (adding U1 as friend)
      const friend1Data = {
        friendId: requestData.fromUserId,
        friendEmail: requestData.fromUserEmail,
        friendName: requestData.fromUserName,
        friendPhotoURL: requestData.fromUserPhotoURL,
        status: 'accepted',
        createdAt: serverTimestamp(),
        addedAt: serverTimestamp(),
        acceptedAt: serverTimestamp(),
        lastInteraction: serverTimestamp(),
        sharedTripsCount: 0,
        mutualFriends: 0
      };

      await setDoc(doc(db, 'users', this.userId, 'friends', requestData.fromUserId), friend1Data);

      // Update the friend request to 'accepted' status instead of deleting
      // This allows U1 to see it was accepted and create their own friend document
      await updateDoc(requestRef, {
        status: FRIEND_REQUEST_STATUS.ACCEPTED,
        acceptedAt: serverTimestamp(),
        acceptedBy: this.userId
      });

      // Create notification for sender (U1) with special action to trigger friend creation
      const acceptorName = currentUser.displayName || currentUser.email.split('@')[0];
      await this.createNotification(requestData.fromUserId, {
        type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
        priority: NOTIFICATION_PRIORITY.NORMAL,
        title: 'Friend Request Accepted',
        message: `${acceptorName} accepted your friend request`,
        icon: '✅',
        relatedUserId: this.userId,
        relatedUserName: acceptorName,
        relatedUserPhotoURL: currentUser.photoURL || '',
        actionUrl: `/friends/${this.userId}`,
        actionType: 'friend_request_accepted',
        actionData: {
          friendId: this.userId,
          requestId: requestId
        }
      });

      console.log('✅ Friend request accepted:', requestId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error accepting friend request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Decline friend request
   * @param {string} requestId - Friend request ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async declineFriendRequest(requestId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would decline friend request:', requestId);
      return { success: true };
    }

    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        return { success: false, error: 'Friend request not found' };
      }

      const requestData = requestDoc.data();

      if (requestData.toUserId !== this.userId) {
        return { success: false, error: 'Not authorized to decline this request' };
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'Not logged in' };
      }

      // Delete the friend request document
      await deleteDoc(requestRef);

      // Create notification for sender (U1) to inform them of the decline
      await this.createNotification(requestData.fromUserId, {
        type: NOTIFICATION_TYPES.FRIEND_DECLINED,
        priority: NOTIFICATION_PRIORITY.LOW,
        title: 'Friend Request Declined',
        message: `${currentUser.displayName || currentUser.email.split('@')[0]} declined your friend request`,
        icon: '❌',
        relatedUserId: this.userId,
        relatedUserName: currentUser.displayName || currentUser.email.split('@')[0],
        relatedUserPhotoURL: currentUser.photoURL || '',
        actionUrl: '/friends',
        actionType: 'view_friends',
        actionData: {}
      });

      console.log('✅ Friend request declined:', requestId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error declining friend request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel sent friend request
   * @param {string} requestId - Friend request ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async cancelFriendRequest(requestId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would cancel friend request:', requestId);
      return { success: true };
    }

    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        return { success: false, error: 'Friend request not found' };
      }

      const requestData = requestDoc.data();

      if (requestData.fromUserId !== this.userId) {
        return { success: false, error: 'Not authorized to cancel this request' };
      }

      // Delete the friend request document
      await deleteDoc(requestRef);

      // Note: We can't delete the notification from the recipient's collection due to security rules
      // The notification will remain, but the friend request will be gone
      // The UI should handle this by checking if the related request still exists

      console.log('✅ Friend request cancelled:', requestId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelling friend request:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove friend
   * @param {string} friendId - Friend's user ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeFriend(friendId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would remove friend:', friendId);
      return { success: true };
    }

    try {
      // Each user can only delete their own friend document
      // Delete this user's friend document
      await deleteDoc(doc(db, 'users', this.userId, 'friends', friendId));

      // Create a notification for the other user so they know to remove their friend doc
      const currentUser = getCurrentUser();
      if (currentUser) {
        await this.createNotification(friendId, {
          type: 'friend_removed',
          priority: NOTIFICATION_PRIORITY.LOW,
          title: 'Friend Removed',
          message: `${currentUser.displayName || currentUser.email.split('@')[0]} removed you as a friend`,
          icon: '👋',
          relatedUserId: this.userId,
          relatedUserName: currentUser.displayName || currentUser.email.split('@')[0],
          relatedUserPhotoURL: currentUser.photoURL || '',
          actionUrl: '/friends',
          actionType: 'friend_removed',
          actionData: { removedByUserId: this.userId }
        });
      }

      console.log('✅ Friend removed:', friendId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing friend:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all friends
   * @returns {Promise<Array>} Array of friend objects
   */
  async getFriends() {
    if (!this.userId) {
      return [];
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would get friends');
      return [];
    }

    try {
      const friendsRef = collection(db, 'users', this.userId, 'friends');
      const q = query(friendsRef, orderBy('addedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const friends = [];
      querySnapshot.forEach((doc) => {
        friends.push({ id: doc.id, ...doc.data() });
      });

      console.log(`📥 Loaded ${friends.length} friends`);
      return friends;
    } catch (error) {
      console.error('❌ Error getting friends:', error);
      return [];
    }
  }

  /**
   * Get pending friend requests (received)
   * @returns {Promise<Array>} Array of friend request objects
   */
  async getPendingFriendRequests() {
    if (!this.userId) {
      return [];
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would get pending friend requests');
      return [];
    }

    try {
      const requestsRef = collection(db, 'friendRequests');
      const q = query(
        requestsRef,
        where('toUserId', '==', this.userId),
        where('status', '==', FRIEND_REQUEST_STATUS.PENDING),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      console.log(`📥 Loaded ${requests.length} pending friend requests`);
      return requests;
    } catch (error) {
      console.error('❌ Error getting pending friend requests:', error);
      return [];
    }
  }

  /**
   * Get sent friend requests
   * @returns {Promise<Array>} Array of friend request objects
   */
  async getSentFriendRequests() {
    if (!this.userId) {
      return [];
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would get sent friend requests');
      return [];
    }

    try {
      const requestsRef = collection(db, 'friendRequests');
      const q = query(
        requestsRef,
        where('fromUserId', '==', this.userId),
        where('status', '==', FRIEND_REQUEST_STATUS.PENDING),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      console.log(`📥 Loaded ${requests.length} sent friend requests`);
      return requests;
    } catch (error) {
      console.error('❌ Error getting sent friend requests:', error);
      return [];
    }
  }

  /**
   * Listen to pending friend requests (real-time)
   * @param {Function} callback - Callback function to receive updates
   * @returns {Function} Unsubscribe function
   */
  listenToPendingFriendRequests(callback) {
    if (!this.userId) {
      console.warn('Cannot listen to friend requests: not logged in');
      return () => {};
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would listen to pending friend requests');
      callback([]);
      return () => {};
    }

    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('toUserId', '==', this.userId),
      where('status', '==', FRIEND_REQUEST_STATUS.PENDING),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        console.log(`🔔 Real-time: Received ${requests.length} friend requests`);
        callback(requests);
      },
      (error) => {
        console.error('❌ Error listening to friend requests:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * Listen to sent friend requests (real-time)
   * @param {Function} callback - Callback function to receive updates
   * @returns {Function} Unsubscribe function
   */
  listenToSentFriendRequests(callback) {
    if (!this.userId) {
      console.warn('Cannot listen to sent requests: not logged in');
      return () => {};
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would listen to sent friend requests');
      callback([]);
      return () => {};
    }

    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('fromUserId', '==', this.userId),
      where('status', '==', FRIEND_REQUEST_STATUS.PENDING),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        console.log(`🔔 Real-time: Sent ${requests.length} friend requests`);
        callback(requests);
      },
      (error) => {
        console.error('❌ Error listening to sent requests:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * Listen to accepted friend requests and auto-create friend documents
   * This handles the case where U2 accepts a request and U1 needs to create their friend doc
   * @returns {Function} Unsubscribe function
   */
  listenToAcceptedFriendRequests() {
    if (!this.userId) {
      console.warn('Cannot listen to accepted requests: not logged in');
      return () => {};
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would listen to accepted friend requests');
      return () => {};
    }

    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('fromUserId', '==', this.userId),
      where('status', '==', FRIEND_REQUEST_STATUS.ACCEPTED)
    );

    const unsubscribe = onSnapshot(q,
      async (snapshot) => {
        // Process each accepted request
        for (const docSnapshot of snapshot.docs) {
          const requestData = docSnapshot.data();
          const requestId = docSnapshot.id;

          // Check if we already have this friend
          const friendRef = doc(db, 'users', this.userId, 'friends', requestData.toUserId);
          const friendDoc = await getDoc(friendRef);

          if (!friendDoc.exists()) {
            // Get the friend's user data to get their name
            const friendUserRef = doc(db, 'users', requestData.toUserId);
            const friendUserDoc = await getDoc(friendUserRef);

            let friendName = requestData.toUserEmail.split('@')[0]; // Default to email prefix
            let friendPhotoURL = '';

            if (friendUserDoc.exists()) {
              const friendUserData = friendUserDoc.data();
              friendName = friendUserData.displayName || friendUserData.name || friendName;
              friendPhotoURL = friendUserData.photoURL || '';
            }

            // Create friend document for U1
            const friendData = {
              friendId: requestData.toUserId,
              friendEmail: requestData.toUserEmail,
              friendName: friendName,
              friendPhotoURL: friendPhotoURL,
              status: 'accepted',
              createdAt: serverTimestamp(),
              addedAt: serverTimestamp(),
              acceptedAt: serverTimestamp(),
              lastInteraction: serverTimestamp(),
              sharedTripsCount: 0,
              mutualFriends: 0
            };

            await setDoc(friendRef, friendData);
            console.log('✅ Auto-created friend document for accepted request:', requestId);

            // Delete the friend request now that both sides have created their friend docs
            await deleteDoc(docSnapshot.ref);
            console.log('✅ Deleted accepted friend request:', requestId);
          }
        }
      },
      (error) => {
        console.error('❌ Error listening to accepted requests:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Listen to friends list (real-time)
   * @param {Function} callback - Callback function to receive updates
   * @returns {Function} Unsubscribe function
   */
  listenToFriends(callback) {
    if (!this.userId) {
      console.warn('Cannot listen to friends: not logged in');
      return () => {};
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would listen to friends');
      callback([]);
      return () => {};
    }

    const friendsRef = collection(db, 'users', this.userId, 'friends');
    const q = query(friendsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const friends = [];
        snapshot.forEach((doc) => {
          friends.push({ id: doc.id, ...doc.data() });
        });
        console.log(`🔔 Real-time: ${friends.length} friends`);
        callback(friends);
      },
      (error) => {
        console.error('❌ Error listening to friends:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * Listen to friend_removed notifications and auto-delete friend documents
   * This handles the case where U1 removes U2, and U2 needs to auto-remove U1
   * @returns {Function} Unsubscribe function
   */
  listenToFriendRemovedNotifications() {
    if (!this.userId) {
      console.warn('Cannot listen to friend removed notifications: not logged in');
      return () => {};
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would listen to friend removed notifications');
      return () => {};
    }

    const notifsRef = collection(db, 'users', this.userId, 'notifications');
    const q = query(
      notifsRef,
      where('actionType', '==', 'friend_removed'),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q,
      async (snapshot) => {
        // Process each friend_removed notification
        for (const docSnapshot of snapshot.docs) {
          const notifData = docSnapshot.data();
          const removedByUserId = notifData.actionData?.removedByUserId;

          if (removedByUserId) {
            // Delete the friend document
            const friendRef = doc(db, 'users', this.userId, 'friends', removedByUserId);
            try {
              await deleteDoc(friendRef);
              console.log('✅ Auto-removed friend document after being removed:', removedByUserId);

              // Mark the notification as read
              await this.markNotificationAsRead(docSnapshot.id);
            } catch (error) {
              console.error('❌ Error auto-removing friend:', error);
            }
          }
        }
      },
      (error) => {
        console.error('❌ Error listening to friend removed notifications:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Search user by email
   * @param {string} email - Email to search for
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async searchUserByEmail(email) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would search user by email:', email);
      return { success: true, user: { email, displayName: 'Debug User' } };
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: 'User not found' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      return {
        success: true,
        user: {
          userId: userDoc.id,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL
        }
      };
    } catch (error) {
      console.error('❌ Error searching user:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // NOTIFICATIONS SYSTEM
  // ========================================

  /**
   * Create notification for a user
   * @param {string} userId - User ID to send notification to
   * @param {object} notificationData - Notification data
   * @returns {Promise<{success: boolean, notificationId?: string, error?: string}>}
   */
  async createNotification(userId, notificationData) {
    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would create notification for:', userId, notificationData);
      return { success: true, notificationId: 'debug_notification_id' };
    }

    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + SOCIAL_CONFIG.NOTIFICATION_RETENTION_DAYS);

      const notification = {
        notificationId,
        userId,
        type: notificationData.type,
        priority: notificationData.priority || NOTIFICATION_PRIORITY.NORMAL,
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon || '🔔',
        relatedUserId: notificationData.relatedUserId || null,
        relatedUserName: notificationData.relatedUserName || null,
        relatedUserPhotoURL: notificationData.relatedUserPhotoURL || null,
        relatedTripId: notificationData.relatedTripId || null,
        relatedTripName: notificationData.relatedTripName || null,
        relatedRequestId: notificationData.relatedRequestId || null,
        actionUrl: notificationData.actionUrl || null,
        actionType: notificationData.actionType || null,
        actionData: notificationData.actionData || null,
        read: false,
        readAt: null,
        dismissed: false,
        dismissedAt: null,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt)
      };

      await setDoc(doc(db, 'users', userId, 'notifications', notificationId), notification);

      console.log('✅ Notification created:', notificationId);
      return { success: true, notificationId };
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notifications for current user
   * @param {number} limitCount - Maximum number of notifications to fetch
   * @returns {Promise<Array>} Array of notification objects
   */
  async getNotifications(limitCount = SOCIAL_CONFIG.MAX_NOTIFICATIONS_PER_USER) {
    if (!this.userId) {
      return [];
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would get notifications');
      return [];
    }

    try {
      const notificationsRef = collection(db, 'users', this.userId, 'notifications');
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });

      console.log(`📥 Loaded ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications count
   * @returns {Promise<number>} Number of unread notifications
   */
  async getUnreadNotificationsCount() {
    if (!this.userId) {
      return 0;
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would get unread notifications count');
      return 0;
    }

    try {
      const notificationsRef = collection(db, 'users', this.userId, 'notifications');
      const q = query(notificationsRef, where('read', '==', false));
      const querySnapshot = await getDocs(q);

      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting unread notifications count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async markNotificationAsRead(notificationId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would mark notification as read:', notificationId);
      return { success: true };
    }

    try {
      const notificationRef = doc(db, 'users', this.userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });

      console.log('✅ Notification marked as read:', notificationId);
      return { success: true };
    } catch (error) {
      // If the notification was already deleted (e.g., by dismiss), that's OK
      if (error.code === 'not-found' || error.message.includes('No document to update')) {
        console.log('ℹ️ Notification already deleted:', notificationId);
        return { success: true }; // Treat as success since the notification is gone anyway
      }
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  async markAllNotificationsAsRead() {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would mark all notifications as read');
      return { success: true, count: 0 };
    }

    try {
      const notificationsRef = collection(db, 'users', this.userId, 'notifications');
      const q = query(notificationsRef, where('read', '==', false));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();

      console.log(`✅ Marked ${querySnapshot.size} notifications as read`);
      return { success: true, count: querySnapshot.size };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dismiss notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async dismissNotification(notificationId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would dismiss notification:', notificationId);
      return { success: true };
    }

    try {
      const notificationRef = doc(db, 'users', this.userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        dismissed: true,
        dismissedAt: serverTimestamp()
      });

      console.log('✅ Notification dismissed:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error dismissing notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteNotification(notificationId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would delete notification:', notificationId);
      return { success: true };
    }

    try {
      await deleteDoc(doc(db, 'users', this.userId, 'notifications', notificationId));

      console.log('✅ Notification deleted:', notificationId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a friend request exists
   * @param {string} requestId - Friend request ID
   * @returns {Promise<boolean>}
   */
  async checkFriendRequestExists(requestId) {
    if (!requestId) return false;

    if (!ENABLE_SYNC) {
      return true; // In debug mode, assume it exists
    }

    try {
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      return requestDoc.exists();
    } catch (error) {
      // Permission errors mean the document doesn't exist or we can't access it
      // Either way, treat it as "doesn't exist" for UI purposes
      if (error.code === 'permission-denied') {
        return false;
      }
      console.error('❌ Error checking friend request:', error);
      return false;
    }
  }

  /**
   * Clean up orphaned friend request notifications
   * (notifications whose related friend requests no longer exist)
   * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
   */
  async cleanupOrphanedFriendRequestNotifications() {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would cleanup orphaned notifications');
      return { success: true, deletedCount: 0 };
    }

    try {
      // Get all friend request notifications
      const notificationsRef = collection(db, 'users', this.userId, 'notifications');
      const q = query(notificationsRef, where('type', '==', NOTIFICATION_TYPES.FRIEND_REQUEST));
      const querySnapshot = await getDocs(q);

      let deletedCount = 0;
      const deletePromises = [];

      for (const notifDoc of querySnapshot.docs) {
        const notifData = notifDoc.data();
        const requestId = notifData.relatedRequestId;

        if (requestId) {
          // Check if the friend request still exists
          const requestExists = await this.checkFriendRequestExists(requestId);

          if (!requestExists) {
            // Request doesn't exist, delete the notification
            deletePromises.push(deleteDoc(notifDoc.ref));
            deletedCount++;
            console.log(`🗑️ Deleting orphaned notification for request: ${requestId}`);
          }
        }
      }

      await Promise.all(deletePromises);

      console.log(`✅ Cleaned up ${deletedCount} orphaned friend request notifications`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ Error cleaning up orphaned notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup old notifications
   * Called automatically to maintain notification limits
   * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
   */
  async cleanupNotifications() {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would cleanup notifications');
      return { success: true, deletedCount: 0 };
    }

    try {
      const notificationsRef = collection(db, 'users', this.userId, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const now = new Date();
      const batch = writeBatch(db);
      let deletedCount = 0;

      querySnapshot.forEach((doc, index) => {
        const data = doc.data();
        const expiresAt = data.expiresAt?.toDate();

        // Delete if expired or beyond max limit
        if ((expiresAt && expiresAt < now) || index >= SOCIAL_CONFIG.MAX_NOTIFICATIONS_PER_USER) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`🧹 Cleaned up ${deletedCount} old notifications`);
      }

      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // PHASE 2.5: TRIP SHARING & COLLABORATION
  // ========================================

  /**
   * Share trip with a friend
   * @param {string} tripId - Trip ID to share
   * @param {string} friendId - Friend's user ID
   * @param {string} role - Role to assign ('participant' or 'viewer')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async shareTrip(tripId, friendId, role = TRIP_ROLES.PARTICIPANT) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would share trip:', tripId, 'with', friendId, 'as', role);
      return { success: true };
    }

    try {
      // Get trip data
      const tripRef = doc(db, 'users', this.userId, 'trips', tripId);
      const tripDoc = await getDoc(tripRef);

      if (!tripDoc.exists()) {
        return { success: false, error: 'Trip not found' };
      }

      const tripData = tripDoc.data();

      // Verify user is the owner
      if (tripData.owner && tripData.owner !== this.userId) {
        return { success: false, error: 'Only trip owner can share trips' };
      }

      // Get friend data
      const friendRef = doc(db, 'users', this.userId, 'friends', friendId);
      const friendDoc = await getDoc(friendRef);

      if (!friendDoc.exists()) {
        return { success: false, error: 'Not friends with this user' };
      }

      const friendData = friendDoc.data();

      // Check participant limit
      const participants = tripData.participants || [];
      if (participants.length >= SOCIAL_CONFIG.MAX_TRIP_PARTICIPANTS) {
        return { success: false, error: 'Maximum participants limit reached' };
      }

      // Check if already a participant
      if (participants.some(p => p.userId === friendId)) {
        return { success: false, error: 'User is already a participant' };
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'Not logged in' };
      }

      // Add participant (use Date.now() instead of serverTimestamp() - can't use serverTimestamp inside arrays)
      const now = Date.now();
      const newParticipant = {
        odid: friendId,
        odiduserId: friendId,
        userId: friendId,  // Primary field for lookup
        email: friendData.friendEmail,
        name: friendData.friendName,
        photoURL: friendData.friendPhotoURL,
        role: role,
        status: 'pending', // pending until friend accepts
        addedAt: now,
        addedBy: this.userId,
        lastActive: now
      };

      participants.push(newParticipant);

      // Update trip with new participant
      await updateDoc(tripRef, {
        participants: participants,
        owner: tripData.owner || this.userId,
        visibility: tripData.visibility || TRIP_VISIBILITY.PRIVATE,
        lastActivity: serverTimestamp(),
        lastActivityBy: this.userId
      });

      // Create notification for friend (include all data needed to accept without reading trip)
      await this.createNotification(friendId, {
        type: NOTIFICATION_TYPES.TRIP_SHARED,
        priority: NOTIFICATION_PRIORITY.NORMAL,
        title: 'Trip Shared With You',
        message: `${currentUser.displayName || currentUser.email.split('@')[0]} shared a trip with you: ${tripData.tripName}`,
        icon: '🗺️',
        relatedUserId: this.userId,
        relatedUserName: currentUser.displayName || currentUser.email.split('@')[0],
        relatedUserPhotoURL: currentUser.photoURL || '',
        relatedTripId: tripId,
        relatedTripName: tripData.tripName,
        relatedTripRouteId: tripData.routeId,
        relatedRole: role,  // Role assigned by owner
        actionUrl: `/trips/${tripId}`,
        actionType: 'view_trip',
        actionData: { tripId, role, routeId: tripData.routeId }
      });

      // Update friend's sharedTripsCount
      await updateDoc(friendRef, {
        sharedTripsCount: (friendData.sharedTripsCount || 0) + 1,
        lastInteraction: serverTimestamp()
      });

      console.log('✅ Trip shared with friend:', friendId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sharing trip:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get participants of a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Array>} Array of participants
   */
  async getTripParticipants(tripId) {
    if (!this.userId) {
      console.warn('Cannot get participants: not logged in');
      return [];
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would get participants for trip:', tripId);
      return [];
    }

    try {
      const tripRef = doc(db, 'users', this.userId, 'trips', tripId);
      const tripDoc = await getDoc(tripRef);

      if (!tripDoc.exists()) {
        console.warn('Trip not found:', tripId);
        return [];
      }

      const tripData = tripDoc.data();
      const participants = tripData.participants || [];

      console.log('📋 Raw participants from Firestore:', participants);

      // Format participants for UI (handle legacy field names)
      return participants.map(p => {
        const userId = p.userId || p.odid || p.odId;
        console.log('Mapping participant:', p.name, 'userId:', userId);
        return {
          odid: p.odid || p.odId || p.userId,
          userId: userId,  // Try all possible field names
          userName: p.name || p.userName || 'Unknown',
          userEmail: p.email || p.userEmail || '',
          userPhotoURL: p.photoURL || p.userPhotoURL || '',
          role: p.role || 'active',
          status: p.status || 'pending',
          addedAt: p.addedAt,
          lastActive: p.lastActive
        };
      });
    } catch (error) {
      console.error('❌ Error getting trip participants:', error);
      return [];
    }
  }

  /**
   * Remove participant from trip
   * @param {string} tripId - Trip ID
   * @param {string} participantId - Participant's user ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeParticipant(tripId, participantId) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would remove participant:', participantId, 'from trip:', tripId);
      return { success: true };
    }

    try {
      const tripRef = doc(db, 'users', this.userId, 'trips', tripId);
      const tripDoc = await getDoc(tripRef);

      if (!tripDoc.exists()) {
        return { success: false, error: 'Trip not found' };
      }

      const tripData = tripDoc.data();

      // Verify user is the owner
      if (tripData.owner && tripData.owner !== this.userId) {
        return { success: false, error: 'Only trip owner can remove participants' };
      }

      // Remove participant (check both userId and odid fields for compatibility)
      const participants = (tripData.participants || []).filter(
        p => p.userId !== participantId && p.odid !== participantId
      );

      console.log(`Removing participant ${participantId}. Before: ${tripData.participants?.length || 0}, After: ${participants.length}`);

      await updateDoc(tripRef, {
        participants: participants,
        lastActivity: serverTimestamp(),
        lastActivityBy: this.userId
      });

      console.log('✅ Participant removed from trip:', participantId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Accept a shared trip invitation
   * NOTE: Uses notification data to avoid reading owner's trip (permission issue)
   * @param {string} tripId - Trip ID
   * @param {string} ownerId - Owner's user ID
   * @param {object} notificationData - Data from the notification (tripName, routeId, role, ownerName)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async acceptSharedTrip(tripId, ownerId, notificationData = {}) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would accept shared trip:', tripId);
      return { success: true };
    }

    try {
      // Create a reference in current user's sharedWithMe collection
      // (User has permission to write to their own data)
      // Use data from notification - no need to read owner's trip!
      const sharedRef = doc(db, 'users', this.userId, 'sharedWithMe', tripId);
      await setDoc(sharedRef, {
        tripId: tripId,
        ownerId: ownerId,
        ownerName: notificationData.ownerName || ownerId,
        tripName: notificationData.tripName || 'Shared Trip',
        routeId: notificationData.routeId || '',
        role: notificationData.role || 'active',
        acceptedAt: serverTimestamp(),
        status: 'accepted'
      });

      console.log('✅ Shared trip accepted:', tripId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error accepting shared trip:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Decline a shared trip invitation
   * NOTE: We just don't create a sharedWithMe entry - no need to modify owner's data
   * @param {string} tripId - Trip ID
   * @param {string} ownerId - Owner's user ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async declineSharedTrip(tripId, ownerId, notificationData = {}) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would decline shared trip:', tripId);
      return { success: true };
    }

    try {
      // Delete any existing sharedWithMe entry
      const sharedRef = doc(db, 'users', this.userId, 'sharedWithMe', tripId);
      await deleteDoc(sharedRef).catch(() => {}); // Ignore if doesn't exist

      // Send notification to owner that invitation was declined
      const currentUser = getCurrentUser();
      const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Someone';

      await this.createNotification(ownerId, {
        type: NOTIFICATION_TYPES.TRIP_SHARE_DECLINED,
        priority: NOTIFICATION_PRIORITY.LOW,
        title: 'Invitation Declined',
        message: `${userName} declined your invitation to trip: ${notificationData.tripName || 'Shared Trip'}`,
        icon: '❌',
        relatedUserId: this.userId,
        relatedUserName: userName,
        relatedUserPhotoURL: currentUser?.photoURL || '',
        relatedTripId: tripId,
        relatedTripName: notificationData.tripName || 'Shared Trip',
        actionType: 'remove_participant',
        actionData: { tripId, participantId: this.userId }
      });

      console.log('✅ Shared trip declined, owner notified:', tripId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error declining shared trip:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave a shared trip (participant exits)
   * @param {string} tripId - Trip ID
   * @param {string} ownerId - Owner's user ID
   * @param {string} tripName - Trip name for notification
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async leaveSharedTrip(tripId, ownerId, tripName = 'Shared Trip') {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would leave shared trip:', tripId);
      return { success: true };
    }

    try {
      // Delete sharedWithMe entry
      const sharedRef = doc(db, 'users', this.userId, 'sharedWithMe', tripId);
      await deleteDoc(sharedRef);

      // Send notification to owner
      const currentUser = getCurrentUser();
      const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Someone';

      await this.createNotification(ownerId, {
        type: NOTIFICATION_TYPES.PARTICIPANT_LEFT,
        priority: NOTIFICATION_PRIORITY.NORMAL,
        title: 'Participant Left',
        message: `${userName} left the shared trip: ${tripName}`,
        icon: '👋',
        relatedUserId: this.userId,
        relatedUserName: userName,
        relatedUserPhotoURL: currentUser?.photoURL || '',
        relatedTripId: tripId,
        relatedTripName: tripName,
        actionType: 'remove_participant',
        actionData: { tripId, participantId: this.userId }
      });

      console.log('✅ Left shared trip, owner notified:', tripId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error leaving shared trip:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get trips shared with current user (from sharedWithMe collection)
   * @returns {Promise<Array>} Array of shared trip objects
   */
  async getSharedTrips() {
    if (!this.userId) {
      return [];
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would get shared trips');
      return [];
    }

    try {
      // Get from user's sharedWithMe collection (efficient query)
      const sharedRef = collection(db, 'users', this.userId, 'sharedWithMe');
      const snapshot = await getDocs(sharedRef);

      const sharedTrips = [];

      for (const docSnap of snapshot.docs) {
        const sharedData = docSnap.data();

        // Get the actual trip data from owner's collection
        try {
          const tripRef = doc(db, 'users', sharedData.ownerId, 'trips', sharedData.tripId);
          const tripDoc = await getDoc(tripRef);

          if (tripDoc.exists()) {
            const tripData = tripDoc.data();
            const participants = tripData.participants || [];

            // Check if user is still a participant (owner might have removed them)
            const isStillParticipant = participants.some(
              p => p.userId === this.userId || p.odid === this.userId
            );

            if (isStillParticipant) {
              sharedTrips.push({
                id: sharedData.tripId,
                tripId: sharedData.tripId,
                ownerId: sharedData.ownerId,
                ownerName: sharedData.ownerName,
                role: sharedData.role,
                status: sharedData.status,
                isShared: true, // Flag to indicate this is a shared trip
                ...tripData
              });
            } else {
              // User was removed from trip - clean up stale sharedWithMe entry
              console.log(`🗑️ Cleaning up stale shared trip (removed by owner): ${sharedData.tripId}`);
              await deleteDoc(docSnap.ref);
            }
          } else {
            // Trip was deleted - clean up stale sharedWithMe entry
            console.log(`🗑️ Cleaning up stale shared trip (trip deleted): ${sharedData.tripId}`);
            await deleteDoc(docSnap.ref);
          }
        } catch (err) {
          console.warn('Could not load shared trip:', sharedData.tripId, err);
        }
      }

      console.log(`📥 Loaded ${sharedTrips.length} shared trips (accepted)`);
      return sharedTrips;
    } catch (error) {
      console.error('❌ Error getting shared trips:', error);
      return [];
    }
  }

  /**
   * Update participant role
   * @param {string} tripId - Trip ID
   * @param {string} participantId - Participant's user ID
   * @param {string} newRole - New role ('participant' or 'viewer')
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateParticipantRole(tripId, participantId, newRole) {
    if (!this.userId) {
      return { success: false, error: 'Not logged in' };
    }

    if (!ENABLE_SYNC) {
      console.log('🔄 [DEBUG] Would update participant role:', participantId, 'to', newRole);
      return { success: true };
    }

    try {
      const tripRef = doc(db, 'users', this.userId, 'trips', tripId);
      const tripDoc = await getDoc(tripRef);

      if (!tripDoc.exists()) {
        return { success: false, error: 'Trip not found' };
      }

      const tripData = tripDoc.data();

      // Verify user is the owner
      if (tripData.owner && tripData.owner !== this.userId) {
        return { success: false, error: 'Only trip owner can update participant roles' };
      }

      // Update participant role
      const participants = (tripData.participants || []).map(p => {
        if (p.userId === participantId) {
          return { ...p, role: newRole };
        }
        return p;
      });

      await updateDoc(tripRef, {
        participants: participants,
        lastActivity: serverTimestamp(),
        lastActivityBy: this.userId
      });

      console.log('✅ Participant role updated:', participantId, 'to', newRole);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating participant role:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // PHASE 2.5: SHARED TRIP VIEWING & LOCATION
  // ========================================

  /**
   * Get shared trip info from user's sharedWithMe collection
   * @param {string} tripId - Trip ID
   * @returns {Promise<object|null>} Shared trip info or null
   */
  async getSharedTripInfo(tripId) {
    if (!this.userId) return null;

    try {
      const sharedRef = doc(db, 'users', this.userId, 'sharedWithMe', tripId);
      const sharedDoc = await getDoc(sharedRef);

      if (!sharedDoc.exists()) {
        return null;
      }

      return sharedDoc.data();
    } catch (error) {
      console.error('❌ Error getting shared trip info:', error);
      return null;
    }
  }

  /**
   * Load shared trip data from owner's Firestore
   * @param {string} tripId - Trip ID
   * @param {string} ownerId - Owner's user ID
   * @returns {Promise<object|null>} Trip data or null
   */
  async loadSharedTrip(tripId, ownerId) {
    if (!this.userId) return null;

    try {
      const tripRef = doc(db, 'users', ownerId, 'trips', tripId);
      const tripDoc = await getDoc(tripRef);

      if (!tripDoc.exists()) {
        return null;
      }

      console.log('📥 Loaded shared trip from owner:', ownerId);
      return tripDoc.data();
    } catch (error) {
      console.error('❌ Error loading shared trip:', error);
      return null;
    }
  }

  /**
   * Start broadcasting location to shared trip
   * @param {string} tripId - Trip ID
   * @param {string} ownerId - Owner's user ID
   * @returns {object} Controller with stop() method
   */
  async startLocationBroadcasting(tripId, ownerId) {
    if (!this.userId || !ENABLE_SYNC) {
      return { stop: () => {} };
    }

    let watchId = null;
    let intervalId = null;
    let lastBroadcast = 0;
    const MIN_INTERVAL = 30000; // Min 30 seconds between updates
    const MAX_INTERVAL = 5 * 60 * 1000; // 5 minutes max

    const broadcastLocation = async (position) => {
      const now = Date.now();
      if (now - lastBroadcast < MIN_INTERVAL) return; // Throttle updates

      try {
        const tripRef = doc(db, 'users', ownerId, 'trips', tripId);
        const tripDoc = await getDoc(tripRef);

        if (!tripDoc.exists()) return;

        const tripData = tripDoc.data();
        const participants = tripData.participants || [];

        // Find and update current user's location
        const participantIndex = participants.findIndex(
          p => p.userId === this.userId || p.odid === this.userId
        );

        if (participantIndex !== -1) {
          participants[participantIndex].location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: now
          };
          participants[participantIndex].lastActive = now;
          participants[participantIndex].status = 'online';

          await updateDoc(tripRef, { participants });
          lastBroadcast = now;
          console.log('📍 Location broadcasted');
        }
      } catch (error) {
        console.error('❌ Error broadcasting location:', error);
      }
    };

    // Start watching position
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        broadcastLocation,
        (error) => console.warn('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );

      // Also broadcast every 5 minutes as fallback
      intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(broadcastLocation);
      }, MAX_INTERVAL);

      console.log('🛰️ Location broadcasting started');
    }

    // Broadcast on visibility change (app opened/resumed)
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        navigator.geolocation?.getCurrentPosition(broadcastLocation);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return {
      stop: () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (intervalId) clearInterval(intervalId);
        document.removeEventListener('visibilitychange', visibilityHandler);
        console.log('🛰️ Location broadcasting stopped');
      }
    };
  }

  /**
   * Start receiving other participants' locations
   * @param {string} tripId - Trip ID
   * @param {string} ownerId - Owner's user ID
   * @param {Function} callback - Called with array of participants when locations update
   * @returns {Function} Unsubscribe function
   */
  startLocationReceiving(tripId, ownerId, callback) {
    if (!this.userId || !ENABLE_SYNC) {
      return () => {};
    }

    const tripRef = doc(db, 'users', ownerId, 'trips', tripId);

    const unsubscribe = onSnapshot(tripRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const tripData = docSnap.data();
      const participants = tripData.participants || [];

      // Filter to only participants with location data (excluding self)
      const locatedParticipants = participants
        .filter(p => {
          const isMe = p.userId === this.userId || p.odid === this.userId;
          const hasLocation = p.location && p.location.lat && p.location.lng;
          const isRecent = p.location && (Date.now() - p.location.timestamp < 30 * 60 * 1000); // Within 30 min
          return !isMe && hasLocation && isRecent;
        })
        .slice(0, 8); // Max 8 dots

      console.log(`📡 Received ${locatedParticipants.length} participant locations`);
      callback(locatedParticipants);
    }, (error) => {
      console.error('❌ Error receiving locations:', error);
    });

    console.log('📡 Location receiving started');
    return unsubscribe;
  }
}

// Export singleton instance
const firestoreSync = new FirestoreSync();
export default firestoreSync;

