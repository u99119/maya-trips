/**
 * Main Application Entry Point
 */

import mapManager from './map.js';
import gps from './gps.js';
import layers from './layers.js';
import storage from './storage.js';

class App {
  constructor() {
    this.currentRoute = null;
    this.routeConfig = null;
    this.milestones = null;
    this.visitedMilestones = [];
    this.currentMilestoneIndex = 0;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Show loading overlay
      this.showLoading(true);

      // Initialize storage
      await storage.init();

      // Load route configuration
      await this.loadRoute('vaishno-devi');

      // Initialize map
      this.initMap();

      // Initialize UI controls
      this.initControls();

      // Load saved state
      this.loadSavedState();

      // Hide loading overlay
      this.showLoading(false);

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Load route configuration and data
   */
  async loadRoute(routeId) {
    try {
      // Load route config
      const configResponse = await fetch(`/routes/${routeId}/config.json`);
      this.routeConfig = await configResponse.json();

      // Load milestones
      const milestonesResponse = await fetch(`/routes/${routeId}/milestones.geojson`);
      this.milestones = await milestonesResponse.json();

      // Load route GeoJSON
      const routeResponse = await fetch(`/routes/${routeId}/route.geojson`);
      const routeData = await routeResponse.json();

      this.currentRoute = {
        id: routeId,
        config: this.routeConfig,
        milestones: this.milestones,
        routes: routeData
      };

      // Update header
      document.getElementById('routeName').textContent = this.routeConfig.name;

      return this.currentRoute;
    } catch (error) {
      console.error('Error loading route:', error);
      throw error;
    }
  }

  /**
   * Initialize map
   */
  initMap() {
    const center = this.routeConfig.center;
    const map = mapManager.init('map', {
      center: [center.lat, center.lng],
      zoom: center.zoom
    });

    // Initialize layers manager
    layers.init(map);

    // Add route layers
    this.currentRoute.routes.features.forEach((feature) => {
      const routeConfig = this.routeConfig.routes.find(r => r.id === feature.properties.id);
      if (routeConfig) {
        layers.addRouteLayer(feature.properties.id, {
          type: 'FeatureCollection',
          features: [feature]
        }, {
          color: routeConfig.color,
          weight: routeConfig.weight,
          opacity: 0.8
        });

        // Set initial visibility
        if (!routeConfig.visible) {
          layers.toggleLayer(feature.properties.id, false);
        }
      }
    });

    // Add milestones
    layers.addMilestones(this.milestones, (milestone, number) => {
      this.onMilestoneClick(milestone, number);
    });

    // Fit map to show all routes
    layers.fitBounds();
  }

  /**
   * Initialize UI controls
   */
  initControls() {
    // GPS Toggle
    const gpsToggle = document.getElementById('gpsToggle');
    gpsToggle.addEventListener('change', (e) => {
      this.toggleGPS(e.target.checked);
    });

    // Battery Saver Toggle
    const batterySaverToggle = document.getElementById('batterySaverToggle');
    batterySaverToggle.addEventListener('change', (e) => {
      gps.updateSettings({ batterySaver: e.target.checked });
      storage.saveGPSSettings({ batterySaver: e.target.checked });
    });

    // Auto Center Toggle
    const autoCenterToggle = document.getElementById('autoCenterToggle');
    autoCenterToggle.addEventListener('change', (e) => {
      gps.updateSettings({ autoCenter: e.target.checked });
      storage.saveGPSSettings({ autoCenter: e.target.checked });
    });

    // Recenter Button
    const recenterBtn = document.getElementById('recenterBtn');
    recenterBtn.addEventListener('click', () => {
      const position = gps.getCurrentPosition();
      if (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        mapManager.setView(lat, lng, 15, { animate: true });
      } else {
        layers.fitBounds();
      }
    });

    // Populate layer toggles
    this.populateLayerToggles();

    // Populate milestones list
    this.populateMilestonesList();
  }

  /**
   * Populate layer toggles in UI
   */
  populateLayerToggles() {
    const container = document.getElementById('layerToggles');
    container.innerHTML = '';

    this.routeConfig.routes.forEach((route) => {
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';
      layerItem.innerHTML = `
        <input type="checkbox" id="layer-${route.id}" ${route.visible ? 'checked' : ''}>
        <span class="layer-name">${route.name}</span>
        <div class="layer-color" style="background: ${route.color};"></div>
      `;

      const checkbox = layerItem.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        layers.toggleLayer(route.id, e.target.checked);
        this.saveLayerState();
      });

      container.appendChild(layerItem);
    });
  }

  /**
   * Populate milestones list in UI
   */
  populateMilestonesList() {
    const container = document.getElementById('milestonesList');
    container.innerHTML = '';

    this.milestones.features.forEach((feature, index) => {
      const props = feature.properties;
      const milestoneItem = document.createElement('div');
      milestoneItem.className = 'milestone-item';
      milestoneItem.dataset.milestoneId = props.id;

      milestoneItem.innerHTML = `
        <div class="milestone-number">${index + 1}</div>
        <div class="milestone-info">
          <div class="milestone-name">${props.name}</div>
          <div class="milestone-details">
            ${props.elevation ? `${props.elevation}m` : ''}
            ${props.distance_from_start ? `• ${props.distance_from_start}km from start` : ''}
          </div>
        </div>
        <div class="milestone-distance" id="distance-${props.id}">--</div>
      `;

      milestoneItem.addEventListener('click', () => {
        const coords = feature.geometry.coordinates;
        mapManager.setView(coords[1], coords[0], 16, { animate: true });
      });

      container.appendChild(milestoneItem);
    });
  }

  /**
   * Toggle GPS tracking
   */
  toggleGPS(enabled) {
    if (enabled) {
      const map = mapManager.getMap();
      const started = gps.start(
        map,
        (position) => this.onPositionUpdate(position),
        (error) => this.onGPSError(error)
      );

      if (started) {
        document.getElementById('gpsInfo').textContent = 'Active';
        storage.saveGPSSettings({ enabled: true });
      } else {
        document.getElementById('gpsToggle').checked = false;
        this.showError('GPS not available');
      }
    } else {
      gps.stop();
      document.getElementById('gpsInfo').textContent = 'Inactive';
      storage.saveGPSSettings({ enabled: false });
    }
  }

  /**
   * Handle GPS position update
   */
  onPositionUpdate(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Update GPS info
    document.getElementById('gpsInfo').textContent = `±${Math.round(accuracy)}m`;

    // Update distances to milestones
    this.updateMilestoneDistances(lat, lng);

    // Check if near any milestone
    this.checkMilestoneProximity(lat, lng);
  }

  /**
   * Handle GPS error
   */
  onGPSError(error) {
    console.error('GPS error:', error);
    document.getElementById('gpsInfo').textContent = 'Error';

    let message = 'GPS error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location timeout';
        break;
    }

    this.showError(message);
  }

  /**
   * Update distances to all milestones
   */
  updateMilestoneDistances(userLat, userLng) {
    this.milestones.features.forEach((feature) => {
      const coords = feature.geometry.coordinates;
      const distance = gps.calculateDistance(userLat, userLng, coords[1], coords[0]);

      const distanceEl = document.getElementById(`distance-${feature.properties.id}`);
      if (distanceEl) {
        if (distance < 1000) {
          distanceEl.textContent = `${Math.round(distance)}m`;
        } else {
          distanceEl.textContent = `${(distance / 1000).toFixed(1)}km`;
        }
      }
    });
  }

  /**
   * Check if user is near any milestone
   */
  checkMilestoneProximity(userLat, userLng) {
    const autoMarkDistance = this.routeConfig.milestones.auto_mark_distance || 30;

    this.milestones.features.forEach((feature, index) => {
      const coords = feature.geometry.coordinates;
      const distance = gps.calculateDistance(userLat, userLng, coords[1], coords[0]);

      if (distance <= autoMarkDistance && !this.visitedMilestones.includes(feature.properties.id)) {
        this.markMilestoneVisited(feature.properties.id, index);
      }
    });
  }

  /**
   * Mark milestone as visited
   */
  markMilestoneVisited(milestoneId, index) {
    if (!this.visitedMilestones.includes(milestoneId)) {
      this.visitedMilestones.push(milestoneId);
      storage.markMilestoneVisited(this.currentRoute.id, milestoneId);

      // Update UI
      const milestoneItem = document.querySelector(`[data-milestone-id="${milestoneId}"]`);
      if (milestoneItem) {
        milestoneItem.classList.add('visited');
      }

      // Update marker style
      layers.updateMilestoneStyle(milestoneId, 'visited');

      // Update progress
      this.updateProgress();

      console.log(`Milestone ${milestoneId} marked as visited`);
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const total = this.milestones.features.length;
    const visited = this.visitedMilestones.length;
    const percentage = (visited / total) * 100;

    document.querySelector('.progress-text').textContent = `Milestone ${visited} / ${total}`;
    document.getElementById('progressFill').style.width = `${percentage}%`;

    // Update next milestone
    const nextMilestone = this.milestones.features.find(
      (f) => !this.visitedMilestones.includes(f.properties.id)
    );

    if (nextMilestone) {
      const nextEl = document.querySelector('#nextMilestone span');
      nextEl.textContent = `${nextMilestone.properties.name} (${nextMilestone.properties.distance_from_start}km)`;
    } else {
      const nextEl = document.querySelector('#nextMilestone span');
      nextEl.textContent = 'Journey Complete! 🎉';
    }
  }

  /**
   * Handle milestone click
   */
  onMilestoneClick(milestone, number) {
    console.log('Milestone clicked:', milestone, number);
    // Future: Open milestone details modal with notes/photos
  }

  /**
   * Load saved state from storage
   */
  loadSavedState() {
    // Load GPS settings
    const gpsSettings = storage.getGPSSettings();
    document.getElementById('gpsToggle').checked = gpsSettings.enabled || false;
    document.getElementById('batterySaverToggle').checked = gpsSettings.batterySaver || false;
    document.getElementById('autoCenterToggle').checked = gpsSettings.autoCenter !== false;

    gps.updateSettings({
      batterySaver: gpsSettings.batterySaver || false,
      autoCenter: gpsSettings.autoCenter !== false
    });

    // Load visited milestones
    this.visitedMilestones = storage.getVisitedMilestones(this.currentRoute.id);
    this.visitedMilestones.forEach((milestoneId) => {
      const milestoneItem = document.querySelector(`[data-milestone-id="${milestoneId}"]`);
      if (milestoneItem) {
        milestoneItem.classList.add('visited');
      }
      layers.updateMilestoneStyle(milestoneId, 'visited');
    });

    // Update progress
    this.updateProgress();

    // Auto-start GPS if it was enabled
    if (gpsSettings.enabled) {
      this.toggleGPS(true);
    }
  }

  /**
   * Save layer visibility state
   */
  saveLayerState() {
    const layerStates = {};
    this.routeConfig.routes.forEach((route) => {
      layerStates[route.id] = layers.getLayerVisibility(route.id);
    });
    storage.saveLayerVisibility(this.currentRoute.id, layerStates);
  }

  /**
   * Show/hide loading overlay
   */
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Simple alert for now, can be replaced with toast notification
    alert(message);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}

