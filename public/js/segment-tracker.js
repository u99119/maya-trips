/**
 * Segment Tracker - Track user progress along route segments
 * Monitors GPS position, calculates progress, detects segment completion
 */

import { routeLoaderV2 } from './route-loader-v2.js';
import { junctionDetector } from './junction-detector.js';
import storage from './storage.js';

class SegmentTracker {
  constructor() {
    this.currentSegment = null;
    this.segmentStartTime = null;
    this.segmentStartLocation = null;
    this.totalDistance = 0;
    this.pathPoints = []; // GPS points collected during segment
    this.listeners = {
      segmentStarted: [],
      segmentProgress: [],
      segmentCompleted: [],
      segmentAbandoned: []
    };
  }

  /**
   * Start tracking a segment
   * @param {Object} segmentData - Segment data from route-selector
   * @param {string} tripId - Current trip ID
   */
  async startSegment(segmentData, tripId) {
    const { segment, destination } = segmentData;
    
    this.currentSegment = segment;
    this.segmentStartTime = new Date();
    this.segmentStartLocation = null; // Will be set on first GPS update
    this.totalDistance = 0;
    this.pathPoints = [];

    console.log(`🚀 Started tracking segment: ${segment.name}`);
    console.log(`   From: ${segment.from} → To: ${segment.to}`);
    console.log(`   Transport: ${segment.transportMode}`);
    console.log(`   Expected distance: ${segment.distance}m`);

    // Update trip state
    if (tripId) {
      await this.updateTripState(tripId, {
        currentSegment: segment.id,
        currentJunction: null // Left junction, now on segment
      });
    }

    // Trigger event
    this.listeners.segmentStarted.forEach(callback => {
      callback({ segment, destination, startTime: this.segmentStartTime });
    });
  }

  /**
   * Update segment progress with new GPS position
   * @param {Object} position - GPS position {lat, lng, accuracy}
   * @param {string} tripId - Current trip ID
   */
  async updateProgress(position, tripId) {
    if (!this.currentSegment) {
      return null;
    }

    const { lat, lng } = position;

    // Set start location on first update
    if (!this.segmentStartLocation) {
      this.segmentStartLocation = { lat, lng };
    }

    // Add point to path
    this.pathPoints.push({
      lat,
      lng,
      timestamp: new Date().toISOString(),
      accuracy: position.accuracy
    });

    // Calculate distance traveled
    if (this.pathPoints.length > 1) {
      const lastPoint = this.pathPoints[this.pathPoints.length - 2];
      const distance = this.calculateDistance(
        lastPoint.lat, lastPoint.lng,
        lat, lng
      );
      this.totalDistance += distance;
    }

    // Calculate progress percentage
    const progress = Math.min(
      (this.totalDistance / this.currentSegment.distance) * 100,
      100
    );

    // Calculate elapsed time
    const elapsedTime = Math.floor((new Date() - this.segmentStartTime) / 1000);

    // Check if reached destination junction
    const destinationJunction = routeLoaderV2.getJunction(this.currentSegment.to);
    if (destinationJunction) {
      const distanceToEnd = this.calculateDistance(
        lat, lng,
        destinationJunction.location[1], // lat
        destinationJunction.location[0]  // lng
      );

      // If within junction detection radius, complete segment
      const detectionRadius = destinationJunction.proximityRadius || 30;
      if (distanceToEnd <= detectionRadius) {
        await this.completeSegment(tripId, position);
        return {
          status: 'completed',
          progress: 100,
          distanceToEnd: 0
        };
      }

      // Trigger progress event
      const progressData = {
        segment: this.currentSegment,
        progress,
        totalDistance: this.totalDistance,
        elapsedTime,
        distanceToEnd,
        estimatedTimeRemaining: this.calculateETA(distanceToEnd, elapsedTime, this.totalDistance)
      };

      this.listeners.segmentProgress.forEach(callback => {
        callback(progressData);
      });

      return {
        status: 'in-progress',
        ...progressData
      };
    }

    return {
      status: 'in-progress',
      progress,
      totalDistance: this.totalDistance,
      elapsedTime
    };
  }

  /**
   * Complete current segment
   * @param {string} tripId - Current trip ID
   * @param {Object} endLocation - Final GPS position
   */
  async completeSegment(tripId, endLocation) {
    if (!this.currentSegment) {
      return;
    }

    const completedAt = new Date();
    const actualTime = Math.floor((completedAt - this.segmentStartTime) / 1000);

    const segmentData = {
      segmentId: this.currentSegment.id,
      segmentName: this.currentSegment.name,
      from: this.currentSegment.from,
      to: this.currentSegment.to,
      transportMode: this.currentSegment.transportMode,
      startedAt: this.segmentStartTime.toISOString(),
      completedAt: completedAt.toISOString(),
      actualDistance: Math.round(this.totalDistance),
      expectedDistance: this.currentSegment.distance,
      actualTime,
      expectedTime: this.currentSegment.estimatedTime,
      pathPoints: this.pathPoints,
      startLocation: this.segmentStartLocation,
      endLocation: { lat: endLocation.lat, lng: endLocation.lng }
    };

    console.log(`✅ Segment completed: ${this.currentSegment.name}`);
    console.log(`   Distance: ${segmentData.actualDistance}m (expected: ${segmentData.expectedDistance}m)`);
    console.log(`   Time: ${this.formatTime(actualTime)} (expected: ${this.formatTime(segmentData.expectedTime)})`);

    // Save to trip
    if (tripId) {
      await this.addCompletedSegment(tripId, segmentData);
    }

    // Trigger event
    this.listeners.segmentCompleted.forEach(callback => {
      callback(segmentData);
    });

    // Reset state
    const completedSegment = this.currentSegment;
    this.currentSegment = null;
    this.segmentStartTime = null;
    this.segmentStartLocation = null;
    this.totalDistance = 0;
    this.pathPoints = [];

    return segmentData;
  }

  /**
   * Abandon current segment (user went off-route or selected different segment)
   * @param {string} tripId - Current trip ID
   * @param {string} reason - Reason for abandonment
   */
  async abandonSegment(tripId, reason = 'user_action') {
    if (!this.currentSegment) {
      return;
    }

    console.log(`⚠️ Segment abandoned: ${this.currentSegment.name} (${reason})`);

    // Trigger event
    this.listeners.segmentAbandoned.forEach(callback => {
      callback({
        segment: this.currentSegment,
        reason,
        distanceCovered: this.totalDistance
      });
    });

    // Reset state
    this.currentSegment = null;
    this.segmentStartTime = null;
    this.segmentStartLocation = null;
    this.totalDistance = 0;
    this.pathPoints = [];

    // Update trip state
    if (tripId) {
      await this.updateTripState(tripId, {
        currentSegment: null
      });
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate estimated time remaining
   * @param {number} distanceRemaining - Distance to destination in meters
   * @param {number} elapsedTime - Time elapsed in seconds
   * @param {number} distanceCovered - Distance covered in meters
   * @returns {number} Estimated time remaining in seconds
   */
  calculateETA(distanceRemaining, elapsedTime, distanceCovered) {
    if (distanceCovered === 0 || elapsedTime === 0) {
      return null;
    }

    const averageSpeed = distanceCovered / elapsedTime; // m/s
    return Math.round(distanceRemaining / averageSpeed);
  }

  /**
   * Format time in seconds to human-readable string
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Add completed segment to trip
   * @param {string} tripId - Trip ID
   * @param {Object} segmentData - Completed segment data
   */
  async addCompletedSegment(tripId, segmentData) {
    try {
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        console.error('Trip not found:', tripId);
        return;
      }

      // Initialize completedSegments array if not exists
      if (!trip.completedSegments) {
        trip.completedSegments = [];
      }

      // Add segment
      trip.completedSegments.push(segmentData);

      // Update statistics
      trip.stats = trip.stats || {};
      trip.stats.totalDistance = (trip.stats.totalDistance || 0) + segmentData.actualDistance;
      trip.stats.totalTime = (trip.stats.totalTime || 0) + segmentData.actualTime;
      trip.stats.segmentsCompleted = trip.completedSegments.length;

      // Save trip
      await storage.updateTrip(tripId, {
        completedSegments: trip.completedSegments,
        stats: trip.stats,
        currentSegment: null
      });

      console.log(`💾 Saved completed segment to trip ${tripId}`);
    } catch (error) {
      console.error('Error saving completed segment:', error);
    }
  }

  /**
   * Record junction choice in trip
   * @param {string} tripId - Trip ID
   * @param {Object} junctionData - Junction choice data
   */
  async recordJunctionChoice(tripId, junctionData) {
    try {
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        console.error('Trip not found:', tripId);
        return;
      }

      // Initialize junctionChoices array if not exists
      if (!trip.junctionChoices) {
        trip.junctionChoices = [];
      }

      // Add choice
      trip.junctionChoices.push({
        junctionId: junctionData.junctionId,
        junctionName: junctionData.junctionName,
        arrivedAt: new Date().toISOString(),
        chosenSegment: junctionData.chosenSegment,
        availableSegments: junctionData.availableSegments
      });

      // Save trip
      await storage.updateTrip(tripId, {
        junctionChoices: trip.junctionChoices
      });

      console.log(`💾 Recorded junction choice: ${junctionData.junctionName} → ${junctionData.chosenSegment}`);
    } catch (error) {
      console.error('Error recording junction choice:', error);
    }
  }

  /**
   * Update trip current state
   * @param {string} tripId - Trip ID
   * @param {Object} state - State updates
   */
  async updateTripState(tripId, state) {
    try {
      await storage.updateTrip(tripId, state);
      console.log(`💾 Updated trip state:`, state);
    } catch (error) {
      console.error('Error updating trip state:', error);
    }
  }

  /**
   * Get current segment
   * @returns {Object|null} Current segment or null
   */
  getCurrentSegment() {
    return this.currentSegment;
  }

  /**
   * Get segment progress
   * @returns {Object} Progress data
   */
  getProgress() {
    if (!this.currentSegment) {
      return null;
    }

    const elapsedTime = this.segmentStartTime
      ? Math.floor((new Date() - this.segmentStartTime) / 1000)
      : 0;

    const progress = Math.min(
      (this.totalDistance / this.currentSegment.distance) * 100,
      100
    );

    return {
      segment: this.currentSegment,
      progress,
      totalDistance: this.totalDistance,
      elapsedTime,
      pathPoints: this.pathPoints.length
    };
  }

  /**
   * Check if currently tracking a segment
   * @returns {boolean}
   */
  isTracking() {
    return this.currentSegment !== null;
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    } else {
      console.warn(`⚠️ Unknown event: ${event}`);
    }
  }

  /**
   * Unregister event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Reset tracker state
   */
  reset() {
    this.currentSegment = null;
    this.segmentStartTime = null;
    this.segmentStartLocation = null;
    this.totalDistance = 0;
    this.pathPoints = [];
    console.log('🔄 Segment tracker reset');
  }
}

// Export singleton instance
export const segmentTracker = new SegmentTracker();

