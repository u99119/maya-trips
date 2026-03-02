/**
 * GPS Module
 * Handles geolocation tracking and user position updates
 */

class GPS {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.userMarker = null;
    this.accuracyCircle = null;
    this.callbacks = {
      onPositionUpdate: null,
      onError: null
    };
    this.settings = {
      batterySaver: false,
      autoCenter: false // Disabled by default - user can manually center with button
    };
    this.isFirstPosition = true; // Flag to prevent auto-center on first position
  }

  /**
   * Check if geolocation is supported
   */
  isSupported() {
    return 'geolocation' in navigator;
  }

  /**
   * Get geolocation options based on battery saver mode
   */
  getOptions() {
    if (this.settings.batterySaver) {
      return {
        enableHighAccuracy: false,
        maximumAge: 30000, // 30 seconds
        timeout: 20000 // 20 seconds
      };
    }
    
    return {
      enableHighAccuracy: true,
      maximumAge: 10000, // 10 seconds
      timeout: 15000 // 15 seconds
    };
  }

  /**
   * Start watching position
   */
  start(map, onPositionUpdate, onError) {
    if (!this.isSupported()) {
      console.error('Geolocation is not supported');
      if (onError) onError(new Error('Geolocation not supported'));
      return false;
    }

    this.callbacks.onPositionUpdate = onPositionUpdate;
    this.callbacks.onError = onError;
    this.isFirstPosition = true; // Reset flag when starting GPS

    const options = this.getOptions();

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position, map),
      (error) => this.handleError(error),
      options
    );

    return true;
  }

  /**
   * Stop watching position
   */
  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Remove marker and circle from map
    if (this.userMarker && this.userMarker.remove) {
      this.userMarker.remove();
      this.userMarker = null;
    }

    if (this.accuracyCircle && this.accuracyCircle.remove) {
      this.accuracyCircle.remove();
      this.accuracyCircle = null;
    }
  }

  /**
   * Handle position update
   */
  handlePosition(position, map) {
    this.currentPosition = position;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Update or create user marker
    if (!this.userMarker) {
      this.createUserMarker(map, lat, lng);
    } else {
      this.userMarker.setLatLng([lat, lng]);
    }

    // Update or create accuracy circle
    if (!this.accuracyCircle) {
      this.createAccuracyCircle(map, lat, lng, accuracy);
    } else {
      this.accuracyCircle.setLatLng([lat, lng]);
      this.accuracyCircle.setRadius(accuracy);
    }

    // Auto-center map if enabled (but skip on first position to keep route view)
    if (this.settings.autoCenter && !this.isFirstPosition) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }

    // Clear first position flag after first update
    if (this.isFirstPosition) {
      this.isFirstPosition = false;
    }

    // Call callback
    if (this.callbacks.onPositionUpdate) {
      this.callbacks.onPositionUpdate(position);
    }
  }

  /**
   * Handle geolocation error
   */
  handleError(error) {
    console.error('Geolocation error:', error);
    
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Create user marker on map
   */
  createUserMarker(map, lat, lng) {
    const icon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #2196F3;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.userMarker = L.marker([lat, lng], { icon }).addTo(map);
  }

  /**
   * Create accuracy circle
   */
  createAccuracyCircle(map, lat, lng, accuracy) {
    this.accuracyCircle = L.circle([lat, lng], {
      radius: accuracy,
      color: '#2196F3',
      fillColor: '#2196F3',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);
  }

  /**
   * Calculate distance to a point (in meters)
   */
  distanceTo(lat, lng) {
    if (!this.currentPosition) return null;

    const pos = this.currentPosition.coords;
    return this.calculateDistance(pos.latitude, pos.longitude, lat, lng);
  }

  /**
   * Haversine formula for distance calculation
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    
    // Restart tracking if active with new settings
    if (this.watchId !== null) {
      const map = this.userMarker ? this.userMarker._map : null;
      if (map) {
        this.stop();
        this.start(map, this.callbacks.onPositionUpdate, this.callbacks.onError);
      }
    }
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return this.currentPosition;
  }
}

export default new GPS();

