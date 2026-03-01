/**
 * Main Application Entry Point
 */

import mapManager from './map.js';
import gps from './gps.js';
import layers from './layers.js';
import storage from './storage.js';
import tripManager from './trips.js';

class App {
  constructor() {
    this.currentRoute = null;
    this.routeConfig = null;
    this.milestones = null;
    this.currentTrip = null;
    this.isMapView = false; // Track if we're in map view or trip selection
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

      // Initialize trip manager
      await tripManager.init();

      // Initialize trip selection UI
      this.initTripSelectionUI();

      // Check if there's a current trip
      const currentTrip = tripManager.getCurrentTrip();
      if (currentTrip) {
        // Load the current trip
        await this.loadTrip(currentTrip.tripId);
      } else {
        // Show trip selection screen
        await this.showTripSelection();
      }

      // Hide loading overlay
      this.showLoading(false);

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Initialize trip selection UI event handlers
   */
  initTripSelectionUI() {
    // Create Trip Button
    const btnCreateTrip = document.getElementById('btnCreateTrip');
    btnCreateTrip.addEventListener('click', () => this.showCreateTripModal());

    // Modal Close Buttons
    const modalClose = document.getElementById('modalClose');
    const btnCancelCreate = document.getElementById('btnCancelCreate');
    const modalOverlay = document.getElementById('modalOverlay');

    modalClose.addEventListener('click', () => this.hideCreateTripModal());
    btnCancelCreate.addEventListener('click', () => this.hideCreateTripModal());
    modalOverlay.addEventListener('click', () => this.hideCreateTripModal());

    // Create Trip Confirm Button
    const btnConfirmCreate = document.getElementById('btnConfirmCreate');
    btnConfirmCreate.addEventListener('click', () => this.handleCreateTrip());

    // Back to Trips Button
    const btnBackToTrips = document.getElementById('btnBackToTrips');
    btnBackToTrips.addEventListener('click', () => this.showTripSelection());

    // Switch Route Button
    const btnSwitchRoute = document.getElementById('btnSwitchRoute');
    btnSwitchRoute.addEventListener('click', () => this.showSwitchRouteModal());

    // Switch Route Modal
    const switchRouteClose = document.getElementById('switchRouteClose');
    const btnCancelSwitch = document.getElementById('btnCancelSwitch');
    const switchRouteOverlay = document.getElementById('switchRouteOverlay');

    switchRouteClose.addEventListener('click', () => this.hideSwitchRouteModal());
    btnCancelSwitch.addEventListener('click', () => this.hideSwitchRouteModal());
    switchRouteOverlay.addEventListener('click', () => this.hideSwitchRouteModal());

    // Confirm Switch Button
    const btnConfirmSwitch = document.getElementById('btnConfirmSwitch');
    btnConfirmSwitch.addEventListener('click', () => this.handleSwitchRoute());
  }

  /**
   * Show trip selection screen
   */
  async showTripSelection() {
    this.isMapView = false;

    // Hide map view elements
    document.getElementById('appHeader').style.display = 'none';
    document.getElementById('map').style.display = 'none';
    document.getElementById('bottomDrawer').style.display = 'none';
    document.getElementById('recenterBtn').style.display = 'none';

    // Show trip selection screen
    document.getElementById('tripSelectionScreen').style.display = 'block';

    // Stop GPS if running
    gps.stop();

    // Load and display trips
    await this.loadTripsList();
  }

  /**
   * Load and display trips list
   */
  async loadTripsList() {
    const hasTrips = await tripManager.hasAnyTrips();
    const emptyState = document.getElementById('emptyState');
    const tripsList = document.getElementById('tripsList');

    if (!hasTrips) {
      emptyState.style.display = 'flex';
      tripsList.innerHTML = '';
      return;
    }

    emptyState.style.display = 'none';

    // Get all trips grouped by route
    const groupedTrips = await tripManager.getAllTripsGrouped();

    // Render trips
    tripsList.innerHTML = '';
    for (const group of groupedTrips) {
      // Add route header
      const routeHeader = document.createElement('h3');
      routeHeader.className = 'route-group-header';
      routeHeader.textContent = group.routeName;
      routeHeader.style.cssText = 'margin: 20px 0 12px; font-size: 14px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;';
      tripsList.appendChild(routeHeader);

      // Add trip cards
      for (const trip of group.trips) {
        const tripCard = this.createTripCard(trip);
        tripsList.appendChild(tripCard);
      }
    }
  }

  /**
   * Create trip card element
   */
  createTripCard(trip) {
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.dataset.tripId = trip.tripId;

    const stats = tripManager.getTripStats(trip);
    const statusClass = trip.status.replace('_', '-');

    card.innerHTML = `
      <div class="trip-card-header">
        <div class="trip-card-title">
          <h3>${trip.tripName}</h3>
          <p>${tripManager.formatDate(trip.createdAt)}</p>
        </div>
        <span class="trip-status-badge ${statusClass}">${trip.status}</span>
      </div>
      <div class="trip-card-meta">
        <div class="trip-card-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>${stats.duration}</span>
        </div>
        <div class="trip-card-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${stats.visitedCount} / ${stats.totalMilestones} milestones</span>
        </div>
      </div>
    `;

    // Click to load trip
    card.addEventListener('click', () => this.loadTrip(trip.tripId));

    return card;
  }

  /**
   * Show create trip modal
   */
  showCreateTripModal() {
    document.getElementById('createTripModal').style.display = 'flex';
    document.getElementById('routeSelect').value = '';
    document.getElementById('tripNameInput').value = '';
    document.getElementById('autoStartCheckbox').checked = true;
  }

  /**
   * Hide create trip modal
   */
  hideCreateTripModal() {
    document.getElementById('createTripModal').style.display = 'none';
  }

  /**
   * Show switch route modal
   */
  showSwitchRouteModal() {
    document.getElementById('switchRouteModal').style.display = 'flex';
    document.getElementById('switchRouteSelect').value = '';
    document.getElementById('switchTripNameInput').value = '';
    document.getElementById('completeCurrentTripCheckbox').checked = false;
  }

  /**
   * Hide switch route modal
   */
  hideSwitchRouteModal() {
    document.getElementById('switchRouteModal').style.display = 'none';
  }

  /**
   * Handle route switch
   */
  async handleSwitchRoute() {
    const newRouteId = document.getElementById('switchRouteSelect').value;
    const newTripName = document.getElementById('switchTripNameInput').value.trim();
    const completeCurrentTrip = document.getElementById('completeCurrentTripCheckbox').checked;

    if (!newRouteId) {
      this.showError('Please select a route');
      return;
    }

    if (newRouteId === this.currentTrip.routeId) {
      this.showError('You are already on this route');
      return;
    }

    try {
      this.showLoading(true);

      // Complete current trip if requested
      if (completeCurrentTrip) {
        await tripManager.completeCurrentTrip();
      }

      // Create new trip for the new route
      const newTrip = await tripManager.createTrip(newRouteId, newTripName || null, true);

      // Hide modal
      this.hideSwitchRouteModal();

      // Load the new trip
      await this.loadTrip(newTrip.tripId);

      this.showLoading(false);

      console.log(`Switched from ${this.currentTrip.routeId} to ${newRouteId}`);
    } catch (error) {
      console.error('Error switching route:', error);
      this.showError('Failed to switch route');
      this.showLoading(false);
    }
  }

  /**
   * Handle create trip
   */
  async handleCreateTrip() {
    const routeId = document.getElementById('routeSelect').value;
    const tripName = document.getElementById('tripNameInput').value.trim();
    const autoStart = document.getElementById('autoStartCheckbox').checked;

    if (!routeId) {
      this.showError('Please select a route');
      return;
    }

    try {
      this.showLoading(true);

      // Create trip
      const trip = await tripManager.createTrip(routeId, tripName || null, autoStart);

      // Hide modal
      this.hideCreateTripModal();

      // Load the new trip
      await this.loadTrip(trip.tripId);

      this.showLoading(false);
    } catch (error) {
      console.error('Error creating trip:', error);
      this.showError('Failed to create trip');
      this.showLoading(false);
    }
  }

  /**
   * Load trip and show map view
   */
  async loadTrip(tripId) {
    try {
      this.showLoading(true);

      // Set active trip
      await tripManager.setActiveTrip(tripId);
      this.currentTrip = tripManager.getCurrentTrip();

      // Load route data
      await this.loadRoute(this.currentTrip.routeId);

      // Initialize or update map
      if (!this.isMapView) {
        this.initMap();
        this.initControls();
      } else {
        // Update existing map
        this.updateMapForTrip();
      }

      // Load trip state
      this.loadTripState();

      // Show map view
      this.showMapView();

      this.showLoading(false);
    } catch (error) {
      console.error('Error loading trip:', error);
      this.showError('Failed to load trip');
      this.showLoading(false);
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

      return this.currentRoute;
    } catch (error) {
      console.error('Error loading route:', error);
      throw error;
    }
  }

  /**
   * Show map view
   */
  showMapView() {
    this.isMapView = true;

    // Hide trip selection screen
    document.getElementById('tripSelectionScreen').style.display = 'none';

    // Show map view elements
    document.getElementById('appHeader').style.display = 'flex';
    document.getElementById('map').style.display = 'block';
    document.getElementById('bottomDrawer').style.display = 'block';
    document.getElementById('recenterBtn').style.display = 'flex';

    // Update header
    document.getElementById('routeName').textContent = this.routeConfig.name;
    document.getElementById('tripNameHeader').textContent = this.currentTrip.tripName;
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
    this.addRouteLayers();

    // Add milestones
    layers.addMilestones(this.milestones, (milestone, number) => {
      this.onMilestoneClick(milestone, number);
    });

    // Fit map to show all routes (with slight delay to ensure layers are rendered)
    setTimeout(() => {
      layers.fitBounds();
    }, 100);
  }

  /**
   * Add route layers to map
   */
  addRouteLayers() {
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
  }

  /**
   * Update map for current trip (when switching trips)
   */
  updateMapForTrip() {
    // Clear existing layers
    layers.clear();

    // Re-add route layers
    this.addRouteLayers();

    // Re-add milestones
    layers.addMilestones(this.milestones, (milestone, number) => {
      this.onMilestoneClick(milestone, number);
    });

    // Fit bounds
    layers.fitBounds();

    // Update UI
    this.populateLayerToggles();
    this.populateMilestonesList();
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
      this.saveTripSettings({ batterySaver: e.target.checked });
    });

    // Auto Center Toggle
    const autoCenterToggle = document.getElementById('autoCenterToggle');
    autoCenterToggle.addEventListener('change', (e) => {
      gps.updateSettings({ autoCenter: e.target.checked });
      this.saveTripSettings({ autoCenter: e.target.checked });
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
   * Toggle GPS tracking (trip-scoped)
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
        this.saveTripSettings({ gpsEnabled: true });
      } else {
        document.getElementById('gpsToggle').checked = false;
        this.showError('GPS not available');
      }
    } else {
      gps.stop();
      document.getElementById('gpsInfo').textContent = 'Inactive';
      this.saveTripSettings({ gpsEnabled: false });
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
   * Check if user is near any milestone (trip-scoped)
   */
  checkMilestoneProximity(userLat, userLng) {
    const autoMarkDistance = this.routeConfig.milestones.auto_mark_distance || 30;

    this.milestones.features.forEach((feature, index) => {
      const coords = feature.geometry.coordinates;
      const distance = gps.calculateDistance(userLat, userLng, coords[1], coords[0]);

      if (distance <= autoMarkDistance && !tripManager.isMilestoneVisited(feature.properties.id)) {
        this.markMilestoneVisited(feature.properties.id, index);
      }
    });
  }

  /**
   * Mark milestone as visited (trip-scoped)
   */
  async markMilestoneVisited(milestoneId, index) {
    if (!tripManager.isMilestoneVisited(milestoneId)) {
      // Get current position for location data
      const position = gps.getCurrentPosition();
      const location = position ? {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      } : null;

      // Mark in trip manager
      await tripManager.markMilestoneVisited(milestoneId, location);

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
   * Update progress display (trip-scoped)
   */
  updateProgress() {
    const visitedMilestones = tripManager.getVisitedMilestones();
    const total = this.milestones.features.length;
    const visited = visitedMilestones.length;
    const percentage = (visited / total) * 100;

    document.querySelector('.progress-text').textContent = `Milestone ${visited} / ${total}`;
    document.getElementById('progressFill').style.width = `${percentage}%`;

    // Update next milestone
    const visitedIds = visitedMilestones.map(m => m.milestoneId);
    const nextMilestone = this.milestones.features.find(
      (f) => !visitedIds.includes(f.properties.id)
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
   * Load trip state (trip-scoped)
   */
  loadTripState() {
    // Load trip settings
    const tripSettings = this.currentTrip.settings || {};
    document.getElementById('gpsToggle').checked = tripSettings.gpsEnabled || false;
    document.getElementById('batterySaverToggle').checked = tripSettings.batterySaver || false;
    document.getElementById('autoCenterToggle').checked = tripSettings.autoCenter !== false;

    gps.updateSettings({
      batterySaver: tripSettings.batterySaver || false,
      autoCenter: tripSettings.autoCenter !== false
    });

    // Load visited milestones for this trip
    const visitedMilestones = tripManager.getVisitedMilestones();
    visitedMilestones.forEach((visited) => {
      const milestoneItem = document.querySelector(`[data-milestone-id="${visited.milestoneId}"]`);
      if (milestoneItem) {
        milestoneItem.classList.add('visited');
      }
      layers.updateMilestoneStyle(visited.milestoneId, 'visited');
    });

    // Update progress
    this.updateProgress();

    // Auto-start GPS if it was enabled
    if (tripSettings.gpsEnabled) {
      this.toggleGPS(true);
    }
  }

  /**
   * Save trip settings
   */
  async saveTripSettings(updates) {
    if (!this.currentTrip) return;

    const currentSettings = this.currentTrip.settings || {};
    const newSettings = { ...currentSettings, ...updates };

    await storage.updateTrip(this.currentTrip.tripId, { settings: newSettings });
    this.currentTrip.settings = newSettings;
  }

  /**
   * Save layer visibility state (trip-scoped)
   */
  saveLayerState() {
    const layerStates = {};
    this.routeConfig.routes.forEach((route) => {
      layerStates[route.id] = layers.getLayerVisibility(route.id);
    });
    // Store in trip settings
    this.saveTripSettings({ layerVisibility: layerStates });
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

