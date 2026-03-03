/**
 * Junction Detector - GPS-based junction proximity detection
 * Detects when user approaches or arrives at route junctions
 */

import { routeLoaderV2 } from './route-loader-v2.js';

class JunctionDetector {
  constructor() {
    this.currentJunction = null;
    this.approachingJunction = null;
    this.lastPosition = null;
    this.detectionRadius = 30; // meters - junction arrival
    this.approachRadius = 100; // meters - junction approach warning
    this.listeners = {
      junctionApproach: [],
      junctionArrival: [],
      junctionDeparture: []
    };
  }

  /**
   * Check current GPS position against junctions
   * @param {Object} position - GPS position {lat, lng, accuracy}
   * @returns {Object} Detection result
   */
  checkPosition(position) {
    if (!routeLoaderV2.route) {
      console.warn('⚠️ No route loaded, cannot detect junctions');
      return { status: 'no_route' };
    }

    const { lat, lng } = position;
    const result = {
      status: 'traveling',
      currentJunction: null,
      approachingJunction: null,
      distance: null,
      availableSegments: []
    };

    // Find nearest junction
    const nearest = routeLoaderV2.findNearestJunction(
      [lat, lng],
      this.approachRadius
    );

    if (!nearest) {
      // No junction nearby - clear state
      if (this.currentJunction) {
        this.handleJunctionDeparture(this.currentJunction);
      }
      this.currentJunction = null;
      this.approachingJunction = null;
      this.lastPosition = position;
      return result;
    }

    const { junction, distance } = nearest;

    // Check if arrived at junction (within detection radius)
    if (distance <= this.detectionRadius) {
      result.status = 'at_junction';
      result.currentJunction = junction;
      result.distance = distance;
      result.availableSegments = this.getAvailableSegments(junction.id);

      // Trigger arrival event if new junction
      if (!this.currentJunction || this.currentJunction.id !== junction.id) {
        this.handleJunctionArrival(junction, distance, result.availableSegments);
      }

      this.currentJunction = junction;
      this.approachingJunction = null;
    }
    // Check if approaching junction (within approach radius)
    else if (distance <= this.approachRadius) {
      result.status = 'approaching_junction';
      result.approachingJunction = junction;
      result.distance = distance;

      // Trigger approach event if new junction
      if (!this.approachingJunction || this.approachingJunction.id !== junction.id) {
        this.handleJunctionApproach(junction, distance);
      }

      this.approachingJunction = junction;
    }

    this.lastPosition = position;
    return result;
  }

  /**
   * Get available outgoing segments from a junction
   * @param {string} junctionId - Junction identifier
   * @returns {Array<Object>} Array of segment objects with metadata
   */
  getAvailableSegments(junctionId) {
    const segments = routeLoaderV2.getOutgoingSegments(junctionId);
    
    return segments.map(segment => {
      const toJunction = routeLoaderV2.getJunction(segment.to);
      return {
        segment,
        destination: toJunction,
        distance: segment.distance,
        estimatedTime: segment.estimatedTime,
        transportMode: segment.transportMode,
        difficulty: segment.difficulty,
        requiresTicket: segment.requiresTicket,
        ticketInfo: segment.ticketInfo
      };
    });
  }

  /**
   * Handle junction approach event
   * @param {Object} junction - Junction object
   * @param {number} distance - Distance to junction in meters
   */
  handleJunctionApproach(junction, distance) {
    console.log(`🔔 Approaching junction: ${junction.name} (${Math.round(distance)}m)`);
    
    this.listeners.junctionApproach.forEach(callback => {
      callback({ junction, distance });
    });
  }

  /**
   * Handle junction arrival event
   * @param {Object} junction - Junction object
   * @param {number} distance - Distance to junction in meters
   * @param {Array} availableSegments - Available outgoing segments
   */
  handleJunctionArrival(junction, distance, availableSegments) {
    console.log(`📍 Arrived at junction: ${junction.name}`, {
      distance: Math.round(distance),
      availableRoutes: availableSegments.length
    });

    this.listeners.junctionArrival.forEach(callback => {
      callback({ junction, distance, availableSegments });
    });
  }

  /**
   * Handle junction departure event
   * @param {Object} junction - Junction object
   */
  handleJunctionDeparture(junction) {
    console.log(`👋 Departed from junction: ${junction.name}`);
    
    this.listeners.junctionDeparture.forEach(callback => {
      callback({ junction });
    });
  }

  /**
   * Register event listener
   * @param {string} event - Event name ('junctionApproach', 'junctionArrival', 'junctionDeparture')
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
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Set custom detection radius
   * @param {number} radius - Detection radius in meters
   */
  setDetectionRadius(radius) {
    this.detectionRadius = radius;
    console.log(`📏 Detection radius set to ${radius}m`);
  }

  /**
   * Set custom approach radius
   * @param {number} radius - Approach radius in meters
   */
  setApproachRadius(radius) {
    this.approachRadius = radius;
    console.log(`📏 Approach radius set to ${radius}m`);
  }

  /**
   * Get current junction state
   * @returns {Object} Current state
   */
  getState() {
    return {
      currentJunction: this.currentJunction,
      approachingJunction: this.approachingJunction,
      lastPosition: this.lastPosition,
      detectionRadius: this.detectionRadius,
      approachRadius: this.approachRadius
    };
  }

  /**
   * Reset detector state
   */
  reset() {
    this.currentJunction = null;
    this.approachingJunction = null;
    this.lastPosition = null;
    console.log('🔄 Junction detector reset');
  }

  /**
   * Check if currently at a junction
   * @returns {boolean}
   */
  isAtJunction() {
    return this.currentJunction !== null;
  }

  /**
   * Check if approaching a junction
   * @returns {boolean}
   */
  isApproachingJunction() {
    return this.approachingJunction !== null;
  }

  /**
   * Get recommended segment from current junction
   * Based on recommended paths in route config
   * @param {string} currentJunctionId - Current junction ID
   * @param {Array<string>} completedSegments - Array of completed segment IDs
   * @returns {Object|null} Recommended segment or null
   */
  getRecommendedSegment(currentJunctionId, completedSegments = []) {
    const availableSegments = this.getAvailableSegments(currentJunctionId);

    if (availableSegments.length === 0) {
      return null;
    }

    // If only one option, return it
    if (availableSegments.length === 1) {
      return availableSegments[0];
    }

    // Check recommended paths
    const recommendedPaths = routeLoaderV2.getAllRecommendedPaths();
    const mainPath = recommendedPaths.find(p => p.tags?.includes('main') || p.tags?.includes('recommended'));

    if (mainPath) {
      // Find next segment in main path that hasn't been completed
      for (const segmentId of mainPath.segments) {
        if (completedSegments.includes(segmentId)) continue;

        const segment = routeLoaderV2.getSegment(segmentId);
        if (segment && segment.from === currentJunctionId) {
          return availableSegments.find(s => s.segment.id === segmentId);
        }
      }
    }

    // Default: return first walking segment
    return availableSegments.find(s => s.transportMode === 'walking') || availableSegments[0];
  }

  /**
   * Calculate ETA to junction based on current speed
   * @param {number} distance - Distance to junction in meters
   * @param {number} speed - Current speed in m/s (optional, defaults to walking speed)
   * @returns {number} ETA in seconds
   */
  calculateETA(distance, speed = null) {
    // Default walking speed: 1.4 m/s (5 km/h)
    const walkingSpeed = 1.4;
    const actualSpeed = speed || walkingSpeed;

    if (actualSpeed === 0) return Infinity;

    return Math.round(distance / actualSpeed);
  }

  /**
   * Format ETA for display
   * @param {number} seconds - ETA in seconds
   * @returns {string} Formatted ETA (e.g., "5 min", "1h 30min")
   */
  formatETA(seconds) {
    if (seconds === Infinity) return 'Unknown';

    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
  }
}

// Export singleton instance
export const junctionDetector = new JunctionDetector();

