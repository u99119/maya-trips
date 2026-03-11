/**
 * Trip Management Module
 * High-level business logic for trip operations
 */

import storage from './storage.js';

class TripManager {
  constructor() {
    this.currentTrip = null;
    this.routeConfigs = new Map(); // Cache for route configs
  }

  /**
   * Initialize trip manager
   */
  async init() {
    console.log('Initializing Trip Manager...');
    
    // Run migration if needed
    await storage.migrateV1ToV2();
    
    // Load current trip if exists
    const currentTripId = storage.getCurrentTripId();
    if (currentTripId) {
      this.currentTrip = await storage.getTrip(currentTripId);
      console.log('Current trip loaded:', this.currentTrip?.tripName);
    }
    
    return this.currentTrip;
  }

  /**
   * Create a new trip
   */
  async createTrip(routeId, tripName = null, autoStart = false) {
    // Validate route exists
    const routeConfig = await this.loadRouteConfig(routeId);
    if (!routeConfig) {
      throw new Error(`Route not found: ${routeId}`);
    }

    // Generate trip name if not provided
    const finalTripName = tripName || this.generateTripName(routeConfig);

    // Create trip in storage
    const trip = await storage.createTrip(routeId, finalTripName);

    // Auto-start if requested
    if (autoStart) {
      await storage.startTrip(trip.tripId);
      trip.status = 'in-progress';
      trip.startedAt = new Date().toISOString();
    }

    console.log('Trip created:', trip.tripName, trip.tripId);
    return trip;
  }

  /**
   * Generate a default trip name
   */
  generateTripName(routeConfig) {
    const routeName = routeConfig.name || routeConfig.id;
    const date = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    return `${routeName} - ${date}`;
  }

  /**
   * Load route configuration
   */
  async loadRouteConfig(routeId) {
    // Check cache first
    if (this.routeConfigs.has(routeId)) {
      return this.routeConfigs.get(routeId);
    }

    try {
      // Phase 1.7: Check localStorage for imported routes first
      const localStorageKey = `route_config_${routeId}`;
      const localConfig = localStorage.getItem(localStorageKey);

      if (localConfig) {
        try {
          const config = JSON.parse(localConfig);
          this.routeConfigs.set(routeId, config);
          console.log(`✅ Loaded imported route config from localStorage: ${routeId}`);
          return config;
        } catch (parseError) {
          console.warn(`Failed to parse imported route config: ${routeId}`, parseError);
        }
      }

      // Phase 1.6: Try v2 config from file system
      try {
        const v2Response = await fetch(`/routes/${routeId}/config-v2.json`);
        if (v2Response.ok) {
          const config = await v2Response.json();
          this.routeConfigs.set(routeId, config);
          console.log(`✅ Loaded v2 config for route: ${routeId}`);
          return config;
        }
      } catch (v2Error) {
        // v2 not found, try v1
      }

      // Fallback to v1 config
      const response = await fetch(`/routes/${routeId}/config.json`);
      if (!response.ok) {
        throw new Error(`Route config not found: ${routeId}`);
      }
      const config = await response.json();
      this.routeConfigs.set(routeId, config);
      console.log(`✅ Loaded v1 config for route: ${routeId}`);
      return config;
    } catch (error) {
      console.error('Error loading route config:', error);
      return null;
    }
  }

  /**
   * Set active trip
   */
  async setActiveTrip(tripId) {
    const trip = await storage.getTrip(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    this.currentTrip = trip;
    storage.setCurrentTripId(tripId);

    // Auto-start if still in planned status
    if (trip.status === 'planned') {
      await storage.startTrip(tripId);
      this.currentTrip.status = 'in-progress';
      this.currentTrip.startedAt = new Date().toISOString();
    }

    console.log('Active trip set:', trip.tripName);
    return this.currentTrip;
  }

  /**
   * Get current active trip
   */
  getCurrentTrip() {
    return this.currentTrip;
  }

  /**
   * Get all trips, grouped by route
   */
  async getAllTripsGrouped() {
    const allTrips = await storage.getAllTrips();

    const grouped = {};
    for (const trip of allTrips) {
      if (!grouped[trip.routeId]) {
        grouped[trip.routeId] = {
          routeId: trip.routeId,
          routeName: null, // Will be loaded on demand
          trips: []
        };
      }
      grouped[trip.routeId].trips.push(trip);
    }

    // Load route names
    for (const routeId in grouped) {
      const config = await this.loadRouteConfig(routeId);
      if (config) {
        grouped[routeId].routeName = config.name || routeId;
      }
    }

    // Convert object to array
    return Object.values(grouped);
  }

  /**
   * Get trips for a specific route
   */
  async getTripsForRoute(routeId) {
    return storage.getAllTrips({ routeId });
  }

  /**
   * Get trip statistics
   */
  getTripStats(trip) {
    const stats = {
      totalMilestones: 0,
      visitedMilestones: trip.visitedMilestones?.length || 0,
      completionPercentage: 0,
      duration: null,
      status: trip.status
    };

    // Calculate duration if trip has started
    if (trip.startedAt) {
      const start = new Date(trip.startedAt);
      const end = trip.completedAt ? new Date(trip.completedAt) : new Date();
      stats.duration = Math.floor((end - start) / 1000); // Duration in seconds
    }

    return stats;
  }

  /**
   * Mark milestone as visited
   */
  async markMilestoneVisited(milestoneId, location = null) {
    if (!this.currentTrip) {
      throw new Error('No active trip');
    }

    await storage.markMilestoneVisitedForTrip(
      this.currentTrip.tripId,
      milestoneId,
      location
    );

    // Reload current trip to get updated data
    this.currentTrip = await storage.getTrip(this.currentTrip.tripId);

    console.log(`Milestone ${milestoneId} marked as visited`);
    return this.currentTrip;
  }

  /**
   * Check if milestone is visited in current trip
   */
  isMilestoneVisited(milestoneId) {
    if (!this.currentTrip) return false;
    return this.currentTrip.visitedMilestones?.some(m => m.milestoneId === milestoneId) || false;
  }

  /**
   * Get visited milestones for current trip
   */
  getVisitedMilestones() {
    return this.currentTrip?.visitedMilestones || [];
  }

  /**
   * Complete current trip
   */
  async completeCurrentTrip() {
    if (!this.currentTrip) {
      throw new Error('No active trip');
    }

    await storage.completeTrip(this.currentTrip.tripId);
    this.currentTrip.status = 'completed';
    this.currentTrip.completedAt = new Date().toISOString();

    console.log('Trip completed:', this.currentTrip.tripName);
    return this.currentTrip;
  }

  /**
   * Archive a trip
   */
  async archiveTrip(tripId) {
    await storage.archiveTrip(tripId);

    // If archiving current trip, clear it
    if (this.currentTrip?.tripId === tripId) {
      this.currentTrip = null;
      storage.setCurrentTripId(null);
    }

    console.log('Trip archived:', tripId);
  }

  /**
   * Delete a trip
   */
  async deleteTrip(tripId) {
    await storage.deleteTrip(tripId);

    // If deleting current trip, clear it
    if (this.currentTrip?.tripId === tripId) {
      this.currentTrip = null;
      storage.setCurrentTripId(null);
    }

    console.log('Trip deleted:', tripId);
  }

  /**
   * Update trip name
   */
  async updateTripName(tripId, newName) {
    await storage.updateTrip(tripId, { tripName: newName });

    // Update current trip if it's the one being renamed
    if (this.currentTrip?.tripId === tripId) {
      this.currentTrip.tripName = newName;
    }

    console.log('Trip renamed:', newName);
  }

  /**
   * Get trip summary for display
   */
  async getTripSummary(tripId) {
    const trip = await storage.getTrip(tripId);
    if (!trip) return null;

    const routeConfig = await this.loadRouteConfig(trip.routeId);
    const stats = this.getTripStats(trip);

    return {
      tripId: trip.tripId,
      tripName: trip.tripName,
      routeId: trip.routeId,
      routeName: routeConfig?.name || trip.routeId,
      status: trip.status,
      createdAt: trip.createdAt,
      startedAt: trip.startedAt,
      completedAt: trip.completedAt,
      visitedMilestones: stats.visitedMilestones,
      duration: stats.duration,
      hasPhotos: false, // TODO: Implement when photos are added
      hasNotes: false   // TODO: Implement when notes are added
    };
  }

  /**
   * Check if user has any trips
   */
  async hasAnyTrips() {
    const trips = await storage.getAllTrips();
    return trips.length > 0;
  }

  /**
   * Get recent trips (last 5)
   */
  async getRecentTrips(limit = 5) {
    const allTrips = await storage.getAllTrips();
    return allTrips.slice(0, limit);
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds) {
    if (!seconds) return 'Not started';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format date for display
   */
  formatDate(isoString) {
    if (!isoString) return 'N/A';

    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

// Export singleton instance
export default new TripManager();


