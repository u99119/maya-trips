/**
 * Storage Module
 * Handles LocalStorage and IndexedDB operations for offline data persistence
 */

const STORAGE_KEYS = {
  ROUTE_STATE: 'route_state',
  VISITED_MILESTONES: 'visited_milestones',
  LAYER_VISIBILITY: 'layer_visibility',
  GPS_SETTINGS: 'gps_settings',
  CURRENT_ROUTE: 'current_route',
  USER_NOTES: 'user_notes',
  CURRENT_TRIP_ID: 'current_trip_id',
  LAST_ROUTE_ID: 'last_route_id'
};

class Storage {
  constructor() {
    this.dbName = 'TravelNavDB';
    this.dbVersion = 2; // Updated to v2 for trip instance support
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized, version:', this.db.version);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        console.log(`Upgrading IndexedDB from v${oldVersion} to v${newVersion}`);

        // V1 Schema: Create initial object stores
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('notes')) {
            const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
            notesStore.createIndex('milestoneId', 'milestoneId', { unique: false });
            notesStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains('photos')) {
            const photosStore = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
            photosStore.createIndex('milestoneId', 'milestoneId', { unique: false });
            photosStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains('routes')) {
            db.createObjectStore('routes', { keyPath: 'id' });
          }
        }

        // V2 Schema: Add trip instance support
        if (oldVersion < 2) {
          // Create trips object store
          if (!db.objectStoreNames.contains('trips')) {
            const tripsStore = db.createObjectStore('trips', { keyPath: 'tripId' });
            tripsStore.createIndex('routeId', 'routeId', { unique: false });
            tripsStore.createIndex('status', 'status', { unique: false });
            tripsStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Update photos store to include tripId
          if (db.objectStoreNames.contains('photos')) {
            const transaction = event.target.transaction;
            const photosStore = transaction.objectStore('photos');

            if (!photosStore.indexNames.contains('tripId')) {
              photosStore.createIndex('tripId', 'tripId', { unique: false });
            }
          }

          // Update notes store to include tripId
          if (db.objectStoreNames.contains('notes')) {
            const transaction = event.target.transaction;
            const notesStore = transaction.objectStore('notes');

            if (!notesStore.indexNames.contains('tripId')) {
              notesStore.createIndex('tripId', 'tripId', { unique: false });
            }
          }

          console.log('V2 schema upgrade complete: trips object store created');
        }
      };
    });
  }

  /**
   * LocalStorage operations
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * @deprecated Route state now stored in trip object
   */
  saveRouteState(routeId, state) {
    const routeStates = this.getItem(STORAGE_KEYS.ROUTE_STATE, {});
    routeStates[routeId] = {
      ...state,
      lastUpdated: Date.now()
    };
    return this.setItem(STORAGE_KEYS.ROUTE_STATE, routeStates);
  }

  /**
   * @deprecated Route state now stored in trip object
   */
  getRouteState(routeId) {
    const routeStates = this.getItem(STORAGE_KEYS.ROUTE_STATE, {});
    return routeStates[routeId] || null;
  }

  /**
   * ========================================
   * LEGACY ROUTE-SCOPED METHODS (v1)
   * ========================================
   * These methods are kept for backward compatibility and migration only.
   * New code should use trip-scoped methods instead.
   * @deprecated Use trip-scoped methods via TripManager
   */

  /**
   * @deprecated Use markMilestoneVisitedForTrip() instead
   */
  markMilestoneVisited(routeId, milestoneId) {
    const visited = this.getVisitedMilestones(routeId);
    if (!visited.includes(milestoneId)) {
      visited.push(milestoneId);
      const allVisited = this.getItem(STORAGE_KEYS.VISITED_MILESTONES, {});
      allVisited[routeId] = visited;
      return this.setItem(STORAGE_KEYS.VISITED_MILESTONES, allVisited);
    }
    return true;
  }

  /**
   * @deprecated Use getVisitedMilestonesForTrip() instead
   */
  getVisitedMilestones(routeId) {
    const allVisited = this.getItem(STORAGE_KEYS.VISITED_MILESTONES, {});
    return allVisited[routeId] || [];
  }

  /**
   * @deprecated Legacy method
   */
  clearVisitedMilestones(routeId) {
    const allVisited = this.getItem(STORAGE_KEYS.VISITED_MILESTONES, {});
    delete allVisited[routeId];
    return this.setItem(STORAGE_KEYS.VISITED_MILESTONES, allVisited);
  }

  /**
   * @deprecated Layer visibility now stored in trip.settings.layerVisibility
   */
  saveLayerVisibility(routeId, layerStates) {
    const allLayers = this.getItem(STORAGE_KEYS.LAYER_VISIBILITY, {});
    allLayers[routeId] = layerStates;
    return this.setItem(STORAGE_KEYS.LAYER_VISIBILITY, allLayers);
  }

  /**
   * @deprecated Layer visibility now stored in trip.settings.layerVisibility
   */
  getLayerVisibility(routeId) {
    const allLayers = this.getItem(STORAGE_KEYS.LAYER_VISIBILITY, {});
    return allLayers[routeId] || {};
  }

  /**
   * @deprecated GPS settings now stored in trip.settings
   */
  saveGPSSettings(settings) {
    return this.setItem(STORAGE_KEYS.GPS_SETTINGS, settings);
  }

  /**
   * @deprecated GPS settings now stored in trip.settings
   */
  getGPSSettings() {
    return this.getItem(STORAGE_KEYS.GPS_SETTINGS, {
      enabled: false,
      batterySaver: false,
      autoCenter: true
    });
  }

  /**
   * ========================================
   * TRIP INSTANCE MANAGEMENT (V2)
   * ========================================
   */

  /**
   * Generate a unique trip ID
   */
  generateTripId() {
    return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new trip instance
   */
  async createTrip(routeId, tripName = null) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tripId = this.generateTripId();
    const now = new Date().toISOString();

    const trip = {
      tripId,
      routeId,
      tripName: tripName || `${routeId} - ${new Date().toLocaleDateString()}`,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      status: 'planned', // 'planned', 'in-progress', 'completed', 'archived'

      visitedMilestones: [],

      settings: {
        gpsEnabled: true,
        batterySaver: false,
        autoCenter: true
      },

      stats: {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0
      }
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trips'], 'readwrite');
      const store = transaction.objectStore('trips');
      const request = store.add(trip);

      request.onsuccess = () => {
        console.log('Trip created:', tripId);
        resolve(trip);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a trip by ID
   */
  async getTrip(tripId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trips'], 'readonly');
      const store = transaction.objectStore('trips');
      const request = store.get(tripId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all trips, optionally filtered
   */
  async getAllTrips(filters = {}) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trips'], 'readonly');
      const store = transaction.objectStore('trips');

      let request;

      if (filters.routeId) {
        const index = store.index('routeId');
        request = index.getAll(filters.routeId);
      } else if (filters.status) {
        const index = store.index('status');
        request = index.getAll(filters.status);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let trips = request.result;

        // Sort by createdAt descending (newest first)
        trips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        resolve(trips);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a trip
   */
  async updateTrip(tripId, updates) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const trip = await this.getTrip(tripId);
        if (!trip) {
          reject(new Error('Trip not found'));
          return;
        }

        const updatedTrip = { ...trip, ...updates };

        const transaction = this.db.transaction(['trips'], 'readwrite');
        const store = transaction.objectStore('trips');
        const request = store.put(updatedTrip);

        request.onsuccess = () => {
          console.log('Trip updated:', tripId);
          resolve(updatedTrip);
        };
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete a trip and all associated data
   */
  async deleteTrip(tripId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['trips', 'photos', 'notes'], 'readwrite');

      // Delete trip
      const tripsStore = transaction.objectStore('trips');
      tripsStore.delete(tripId);

      // Delete associated photos
      const photosStore = transaction.objectStore('photos');
      const photosIndex = photosStore.index('tripId');
      const photosRequest = photosIndex.openCursor(IDBKeyRange.only(tripId));

      photosRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Delete associated notes
      const notesStore = transaction.objectStore('notes');
      const notesIndex = notesStore.index('tripId');
      const notesRequest = notesIndex.openCursor(IDBKeyRange.only(tripId));

      notesRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        console.log('Trip deleted:', tripId);
        resolve(true);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Archive a trip (soft delete)
   */
  async archiveTrip(tripId) {
    return this.updateTrip(tripId, { status: 'archived' });
  }

  /**
   * Start a trip (mark as in-progress)
   */
  async startTrip(tripId) {
    return this.updateTrip(tripId, {
      status: 'in-progress',
      startedAt: new Date().toISOString()
    });
  }

  /**
   * Complete a trip
   */
  async completeTrip(tripId) {
    return this.updateTrip(tripId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Set current active trip
   */
  setCurrentTripId(tripId) {
    return this.setItem(STORAGE_KEYS.CURRENT_TRIP_ID, tripId);
  }

  /**
   * Get current active trip ID
   */
  getCurrentTripId() {
    return this.getItem(STORAGE_KEYS.CURRENT_TRIP_ID, null);
  }

  /**
   * Mark milestone as visited for a specific trip
   */
  async markMilestoneVisitedForTrip(tripId, milestoneId, location = null) {
    const trip = await this.getTrip(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const visitedMilestone = {
      milestoneId,
      visitedAt: new Date().toISOString(),
      location: location || { lat: null, lng: null }
    };

    // Check if already visited
    const alreadyVisited = trip.visitedMilestones.find(m => m.milestoneId === milestoneId);
    if (alreadyVisited) {
      return trip;
    }

    trip.visitedMilestones.push(visitedMilestone);
    return this.updateTrip(tripId, { visitedMilestones: trip.visitedMilestones });
  }

  /**
   * Get visited milestones for a specific trip
   */
  async getVisitedMilestonesForTrip(tripId) {
    const trip = await this.getTrip(tripId);
    return trip ? trip.visitedMilestones : [];
  }

  /**
   * ========================================
   * MIGRATION UTILITIES
   * ========================================
   */

  /**
   * Migrate v1 data to v2 trip instance format
   * Called automatically on first load after upgrade
   */
  async migrateV1ToV2() {
    console.log('Checking for v1 data migration...');

    // Check if migration already done
    const migrationDone = this.getItem('migration_v1_to_v2_done', false);
    if (migrationDone) {
      console.log('Migration already completed');
      return;
    }

    // Check if there's any v1 data to migrate
    const oldVisitedMilestones = this.getItem(STORAGE_KEYS.VISITED_MILESTONES, {});
    const oldLayerVisibility = this.getItem(STORAGE_KEYS.LAYER_VISIBILITY, {});
    const currentRoute = this.getItem(STORAGE_KEYS.CURRENT_ROUTE, null);

    const hasV1Data = Object.keys(oldVisitedMilestones).length > 0 ||
                      Object.keys(oldLayerVisibility).length > 0 ||
                      currentRoute;

    if (!hasV1Data) {
      console.log('No v1 data to migrate');
      this.setItem('migration_v1_to_v2_done', true);
      return;
    }

    console.log('Migrating v1 data to v2 trip instances...');

    // For each route in old data, create a trip instance
    const routeIds = new Set([
      ...Object.keys(oldVisitedMilestones),
      ...Object.keys(oldLayerVisibility),
      currentRoute
    ].filter(Boolean));

    for (const routeId of routeIds) {
      try {
        // Create migrated trip
        const trip = await this.createTrip(routeId, `${routeId} - Migrated Trip`);

        // Migrate visited milestones
        const visitedMilestones = oldVisitedMilestones[routeId] || [];
        if (visitedMilestones.length > 0) {
          trip.visitedMilestones = visitedMilestones.map(milestoneId => ({
            milestoneId,
            visitedAt: new Date().toISOString(),
            location: { lat: null, lng: null }
          }));
          trip.status = 'in-progress';
          await this.updateTrip(trip.tripId, trip);
        }

        // Set as current trip if it was the current route
        if (routeId === currentRoute) {
          this.setCurrentTripId(trip.tripId);
        }

        console.log(`Migrated route ${routeId} to trip ${trip.tripId}`);
      } catch (error) {
        console.error(`Error migrating route ${routeId}:`, error);
      }
    }

    // Mark migration as complete
    this.setItem('migration_v1_to_v2_done', true);
    console.log('Migration complete!');
  }
}

// Export singleton instance
export default new Storage();

