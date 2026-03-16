/**
 * Sync Diagnostic Tool
 * Helps debug sync issues between devices
 */

import { getCurrentUser } from './auth.js';
import firestoreSync from './firestore-sync.js';
import storage from './storage.js';
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

class SyncDiagnostic {
  /**
   * Run full sync diagnostic
   */
  async runDiagnostic() {
    console.log('🔍 ========== SYNC DIAGNOSTIC START ==========');
    
    // 1. Check user
    const user = getCurrentUser();
    if (!user) {
      console.error('❌ No user logged in');
      return {
        success: false,
        error: 'Not logged in'
      };
    }
    
    console.log('✅ User:', user.email, '(UID:', user.uid, ')');
    
    // 2. Check local trips
    const localTrips = await storage.getAllTrips();
    console.log(`📱 Local IndexedDB: ${localTrips.length} trips`);
    localTrips.forEach(trip => {
      console.log(`   - ${trip.tripName} (${trip.tripId})`);
      console.log(`     Status: ${trip.status}, Version: ${trip.syncVersion || 0}, Last synced: ${trip.lastSyncedAt || 'never'}`);
    });
    
    // 3. Check Firestore trips
    try {
      const tripsRef = collection(db, 'users', user.uid, 'trips');
      const snapshot = await getDocs(tripsRef);
      console.log(`☁️  Firestore: ${snapshot.size} trips`);
      
      const firestoreTrips = [];
      snapshot.forEach(doc => {
        const trip = doc.data();
        firestoreTrips.push(trip);
        console.log(`   - ${trip.tripName} (${trip.tripId})`);
        console.log(`     Status: ${trip.status}, Version: ${trip.syncVersion || 0}, Last synced: ${trip.lastSyncedAt || 'never'}`);
      });
      
      // 4. Compare
      console.log('\n🔄 Comparison:');
      
      // Trips in Firestore but not local
      const firestoreTripIds = new Set(firestoreTrips.map(t => t.tripId));
      const localTripIds = new Set(localTrips.map(t => t.tripId));
      
      const missingLocally = firestoreTrips.filter(t => !localTripIds.has(t.tripId));
      const missingInFirestore = localTrips.filter(t => !firestoreTripIds.has(t.tripId));
      
      if (missingLocally.length > 0) {
        console.warn(`⚠️  ${missingLocally.length} trips in Firestore but NOT in local IndexedDB:`);
        missingLocally.forEach(t => console.warn(`   - ${t.tripName} (${t.tripId})`));
      }
      
      if (missingInFirestore.length > 0) {
        console.warn(`⚠️  ${missingInFirestore.length} trips in local IndexedDB but NOT in Firestore:`);
        missingInFirestore.forEach(t => console.warn(`   - ${t.tripName} (${t.tripId})`));
      }
      
      if (missingLocally.length === 0 && missingInFirestore.length === 0) {
        console.log('✅ All trips are synced!');
      }
      
      console.log('🔍 ========== SYNC DIAGNOSTIC END ==========\n');
      
      return {
        success: true,
        user: {
          email: user.email,
          uid: user.uid
        },
        local: {
          count: localTrips.length,
          trips: localTrips.map(t => ({ id: t.tripId, name: t.tripName, version: t.syncVersion || 0 }))
        },
        firestore: {
          count: firestoreTrips.length,
          trips: firestoreTrips.map(t => ({ id: t.tripId, name: t.tripName, version: t.syncVersion || 0 }))
        },
        missingLocally,
        missingInFirestore
      };
      
    } catch (error) {
      console.error('❌ Error accessing Firestore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Force sync all local trips to Firestore
   */
  async forcePushAll() {
    console.log('⬆️  Force pushing all local trips to Firestore...');
    await firestoreSync.syncAllTrips();
    console.log('✅ Force push complete');
  }
  
  /**
   * Force pull all trips from Firestore
   */
  async forcePullAll() {
    console.log('⬇️  Force pulling all trips from Firestore...');
    await firestoreSync.pullFromFirestore();
    console.log('✅ Force pull complete');
  }
  
  /**
   * Fix sync issues by pulling from Firestore
   */
  async fixSync() {
    console.log('🔧 Attempting to fix sync issues...');
    
    // Run diagnostic first
    const diagnostic = await this.runDiagnostic();
    
    if (!diagnostic.success) {
      console.error('❌ Cannot fix sync: diagnostic failed');
      return false;
    }
    
    // Pull from Firestore to get missing trips
    if (diagnostic.missingLocally.length > 0) {
      console.log(`⬇️  Pulling ${diagnostic.missingLocally.length} missing trips from Firestore...`);
      await this.forcePullAll();
    }
    
    // Push to Firestore to sync missing trips
    if (diagnostic.missingInFirestore.length > 0) {
      console.log(`⬆️  Pushing ${diagnostic.missingInFirestore.length} missing trips to Firestore...`);
      await this.forcePushAll();
    }
    
    // Run diagnostic again to verify
    console.log('\n🔍 Verifying fix...');
    const verifyDiagnostic = await this.runDiagnostic();
    
    if (verifyDiagnostic.missingLocally.length === 0 && verifyDiagnostic.missingInFirestore.length === 0) {
      console.log('✅ Sync fixed successfully!');
      return true;
    } else {
      console.error('❌ Sync still has issues after fix attempt');
      return false;
    }
  }
}

// Export singleton
const syncDiagnostic = new SyncDiagnostic();
export default syncDiagnostic;

// Expose globally for console access
window.syncDiagnostic = syncDiagnostic;

