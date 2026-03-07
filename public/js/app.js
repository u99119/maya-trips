/**
 * Main Application Entry Point
 */

import mapManager from './map.js';
import gps from './gps.js';
import layers from './layers.js';
import storage from './storage.js';
import tripManager from './trips.js';

// Phase 1.6: Multi-Route Architecture (v2 modules)
import { routeLoaderV2 } from './route-loader-v2.js';
import { junctionDetector } from './junction-detector.js';
import { routeSelector } from './route-selector.js';
import { segmentTracker } from './segment-tracker.js';

class App {
  constructor() {
    this.currentRoute = null;
    this.routeConfig = null;
    this.milestones = null;
    this.currentTrip = null;
    this.isMapView = false; // Track if we're in map view or trip selection

    // Phase 1.6: v2 route architecture
    this.routeV2 = null; // Loaded v2 route (if available)
    this.useV2Architecture = false; // Flag to determine which architecture to use
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
    document.getElementById('mapControls').style.display = 'none';

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

    console.log('Loading trips list. Has trips:', hasTrips);

    if (!hasTrips) {
      emptyState.style.display = 'flex';
      tripsList.innerHTML = '';
      return;
    }

    emptyState.style.display = 'none';

    // Get all trips grouped by route
    const groupedTrips = await tripManager.getAllTripsGrouped();
    console.log('Grouped trips:', groupedTrips);

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
        console.log('Creating trip card for:', trip.tripName);
        const tripCard = this.createTripCard(trip);
        tripsList.appendChild(tripCard);
      }
    }
    console.log('Trips list populated. Total cards:', tripsList.children.length);
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
      // Phase 1.6: Try loading v2 route first
      try {
        console.log(`🔍 Checking for v2 route: ${routeId}`);
        this.routeV2 = await routeLoaderV2.loadRoute(routeId);
        this.useV2Architecture = true;
        console.log(`✅ Loaded v2 route: ${this.routeV2.name}`);
        console.log(`   Junctions: ${this.routeV2.junctions.length}`);
        console.log(`   Segments: ${this.routeV2.segments.length}`);

        // Initialize v2 modules
        await this.initV2Modules();

        // For v2 routes, we still need basic config for map center
        this.routeConfig = {
          id: this.routeV2.id,
          name: this.routeV2.name,
          center: {
            lat: this.routeV2.junctions[0].location[1],
            lng: this.routeV2.junctions[0].location[0],
            zoom: 13
          }
        };

        console.log(`✅ v2 route fully initialized`);
        return this.routeV2; // Return early, don't fall through to v1
      } catch (v2Error) {
        console.log(`ℹ️ v2 route not found, falling back to v1: ${v2Error.message}`);
        this.useV2Architecture = false;
      }

      // Fallback to v1 route loading
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
    document.getElementById('mapControls').style.display = 'flex';

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

    // Phase 1.6: Add v2 route visualization
    if (this.useV2Architecture) {
      console.log('📍 v2 route - adding junctions and segments to map');
      this.addV2RouteLayers();
    } else {
      // v1 route - add all layers upfront
      this.addRouteLayers();
      layers.addMilestones(this.milestones, (milestone, number) => {
        this.onMilestoneClick(milestone, number);
      });
    }

    // Force map to recalculate size and fit bounds
    // This fixes the race condition where map container size isn't finalized yet
    setTimeout(() => {
      map.invalidateSize(); // Force Leaflet to recalculate container size
      if (this.useV2Architecture) {
        layers.fitBoundsV2();
      } else {
        layers.fitBounds();
      }
    }, 100);
  }

  /**
   * Add route layers to map (v1 routes)
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
   * Add v2 route layers to map (Phase 1.6)
   * Loads junctions, segments, and sub-milestones
   */
  async addV2RouteLayers() {
    if (!this.routeV2) {
      console.error('No v2 route loaded');
      return;
    }

    console.log('🗺️ Adding v2 route visualization...');

    // 1. Add junction markers
    console.log(`  Adding ${this.routeV2.junctions.length} junctions...`);
    layers.addJunctions(this.routeV2.junctions);

    // 2. Load and add all segment layers
    console.log(`  Loading ${this.routeV2.segments.length} segments...`);
    const segmentPromises = this.routeV2.segments.map(async (segment) => {
      try {
        const response = await fetch(segment.geojson);
        if (!response.ok) {
          throw new Error(`Failed to load segment: ${segment.id}`);
        }
        const geojson = await response.json();
        layers.addSegmentLayer(segment, geojson);

        // 3. Add sub-milestones for this segment
        if (segment.milestones && segment.milestones.length > 0) {
          segment.milestones.forEach(subMilestone => {
            layers.addSubMilestoneMarker(subMilestone, segment.id);
          });
        }
      } catch (error) {
        console.error(`Failed to load segment ${segment.id}:`, error);
      }
    });

    await Promise.all(segmentPromises);
    console.log('✅ v2 route visualization complete');

    // 4. Initialize map controls, legend, and transport filters
    this.initMapControls();
    this.initMapLegend();
    this.initTransportFilters();
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

    // View Route Button
    const viewRouteBtn = document.getElementById('btnViewFullRoute');
    if (viewRouteBtn) {
      viewRouteBtn.addEventListener('click', () => {
        const map = mapManager.getMap();
        if (map) {
          map.invalidateSize(); // Ensure map size is correct before fitting bounds
        }
        layers.fitBounds();
      });
    }

    // Recenter on Location Button
    const recenterBtn = document.getElementById('btnCenterLocation');
    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => {
        const position = gps.getCurrentPosition();
        if (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          // Use setView to ensure proper centering
          mapManager.setView(lat, lng, 16, { animate: true });
        } else {
          alert('GPS is not enabled or no position available');
        }
      });
    }

    // Auto-Center Toggle Button
    const autoCenterBtn = document.getElementById('btnAutoCenter');
    if (autoCenterBtn) {
      autoCenterBtn.addEventListener('click', () => {
        const isActive = autoCenterBtn.dataset.active === 'true';
        const newState = !isActive;

        autoCenterBtn.dataset.active = newState;
        autoCenterBtn.title = `Auto-Center: ${newState ? 'ON' : 'OFF'}`;

        // Update GPS settings
        gps.updateSettings({ autoCenter: newState });
      });
    }

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

    // Phase 1.6: Skip for v2 routes (no layer toggles yet)
    if (this.useV2Architecture) {
      console.log('📍 v2 route - layer toggles not implemented yet');
      return;
    }

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

    // Phase 1.6: Skip for v2 routes (milestones handled differently)
    if (this.useV2Architecture) {
      console.log('📍 v2 route - milestones list not implemented yet');
      return;
    }

    this.milestones.features.forEach((feature, index) => {
      const props = feature.properties;
      const milestoneItem = document.createElement('div');
      milestoneItem.className = 'milestone-item';
      milestoneItem.dataset.milestoneId = props.id;

      // Check if milestone is visited
      const isVisited = tripManager.isMilestoneVisited(props.id);
      if (isVisited) {
        milestoneItem.classList.add('visited');
      }

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
        <button class="milestone-checkmark" data-milestone-id="${props.id}" data-milestone-index="${index}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      `;

      // Click on milestone info to center map
      const milestoneInfo = milestoneItem.querySelector('.milestone-info');
      milestoneInfo.addEventListener('click', () => {
        const coords = feature.geometry.coordinates;
        const map = mapManager.getMap();
        if (map) {
          map.invalidateSize(); // Ensure map size is correct before centering
        }
        // GeoJSON coords are [lng, lat], Leaflet needs [lat, lng]
        mapManager.setView(coords[1], coords[0], 16, { animate: true });
      });

      // Click on checkmark to mark as visited
      const checkmark = milestoneItem.querySelector('.milestone-checkmark');
      checkmark.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering map center
        this.markMilestoneVisited(props.id, index);
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

    // Phase 1.6: v2 architecture integration
    if (this.useV2Architecture && this.routeV2) {
      // Check for junction proximity
      junctionDetector.checkPosition(position);

      // Update segment tracking progress
      if (segmentTracker.isTracking() && this.currentTrip) {
        segmentTracker.updateProgress(
          { lat, lng, accuracy },
          this.currentTrip.tripId
        );
      }
    } else {
      // Legacy v1 architecture
      // Update distances to milestones
      this.updateMilestoneDistances(lat, lng);

      // Check if near any milestone
      this.checkMilestoneProximity(lat, lng);
    }
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
    // Phase 1.6: Skip for v2 routes (progress handled differently)
    if (this.useV2Architecture) {
      console.log('📍 v2 route - progress display not implemented yet');
      // TODO: Show segment-based progress in Task 1.6.8
      document.querySelector('.progress-text').textContent = 'In Progress';
      document.getElementById('progressFill').style.width = '0%';
      const nextEl = document.querySelector('#nextMilestone span');
      nextEl.textContent = 'Start your journey';
      return;
    }

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

    // Update auto-center button state
    const autoCenterState = tripSettings.autoCenter || false;
    const autoCenterBtn = document.getElementById('btnAutoCenter');
    if (autoCenterBtn) {
      autoCenterBtn.dataset.active = autoCenterState;
      autoCenterBtn.title = `Auto-Center: ${autoCenterState ? 'ON' : 'OFF'}`;
    }

    gps.updateSettings({
      batterySaver: tripSettings.batterySaver || false,
      autoCenter: autoCenterState
    });

    // Phase 1.6: Skip milestone loading for v2 routes
    if (!this.useV2Architecture) {
      // Load visited milestones for this trip
      const visitedMilestones = tripManager.getVisitedMilestones();
      visitedMilestones.forEach((visited) => {
        const milestoneItem = document.querySelector(`[data-milestone-id="${visited.milestoneId}"]`);
        if (milestoneItem) {
          milestoneItem.classList.add('visited');
        }
        layers.updateMilestoneStyle(visited.milestoneId, 'visited');
      });
    }

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
   * Initialize Phase 1.6 v2 modules
   */
  async initV2Modules() {
    console.log('🚀 Initializing v2 modules...');

    // Junction detector uses routeLoaderV2 directly, no need to set graph

    // Set up junction detector event listeners
    junctionDetector.on('junctionApproach', (data) => {
      console.log(`⚠️ Approaching junction: ${data.junction.name} (${Math.round(data.distance)}m away)`);
      // TODO: Show approach notification
    });

    junctionDetector.on('junctionArrival', (data) => {
      console.log(`📍 Arrived at junction: ${data.junction.name}`);
      this.handleJunctionArrival(data);
    });

    junctionDetector.on('junctionDeparture', (data) => {
      console.log(`👋 Departed junction: ${data.junction.name}`);
    });

    // Set up route selector
    routeSelector.setTripId(this.currentTrip?.tripId);
    routeSelector.onSegmentSelected = (segmentData) => {
      console.log(`✅ User selected segment: ${segmentData.segment.name}`);
      // Segment tracking is already started by route-selector
    };

    // Set up segment tracker event listeners
    segmentTracker.on('segmentStarted', (data) => {
      console.log(`🏁 Segment tracking started: ${data.segment.name}`);
      // TODO: Update UI to show segment progress
    });

    segmentTracker.on('segmentProgress', (data) => {
      console.log(`📊 Segment progress: ${Math.round(data.progress)}% (${Math.round(data.distanceToEnd)}m to go)`);
      // TODO: Update progress UI
    });

    segmentTracker.on('segmentCompleted', (data) => {
      console.log(`🎉 Segment completed: ${data.segmentName}`);
      console.log(`   Distance: ${data.actualDistance}m (expected: ${data.expectedDistance}m)`);
      console.log(`   Time: ${Math.round(data.actualTime / 60)}min (expected: ${Math.round(data.expectedTime / 60)}min)`);
      // TODO: Show completion notification
      // TODO: Update trip statistics UI
    });

    segmentTracker.on('segmentAbandoned', (data) => {
      console.log(`⚠️ Segment abandoned: ${data.segment.name} (${data.reason})`);
      // TODO: Show abandonment notification
    });

    console.log('✅ v2 modules initialized');
  }

  /**
   * Handle junction arrival (Phase 1.6)
   */
  handleJunctionArrival(data) {
    const { junction, availableSegments, recommendedSegment } = data;

    // If currently tracking a segment, complete it
    if (segmentTracker.isTracking()) {
      const position = gps.getCurrentPosition();
      if (position) {
        segmentTracker.completeSegment(
          this.currentTrip.tripId,
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        );
      }
    }

    // Show route selection modal
    routeSelector.show(junction, availableSegments, recommendedSegment);
  }

  /**
   * Initialize map controls (Phase 1.6)
   */
  initMapControls() {
    const controlsEl = document.getElementById('mapControls');
    const btnLegendToggle = document.getElementById('btnLegendToggle');
    const btnAutoCenter = document.getElementById('btnAutoCenter');
    const btnCenterLocation = document.getElementById('btnCenterLocation');
    const btnViewFullRoute = document.getElementById('btnViewFullRoute');
    const legendPanel = document.getElementById('legendPanel');
    const legendPanelOverlay = document.getElementById('legendPanelOverlay');
    const legendPanelClose = document.getElementById('legendPanelClose');

    if (!controlsEl) return;

    // Show map controls
    controlsEl.style.display = 'flex';

    // Legend toggle button
    if (btnLegendToggle && legendPanel) {
      btnLegendToggle.addEventListener('click', () => {
        const isActive = legendPanel.classList.toggle('active');
        btnLegendToggle.dataset.active = isActive;
      });

      // Close legend panel when clicking overlay or close button
      if (legendPanelOverlay) {
        legendPanelOverlay.addEventListener('click', () => {
          legendPanel.classList.remove('active');
          btnLegendToggle.dataset.active = 'false';
        });
      }
      if (legendPanelClose) {
        legendPanelClose.addEventListener('click', () => {
          legendPanel.classList.remove('active');
          btnLegendToggle.dataset.active = 'false';
        });
      }
    }

    // Auto center toggle button
    if (btnAutoCenter) {
      // Get saved state from trip
      const autoCenter = this.currentTrip?.settings?.autoCenter || false;
      btnAutoCenter.dataset.active = autoCenter;

      btnAutoCenter.addEventListener('click', () => {
        const isActive = btnAutoCenter.dataset.active === 'true';
        const newState = !isActive;
        btnAutoCenter.dataset.active = newState;

        // Save to trip settings
        if (this.currentTrip) {
          if (!this.currentTrip.settings) this.currentTrip.settings = {};
          this.currentTrip.settings.autoCenter = newState;
          storage.updateTrip(this.currentTrip.id, this.currentTrip);
        }

        console.log(`Auto-center: ${newState ? 'ON' : 'OFF'}`);
      });
    }

    // Center on location button
    if (btnCenterLocation) {
      btnCenterLocation.addEventListener('click', () => {
        if (this.currentLocation) {
          this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 15);

          // Flash green for 1 second to show action completed
          btnCenterLocation.dataset.active = 'true';
          setTimeout(() => {
            btnCenterLocation.dataset.active = 'false';
          }, 1000);
        } else {
          console.log('No GPS location available');
        }
      });
    }

    // View full route button
    if (btnViewFullRoute) {
      btnViewFullRoute.addEventListener('click', () => {
        if (this.useV2Architecture) {
          layers.fitBoundsV2();
        } else {
          layers.fitBounds();
        }

        // Flash green for 1 second to show action completed
        btnViewFullRoute.dataset.active = 'true';
        setTimeout(() => {
          btnViewFullRoute.dataset.active = 'false';
        }, 1000);
      });
    }
  }

  /**
   * Initialize map legend (Phase 1.6)
   */
  initMapLegend() {
    const legendPanel = document.getElementById('legendPanel');
    const transportLegend = document.getElementById('transportLegend');

    if (!legendPanel || !this.routeV2) return;

    // Get unique transport modes from segments
    const transportModes = new Set();
    this.routeV2.segments.forEach(segment => {
      transportModes.add(segment.transportMode);
    });

    // Populate transport mode legend
    const transportIcons = {
      'walking': '🚶',
      'driving': '🚗',
      'flying': '✈️',
      'battery-car': '🚡',
      'ropeway': '🚠',
      'helicopter': '🚁'
    };

    const transportLabels = {
      'walking': 'Walking',
      'driving': 'Driving',
      'flying': 'Flying',
      'battery-car': 'Battery Car',
      'ropeway': 'Ropeway',
      'helicopter': 'Helicopter'
    };

    transportLegend.innerHTML = '';
    transportModes.forEach(mode => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span class="legend-icon">${transportIcons[mode] || '🚶'}</span>
        <span class="legend-label">${transportLabels[mode] || mode}</span>
      `;
      transportLegend.appendChild(item);
    });

    // Show legend panel (hidden by default, shown when L button clicked)
    legendPanel.style.display = 'block';
  }

  /**
   * Initialize transport mode filters (Phase 1.6)
   */
  initTransportFilters() {
    const filtersEl = document.getElementById('transportFilters');
    const filterButtons = document.getElementById('filterButtons');

    if (!filtersEl || !this.routeV2) return;

    // Get transport modes with counts
    const transportCounts = {};
    this.routeV2.segments.forEach(segment => {
      const mode = segment.transportMode;
      transportCounts[mode] = (transportCounts[mode] || 0) + 1;
    });

    // Transport mode icons and labels
    const transportIcons = {
      'walking': '🚶',
      'driving': '🚗',
      'flying': '✈️',
      'battery-car': '🚡',
      'ropeway': '🚠',
      'helicopter': '🚁'
    };

    const transportLabels = {
      'walking': 'Walking',
      'driving': 'Driving',
      'flying': 'Flying',
      'battery-car': 'Battery Car',
      'ropeway': 'Ropeway',
      'helicopter': 'Helicopter'
    };

    // Create filter buttons
    filterButtons.innerHTML = '';
    Object.entries(transportCounts).forEach(([mode, count]) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn active';
      btn.dataset.mode = mode;
      btn.innerHTML = `
        <span class="filter-icon">${transportIcons[mode] || '🚶'}</span>
        <span class="filter-label">${transportLabels[mode] || mode}</span>
        <span class="filter-count">(${count})</span>
      `;

      // Toggle filter on click
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        this.toggleTransportMode(mode, btn.classList.contains('active'));
      });

      filterButtons.appendChild(btn);
    });

    // Show filters
    filtersEl.style.display = 'block';
  }

  /**
   * Toggle transport mode visibility (Phase 1.6)
   */
  toggleTransportMode(mode, visible) {
    if (!this.routeV2) return;

    // Find all segments with this transport mode
    this.routeV2.segments.forEach(segment => {
      if (segment.transportMode === mode) {
        layers.toggleSegmentLayer(segment.id, visible);
      }
    });
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

