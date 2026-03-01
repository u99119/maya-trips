/**
 * Map Module
 * Handles Leaflet map initialization and tile layer management
 */

class MapManager {
  constructor() {
    this.map = null;
    this.baseLayers = {};
    this.currentTileProvider = 'osm';
    this.tileProviders = {
      osm: {
        name: 'OpenStreetMap',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      },
      maptiler: {
        name: 'MapTiler',
        url: 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=YOUR_MAPTILER_KEY',
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
        maxZoom: 20
      }
    };
  }

  /**
   * Initialize the map
   */
  init(containerId, options = {}) {
    const defaultOptions = {
      center: [32.98944, 74.93333], // Katra coordinates
      zoom: 13,
      zoomControl: false,
      attributionControl: true
    };

    const mapOptions = { ...defaultOptions, ...options };

    this.map = L.map(containerId, mapOptions);

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    // Add scale control
    L.control.scale({
      position: 'bottomleft',
      imperial: false
    }).addTo(this.map);

    // Add tile layer
    this.addTileLayer(this.currentTileProvider);

    // Handle tile loading errors
    this.setupTileErrorHandling();

    return this.map;
  }

  /**
   * Add tile layer to map
   */
  addTileLayer(provider) {
    const tileProvider = this.tileProviders[provider];
    if (!tileProvider) {
      console.error(`Tile provider ${provider} not found`);
      return;
    }

    // Remove existing base layer if any
    if (this.baseLayers[this.currentTileProvider]) {
      this.map.removeLayer(this.baseLayers[this.currentTileProvider]);
    }

    // Create and add new tile layer
    const tileLayer = L.tileLayer(tileProvider.url, {
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
      crossOrigin: true
    });

    tileLayer.addTo(this.map);
    this.baseLayers[provider] = tileLayer;
    this.currentTileProvider = provider;
  }

  /**
   * Setup tile loading error handling with fallback
   */
  setupTileErrorHandling() {
    let errorCount = 0;
    const maxErrors = 5;

    this.map.on('tileerror', (error) => {
      errorCount++;
      console.warn('Tile loading error:', error);

      // Switch to fallback provider if too many errors
      if (errorCount >= maxErrors && this.currentTileProvider === 'osm') {
        console.log('Switching to fallback tile provider');
        this.switchTileProvider('maptiler');
        errorCount = 0;
      }
    });

    this.map.on('tileload', () => {
      // Reset error count on successful tile load
      if (errorCount > 0) {
        errorCount = Math.max(0, errorCount - 1);
      }
    });
  }

  /**
   * Switch tile provider
   */
  switchTileProvider(provider) {
    if (this.tileProviders[provider]) {
      this.addTileLayer(provider);
    }
  }

  /**
   * Get map instance
   */
  getMap() {
    return this.map;
  }

  /**
   * Set map view
   */
  setView(lat, lng, zoom, options = {}) {
    if (this.map) {
      this.map.setView([lat, lng], zoom, options);
    }
  }

  /**
   * Fit bounds
   */
  fitBounds(bounds, options = {}) {
    if (this.map) {
      this.map.fitBounds(bounds, options);
    }
  }

  /**
   * Add event listener
   */
  on(event, handler) {
    if (this.map) {
      this.map.on(event, handler);
    }
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    if (this.map) {
      this.map.off(event, handler);
    }
  }

  /**
   * Invalidate map size (useful after container resize)
   */
  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}

export default new MapManager();

