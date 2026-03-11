/**
 * Main Application Entry Point
 */

import mapManager from './map.js';
import gps from './gps.js';
import layers from './layers.js';
import storage from './storage.js';
import tripManager from './trips.js';
import drawerManager from './drawer.js';

// Phase 1.6: Multi-Route Architecture (v2 modules)
import { routeLoaderV2 } from './route-loader-v2.js';
import { junctionDetector } from './junction-detector.js';
import { routeSelector } from './route-selector.js';
import { segmentTracker } from './segment-tracker.js';
import { progressUI } from './progress-ui.js';
import notifications from './notifications.js';

// Phase 1.7: Trip Import (v2.0 Trip Template)
import { tripImportUI } from './trip-import.js';

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

    // Phase 1.6.9: Trip statistics
    this.tripStatistics = new TripStatistics();
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

      // Initialize drawer manager
      drawerManager.init();
      drawerManager.restoreSavedHeight();

      // Initialize trip selection UI
      this.initTripSelectionUI();

      // Initialize trip import UI (Phase 1.7)
      tripImportUI.init();

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
    // Populate route dropdown with available routes
    this.populateRouteDropdown('routeSelect');

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
   * Populate route dropdown with built-in and imported routes
   */
  populateRouteDropdown(selectId) {
    const select = document.getElementById(selectId);

    // Clear existing options except the first one (placeholder)
    while (select.options.length > 1) {
      select.remove(1);
    }

    // Built-in routes (hardcoded for now)
    const builtInRoutes = [
      { id: 'vaishno-devi', name: 'Vaishno Devi Yatra' },
      { id: 'pune-eisha-cisco', name: 'Pune: Eisha Zenith to Cisco Hinjewadi' }
    ];

    // Add built-in routes
    builtInRoutes.forEach(route => {
      const option = document.createElement('option');
      option.value = route.id;
      option.textContent = route.name;
      select.appendChild(option);
    });

    // Get imported routes from localStorage
    const importedRoutes = this.getImportedRoutes();

    // Add separator if there are imported routes
    if (importedRoutes.length > 0) {
      const separator = document.createElement('option');
      separator.disabled = true;
      separator.textContent = '--- Imported Routes ---';
      select.appendChild(separator);

      // Add imported routes
      importedRoutes.forEach(route => {
        const option = document.createElement('option');
        option.value = route.id;
        option.textContent = `${route.name} (imported)`;
        select.appendChild(option);
      });
    }
  }

  /**
   * Get all imported routes from localStorage
   */
  getImportedRoutes() {
    const routes = [];

    // Scan localStorage for route_config_* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('route_config_')) {
        try {
          const config = JSON.parse(localStorage.getItem(key));
          routes.push({
            id: config.id,
            name: config.name,
            region: config.region
          });
        } catch (error) {
          console.warn(`Failed to parse route config: ${key}`, error);
        }
      }
    }

    return routes;
  }

  /**
   * Show switch route modal
   */
  showSwitchRouteModal() {
    // Populate route dropdown
    this.populateRouteDropdown('switchRouteSelect');

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
        const firstJunction = this.routeV2.junctions[0];
        let centerLat, centerLng;

        // Support both location [lon, lat] and coordinates [lat, lon] formats
        if (firstJunction.location) {
          centerLng = firstJunction.location[0];
          centerLat = firstJunction.location[1];
        } else if (firstJunction.coordinates) {
          centerLat = firstJunction.coordinates[0];
          centerLng = firstJunction.coordinates[1];
        } else {
          throw new Error('Junction has neither location nor coordinates');
        }

        this.routeConfig = {
          id: this.routeV2.id,
          name: this.routeV2.name,
          center: {
            lat: centerLat,
            lng: centerLng,
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

    // 4. Load completed segments from trip
    if (this.currentTrip && this.currentTrip.completedSegments) {
      layers.loadCompletedSegments(this.currentTrip.completedSegments);
    }

    // 5. Mark active segment if tracking
    if (this.currentTrip && this.currentTrip.currentSegment) {
      layers.markSegmentActive(this.currentTrip.currentSegment);
    }

    // 6. Initialize progress UI
    progressUI.init(this.currentTrip, this.routeV2);

    // 7. Initialize map controls, legend, and transport filters
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

    // Auto-Center Toggle Button - handled in initMapControls()
    // (removed duplicate event listener)

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

    // Phase 1.6: For v2 routes, show junctions as milestones
    if (this.useV2Architecture) {
      console.log('📍 v2 route - populating junctions as milestones');
      this.populateV2Milestones(container);
      return;
    }

    // Legacy v1 route milestones
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
   * Populate v2 route milestones (junctions) for manual testing
   */
  populateV2Milestones(container) {
    if (!this.routeV2 || !this.routeV2.junctions) {
      container.innerHTML = '<p style="color: #757575; padding: 12px;">No junctions available</p>';
      return;
    }

    // Get completed segments to determine which junctions have been visited
    const completedSegments = this.currentTrip?.completedSegments || [];
    const visitedJunctionIds = new Set();

    // Add all "from" and "to" junctions from completed segments
    completedSegments.forEach(seg => {
      const segment = this.routeV2.segments.find(s => s.id === seg.segmentId);
      if (segment) {
        visitedJunctionIds.add(segment.from);
        visitedJunctionIds.add(segment.to);
      }
    });

    console.log(`📍 Populating ${this.routeV2.junctions.length} junctions, ${visitedJunctionIds.size} visited`);

    this.routeV2.junctions.forEach((junction, index) => {
      const milestoneItem = document.createElement('div');
      milestoneItem.className = 'milestone-item';
      milestoneItem.dataset.junctionId = junction.id;

      // Mark as visited if this junction has been reached
      const isVisited = visitedJunctionIds.has(junction.id);
      if (isVisited) {
        milestoneItem.classList.add('visited');
        console.log(`✅ Junction ${junction.id} marked as visited in drawer`);
      }

      milestoneItem.innerHTML = `
        <div class="milestone-number">${index + 1}</div>
        <div class="milestone-info">
          <div class="milestone-name">${junction.name}</div>
          <div class="milestone-details">
            ${junction.elevation ? `${junction.elevation}m` : ''}
            ${junction.description ? `• ${junction.description}` : ''}
          </div>
        </div>
        <button class="milestone-checkmark" data-junction-id="${junction.id}" data-junction-index="${index}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      `;

      // Click on milestone info to center map on junction
      const milestoneInfo = milestoneItem.querySelector('.milestone-info');
      milestoneInfo.addEventListener('click', () => {
        const map = mapManager.getMap();
        if (map) {
          map.invalidateSize();
        }
        // Junction location is [longitude, latitude] array
        const [lon, lat] = junction.location;
        mapManager.setView(lat, lon, 16, { animate: true });
      });

      // Click on checkmark to simulate arriving at junction
      const checkmark = milestoneItem.querySelector('.milestone-checkmark');
      checkmark.addEventListener('click', (e) => {
        e.stopPropagation();
        this.simulateJunctionArrival(junction, index);
      });

      container.appendChild(milestoneItem);
    });
  }

  /**
   * Simulate arriving at a junction (for manual testing)
   */
  async simulateJunctionArrival(junction, index) {
    console.log(`🧪 TEST MODE: Simulating arrival at ${junction.name}`);

    // PHASE 1.6.9: Complete incoming segment before showing route selector
    await this.completeIncomingSegment(junction);

    // Get available segments with proper metadata using junction detector
    const availableSegments = junctionDetector.getAvailableSegments(junction.id);

    // Get completed segment IDs
    const completedSegmentIds = this.currentTrip?.completedSegments?.map(s => s.segmentId) || [];

    // Find recommended segment
    const recommendedSegment = junctionDetector.getRecommendedSegment(junction.id, completedSegmentIds);

    // Trigger junction arrival event
    const data = {
      junction,
      availableSegments,
      recommendedSegment
    };

    this.handleJunctionArrival(data);

    // Update UI - mark milestone as visited in drawer
    // Use .milestone-item selector to avoid selecting map markers
    const milestoneItem = document.querySelector(`.milestone-item[data-junction-id="${junction.id}"]`);
    if (milestoneItem) {
      milestoneItem.classList.add('visited');
      console.log(`✅ Milestone item marked as visited in drawer: ${junction.id}`, milestoneItem.className);
    } else {
      console.warn(`⚠️ Milestone item not found in drawer for junction: ${junction.id}`);
    }

    // Mark junction as completed on map
    layers.markJunctionCompleted(junction.id);

    // Update progress UI
    if (this.currentTrip) {
      this.currentTrip.currentJunction = junction.id;
      progressUI.updateAll();
    }
  }

  /**
   * Complete the incoming segment to a junction (Phase 1.6.9)
   * Finds and completes the segment that ends at this junction
   */
  async completeIncomingSegment(junction) {
    if (!this.routeV2 || !this.currentTrip) {
      return;
    }

    // Find all segments that end at this junction
    const incomingSegments = this.routeV2.segments.filter(seg => seg.to === junction.id);

    if (incomingSegments.length === 0) {
      console.log(`ℹ️ No incoming segments to ${junction.name} (likely start junction)`);
      return;
    }

    // Get already completed segment IDs
    const completedSegmentIds = this.currentTrip.completedSegments?.map(s => s.segmentId) || [];

    // Find the incoming segment that hasn't been completed yet
    // Prefer segments from the last visited junction
    let segmentToComplete = null;

    // Strategy 1: If there's a currently tracking segment, complete it
    if (segmentTracker.isTracking()) {
      const currentSegment = segmentTracker.getCurrentSegment();
      if (currentSegment && currentSegment.to === junction.id) {
        segmentToComplete = currentSegment;
        console.log(`✅ Completing currently tracked segment: ${segmentToComplete.name}`);
      }
    }

    // Strategy 2: Find the most recent uncompleted incoming segment
    if (!segmentToComplete) {
      for (const segment of incomingSegments) {
        if (!completedSegmentIds.includes(segment.id)) {
          segmentToComplete = segment;
          break;
        }
      }
    }

    if (!segmentToComplete) {
      console.log(`ℹ️ All incoming segments to ${junction.name} already completed`);
      return;
    }

    // Create segment data for completion
    const fromJunction = this.routeV2.junctions.find(j => j.id === segmentToComplete.from);
    const segmentData = {
      segment: segmentToComplete,
      destination: junction,
      distance: segmentToComplete.distance,
      estimatedTime: segmentToComplete.estimatedTime,
      transportMode: segmentToComplete.transportMode
    };

    // Complete the segment manually (simulate completion)
    const completedSegment = {
      segmentId: segmentToComplete.id,
      segmentName: segmentToComplete.name,
      from: segmentToComplete.from,
      to: segmentToComplete.to,
      transportMode: segmentToComplete.transportMode,
      startedAt: new Date(Date.now() - (segmentToComplete.estimatedTime || 600) * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      actualDistance: segmentToComplete.distance, // Use expected distance for manual completion
      expectedDistance: segmentToComplete.distance,
      actualTime: segmentToComplete.estimatedTime || 600, // Use expected time
      expectedTime: segmentToComplete.estimatedTime || 600,
      pathPoints: [] // No GPS points for manual completion
    };

    // Add to trip's completed segments
    if (!this.currentTrip.completedSegments) {
      this.currentTrip.completedSegments = [];
    }
    this.currentTrip.completedSegments.push(completedSegment);

    // Save to storage
    await storage.updateTrip(this.currentTrip.tripId, {
      completedSegments: this.currentTrip.completedSegments
    });

    console.log(`✅ Manually completed segment: ${segmentToComplete.name}`);
    console.log(`   From: ${fromJunction?.name || segmentToComplete.from} → To: ${junction.name}`);
    console.log(`   Distance: ${segmentToComplete.distance}m, Time: ${segmentToComplete.estimatedTime}s`);

    // Update statistics
    this.updateDrawerStatistics();
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
    // Phase 1.6: v2 routes use progressUI module
    if (this.useV2Architecture) {
      console.log('📍 v2 route - using progressUI module');
      // Progress is handled by progressUI module (initialized in addV2RouteLayers)
      return;
    }

    // Legacy v1 route progress
    const visitedMilestones = tripManager.getVisitedMilestones();
    const total = this.milestones.features.length;
    const visited = visitedMilestones.length;
    const percentage = (visited / total) * 100;

    // Note: These elements don't exist in v2 UI, only for v1 routes
    const progressText = document.querySelector('.progress-text');
    const progressFill = document.getElementById('progressFill');

    if (progressText) {
      progressText.textContent = `Milestone ${visited} / ${total}`;
    }
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    // Update next milestone
    const visitedIds = visitedMilestones.map(m => m.milestoneId);
    const nextMilestone = this.milestones.features.find(
      (f) => !visitedIds.includes(f.properties.id)
    );

    if (nextMilestone) {
      const nextEl = document.querySelector('#nextMilestone span');
      if (nextEl) {
        nextEl.textContent = `${nextMilestone.properties.name} (${nextMilestone.properties.distance_from_start}km)`;
      }
    } else {
      const nextEl = document.querySelector('#nextMilestone span');
      if (nextEl) {
        nextEl.textContent = 'Journey Complete! 🎉';
      }
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

    // Phase 1.6: For v2 routes, restore completed junctions
    if (this.useV2Architecture) {
      // Get completed segments to determine visited junctions
      const completedSegments = this.currentTrip.completedSegments || [];
      const visitedJunctionIds = new Set();

      // Add all "from" junctions from completed segments
      completedSegments.forEach(seg => {
        const segment = this.routeV2.segments.find(s => s.id === seg.segmentId);
        if (segment) {
          visitedJunctionIds.add(segment.from);
          visitedJunctionIds.add(segment.to);
        }
      });

      // Mark junctions as completed on map
      layers.markJunctionsCompleted(Array.from(visitedJunctionIds));

      // Mark junctions as visited in milestone list
      visitedJunctionIds.forEach(junctionId => {
        const milestoneItem = document.querySelector(`.milestone-item[data-junction-id="${junctionId}"]`);
        if (milestoneItem) {
          milestoneItem.classList.add('visited');
          console.log(`✅ Restored visited state for junction in drawer: ${junctionId}`);
        }
      });
    } else {
      // Load visited milestones for v1 routes
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

    // Update drawer statistics (Phase 1.6.9)
    if (this.useV2Architecture) {
      this.updateDrawerStatistics();
    }

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
      // Show approach notification (Phase 1.6.8)
      notifications.approachingJunction(
        data.junction.name,
        `${Math.round(data.distance)}m`
      );
    });

    junctionDetector.on('junctionArrival', (data) => {
      console.log(`📍 Arrived at junction: ${data.junction.name}`);
      this.handleJunctionArrival(data);
      // Show junction reached notification (Phase 1.6.8)
      notifications.junctionReached(
        data.junction.name,
        data.availableSegments?.length || 0
      );
      // Update progress UI
      progressUI.updateAll();
    });

    junctionDetector.on('junctionDeparture', (data) => {
      console.log(`👋 Departed junction: ${data.junction.name}`);
      // Update progress UI
      progressUI.updateAll();
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
      // Show segment started notification (Phase 1.6.8)
      const distanceKm = (data.segment.distance / 1000).toFixed(1);
      const timeMin = Math.round(data.segment.estimatedTime / 60);
      notifications.segmentStarted(
        data.segment.name,
        `${distanceKm}km`,
        `~${timeMin}min`
      );
      // Update progress UI
      progressUI.updateAll();
    });

    segmentTracker.on('segmentProgress', (data) => {
      console.log(`📊 Segment progress: ${Math.round(data.progress)}% (${Math.round(data.distanceToEnd)}m to go)`);
      // Update segment progress in UI
      progressUI.updateSegmentProgress();
    });

    segmentTracker.on('segmentCompleted', (data) => {
      console.log(`🎉 Segment completed: ${data.segmentName}`);
      console.log(`   Distance: ${data.actualDistance}m (expected: ${data.expectedDistance}m)`);
      console.log(`   Time: ${Math.round(data.actualTime / 60)}min (expected: ${Math.round(data.expectedTime / 60)}min)`);

      // Show segment completed notification (Phase 1.6.8)
      const distanceKm = (data.actualDistance / 1000).toFixed(1);
      const timeMin = Math.round(data.actualTime / 60);
      notifications.segmentCompleted(
        data.segmentName,
        `${distanceKm}km`,
        `${timeMin}min`
      );

      // Update trip data
      if (!this.currentTrip.completedSegments) {
        this.currentTrip.completedSegments = [];
      }
      this.currentTrip.completedSegments.push(data);

      // Update progress UI
      progressUI.updateAll();

      // Update statistics (Phase 1.6.9)
      this.updateDrawerStatistics();
      const statsPanel = document.getElementById('statsPanel');
      if (statsPanel && statsPanel.classList.contains('active')) {
        this.updateStatisticsPanel();
      }
    });

    segmentTracker.on('segmentAbandoned', (data) => {
      console.log(`⚠️ Segment abandoned: ${data.segment.name} (${data.reason})`);
      // Update progress UI
      progressUI.updateAll();
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

    // Transport filter toggle button
    const btnTransportFilter = document.getElementById('btnTransportFilter');
    const transportFilterPanel = document.getElementById('transportFilterPanel');
    const transportFilterPanelOverlay = document.getElementById('transportFilterPanelOverlay');
    const transportFilterPanelClose = document.getElementById('transportFilterPanelClose');

    if (btnTransportFilter && transportFilterPanel) {
      btnTransportFilter.addEventListener('click', () => {
        const isActive = transportFilterPanel.classList.toggle('active');
        btnTransportFilter.dataset.active = isActive;
      });

      // Close transport filter panel when clicking overlay or close button
      if (transportFilterPanelOverlay) {
        transportFilterPanelOverlay.addEventListener('click', () => {
          transportFilterPanel.classList.remove('active');
          btnTransportFilter.dataset.active = 'false';
        });
      }
      if (transportFilterPanelClose) {
        transportFilterPanelClose.addEventListener('click', () => {
          transportFilterPanel.classList.remove('active');
          btnTransportFilter.dataset.active = 'false';
        });
      }
    }

    // Statistics panel toggle button (Phase 1.6.9)
    const btnStatsToggle = document.getElementById('btnStatsToggle');
    const statsPanel = document.getElementById('statsPanel');
    const statsPanelOverlay = document.getElementById('statsPanelOverlay');
    const statsPanelClose = document.getElementById('statsPanelClose');

    if (btnStatsToggle && statsPanel) {
      btnStatsToggle.addEventListener('click', () => {
        const isActive = statsPanel.classList.toggle('active');
        btnStatsToggle.dataset.active = isActive;

        // Update statistics when opening
        if (isActive) {
          this.updateStatisticsPanel();
        }
      });

      // Close stats panel when clicking overlay or close button
      if (statsPanelOverlay) {
        statsPanelOverlay.addEventListener('click', () => {
          statsPanel.classList.remove('active');
          btnStatsToggle.dataset.active = 'false';
        });
      }
      if (statsPanelClose) {
        statsPanelClose.addEventListener('click', () => {
          statsPanel.classList.remove('active');
          btnStatsToggle.dataset.active = 'false';
        });
      }
    }

    // Export buttons (Phase 1.6.9)
    const btnExportJSON = document.getElementById('btnExportJSON');
    const btnExportCSV = document.getElementById('btnExportCSV');
    const btnExportText = document.getElementById('btnExportText');

    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        this.tripStatistics.exportAsJSON();
      });
    }

    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        this.tripStatistics.exportAsCSV();
      });
    }

    if (btnExportText) {
      btnExportText.addEventListener('click', () => {
        const summary = this.tripStatistics.generateTextSummary();
        // Create a text file download
        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip-summary-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Auto center toggle button
    if (btnAutoCenter) {
      // Get saved state from trip
      const autoCenter = this.currentTrip?.settings?.autoCenter || false;
      btnAutoCenter.dataset.active = autoCenter;
      btnAutoCenter.title = `Auto-Center: ${autoCenter ? 'ON' : 'OFF'}`;

      btnAutoCenter.addEventListener('click', () => {
        const isActive = btnAutoCenter.dataset.active === 'true';
        const newState = !isActive;
        btnAutoCenter.dataset.active = newState;
        btnAutoCenter.title = `Auto-Center: ${newState ? 'ON' : 'OFF'}`;

        // Save to trip settings
        if (this.currentTrip && this.currentTrip.tripId) {
          if (!this.currentTrip.settings) this.currentTrip.settings = {};
          this.currentTrip.settings.autoCenter = newState;
          storage.updateTrip(this.currentTrip.tripId, this.currentTrip);
        }

        // Update GPS settings
        gps.updateSettings({ autoCenter: newState });

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
    const transportFilterPanel = document.getElementById('transportFilterPanel');
    const transportFilterCheckboxes = document.getElementById('transportFilterCheckboxes');
    const drawerFilterCheckboxes = document.getElementById('drawerFilterCheckboxes');

    if (!this.routeV2) return;

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

    // Helper function to create checkbox item
    const createCheckboxItem = (mode, count, idPrefix) => {
      const item = document.createElement('div');
      item.className = 'filter-checkbox-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${idPrefix}-${mode}`;
      checkbox.checked = true;
      checkbox.dataset.mode = mode;
      checkbox.className = 'transport-filter-checkbox';

      const label = document.createElement('label');
      label.className = 'filter-checkbox-label';
      label.htmlFor = `${idPrefix}-${mode}`;
      label.innerHTML = `
        <span class="filter-checkbox-icon">${transportIcons[mode] || '🚶'}</span>
        <span>${transportLabels[mode] || mode}</span>
        <span class="filter-checkbox-count">(${count})</span>
      `;

      // Toggle filter on checkbox change and sync with other checkboxes
      checkbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        this.toggleTransportMode(mode, isChecked);

        // Sync all checkboxes for this mode
        document.querySelectorAll(`.transport-filter-checkbox[data-mode="${mode}"]`).forEach(cb => {
          cb.checked = isChecked;
        });
      });

      item.appendChild(checkbox);
      item.appendChild(label);
      return item;
    };

    // Populate transport filter checkboxes in side panel
    if (transportFilterCheckboxes) {
      transportFilterCheckboxes.innerHTML = '';
      Object.entries(transportCounts).forEach(([mode, count]) => {
        transportFilterCheckboxes.appendChild(createCheckboxItem(mode, count, 'filter'));
      });

      // Show transport filter panel
      transportFilterPanel.style.display = 'block';
    }

    // Populate transport filter checkboxes in drawer
    if (drawerFilterCheckboxes) {
      drawerFilterCheckboxes.innerHTML = '';
      Object.entries(transportCounts).forEach(([mode, count]) => {
        drawerFilterCheckboxes.appendChild(createCheckboxItem(mode, count, 'drawer-filter'));
      });
    }

    // Add Show All / Hide All button handlers (side panel)
    const btnShowAll = document.getElementById('btnShowAllTransport');
    const btnHideAll = document.getElementById('btnHideAllTransport');

    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        document.querySelectorAll('.transport-filter-checkbox').forEach(cb => {
          cb.checked = true;
          this.toggleTransportMode(cb.dataset.mode, true);
        });
      });
    }

    if (btnHideAll) {
      btnHideAll.addEventListener('click', () => {
        document.querySelectorAll('.transport-filter-checkbox').forEach(cb => {
          cb.checked = false;
          this.toggleTransportMode(cb.dataset.mode, false);
        });
      });
    }

    // Add Show All / Hide All button handlers (drawer)
    const btnDrawerShowAll = document.getElementById('btnDrawerShowAll');
    const btnDrawerHideAll = document.getElementById('btnDrawerHideAll');

    if (btnDrawerShowAll) {
      btnDrawerShowAll.addEventListener('click', () => {
        document.querySelectorAll('.transport-filter-checkbox').forEach(cb => {
          cb.checked = true;
          this.toggleTransportMode(cb.dataset.mode, true);
        });
      });
    }

    if (btnDrawerHideAll) {
      btnDrawerHideAll.addEventListener('click', () => {
        document.querySelectorAll('.transport-filter-checkbox').forEach(cb => {
          cb.checked = false;
          this.toggleTransportMode(cb.dataset.mode, false);
        });
      });
    }

    // Add collapse/expand button handler for transport filters (drawer)
    const btnDrawerToggleFilters = document.getElementById('btnDrawerToggleFilters');
    if (btnDrawerToggleFilters && drawerFilterCheckboxes) {
      btnDrawerToggleFilters.addEventListener('click', () => {
        const isCollapsed = drawerFilterCheckboxes.classList.toggle('collapsed');
        btnDrawerToggleFilters.dataset.collapsed = isCollapsed;

        // Update icon (minus to plus)
        const svg = btnDrawerToggleFilters.querySelector('svg');
        if (isCollapsed) {
          // Show plus icon
          svg.innerHTML = `
            <line x1="5" y1="12" x2="19" y2="12"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
          `;
        } else {
          // Show minus icon
          svg.innerHTML = `<line x1="5" y1="12" x2="19" y2="12"/>`;
        }
      });
    }

    // Add collapse/expand button handler for milestones
    const btnDrawerToggleMilestones = document.getElementById('btnDrawerToggleMilestones');
    const milestonesList = document.getElementById('milestonesList');
    if (btnDrawerToggleMilestones && milestonesList) {
      btnDrawerToggleMilestones.addEventListener('click', () => {
        const isCollapsed = milestonesList.classList.toggle('collapsed');
        btnDrawerToggleMilestones.dataset.collapsed = isCollapsed;

        // Update icon (minus to plus)
        const svg = btnDrawerToggleMilestones.querySelector('svg');
        if (isCollapsed) {
          // Show plus icon
          svg.innerHTML = `
            <line x1="5" y1="12" x2="19" y2="12"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
          `;
        } else {
          // Show minus icon
          svg.innerHTML = `<line x1="5" y1="12" x2="19" y2="12"/>`;
        }
      });
    }
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

  /**
   * Update statistics panel (Phase 1.6.9)
   */
  updateStatisticsPanel() {
    if (!this.currentTrip || !this.routeV2) {
      return;
    }

    // Update trip statistics module
    this.tripStatistics.update(this.currentTrip, this.routeV2);

    // Get calculations
    const distComp = this.tripStatistics.calculateDistanceComparison();
    const timeComp = this.tripStatistics.calculateTimeComparison();
    const transport = this.tripStatistics.getTransportBreakdown();
    const score = this.tripStatistics.calculateEfficiencyScore();

    // Update overview
    const totalSegments = this.routeV2.segments.length;
    const completedCount = this.currentTrip.completedSegments?.length || 0;
    const progressPercent = totalSegments > 0 ? Math.round((completedCount / totalSegments) * 100) : 0;

    const statsProgress = document.getElementById('statsProgress');
    const statsSegments = document.getElementById('statsSegments');
    if (statsProgress) statsProgress.textContent = `${progressPercent}%`;
    if (statsSegments) statsSegments.textContent = `${completedCount}/${totalSegments}`;

    // Update distance
    const statsActualDist = document.getElementById('statsActualDist');
    const statsRecDist = document.getElementById('statsRecDist');
    const statsDistDiff = document.getElementById('statsDistDiff');

    if (statsActualDist) statsActualDist.textContent = `${this.tripStatistics.formatDistance(distComp.actual)} km`;
    if (statsRecDist) statsRecDist.textContent = `${this.tripStatistics.formatDistance(distComp.recommended)} km`;

    const distDiff = distComp.actual - distComp.recommended;
    const distDiffText = `${distDiff >= 0 ? '+' : ''}${this.tripStatistics.formatDistance(distDiff)} km (${this.tripStatistics.formatPercentage(distComp.percentage)})`;
    if (statsDistDiff) statsDistDiff.textContent = distDiffText;

    // Update time
    const statsActualTime = document.getElementById('statsActualTime');
    const statsRecTime = document.getElementById('statsRecTime');
    const statsTimeDiff = document.getElementById('statsTimeDiff');

    if (statsActualTime) statsActualTime.textContent = this.tripStatistics.formatTime(timeComp.actual);
    if (statsRecTime) statsRecTime.textContent = this.tripStatistics.formatTime(timeComp.recommended);

    const timeDiff = timeComp.actual - timeComp.recommended;
    const timeDiffText = `${timeDiff >= 0 ? '+' : ''}${this.tripStatistics.formatTime(Math.abs(timeDiff))} (${this.tripStatistics.formatPercentage(timeComp.percentage)})`;
    if (statsTimeDiff) statsTimeDiff.textContent = timeDiffText;

    // Update transport breakdown
    const transportBreakdownEl = document.getElementById('statsTransportBreakdown');
    if (transportBreakdownEl) {
      transportBreakdownEl.innerHTML = '';
      transport.forEach(t => {
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
          <span class="stat-label">${this.tripStatistics.getTransportIcon(t.mode)} ${t.mode}</span>
          <span class="stat-value">${this.tripStatistics.formatDistance(t.distance)} km (${Math.round(t.percentage)}%)</span>
        `;
        transportBreakdownEl.appendChild(row);
      });
    }

    // Update efficiency score
    const scoreValue = document.querySelector('.score-value');
    const scoreRoute = document.getElementById('scoreRoute');
    const scoreDist = document.getElementById('scoreDist');
    const scoreTime = document.getElementById('scoreTime');

    if (scoreValue) scoreValue.textContent = score.total;
    if (scoreRoute) scoreRoute.textContent = `${score.routeAdherence}%`;
    if (scoreDist) scoreDist.textContent = `${score.distanceEfficiency}%`;
    if (scoreTime) scoreTime.textContent = `${score.timeEfficiency}%`;
  }

  /**
   * Update drawer statistics section (Phase 1.6.9)
   */
  updateDrawerStatistics() {
    const drawerStatsSection = document.getElementById('drawerStatsSection');

    if (!this.currentTrip || !this.routeV2) {
      console.log('📊 Drawer stats: No trip or route data');
      return;
    }

    if (!drawerStatsSection) {
      console.log('📊 Drawer stats: Element not found');
      return;
    }

    // Show the section if there are completed segments
    const completedCount = this.currentTrip.completedSegments?.length || 0;
    console.log(`📊 Drawer stats: ${completedCount} completed segments`);

    if (completedCount > 0) {
      drawerStatsSection.style.display = 'block';
      console.log('📊 Drawer stats: Section shown');
    } else {
      drawerStatsSection.style.display = 'none';
      console.log('📊 Drawer stats: Section hidden (no completed segments)');
      return;
    }

    // Update trip statistics module
    this.tripStatistics.update(this.currentTrip, this.routeV2);

    // Get calculations
    const distComp = this.tripStatistics.calculateDistanceComparison();
    const timeComp = this.tripStatistics.calculateTimeComparison();
    const transport = this.tripStatistics.getTransportBreakdown();
    const score = this.tripStatistics.calculateEfficiencyScore();

    // Update distance (compact format)
    const distDiff = distComp.actual - distComp.recommended;
    const distText = `${this.tripStatistics.formatDistance(distComp.actual)}km (${distDiff >= 0 ? '+' : ''}${this.tripStatistics.formatDistance(distDiff)}km)`;
    document.getElementById('drawerStatDist').textContent = distText;

    // Update time (compact format)
    const timeDiff = timeComp.actual - timeComp.recommended;
    const timeText = `${this.tripStatistics.formatTime(timeComp.actual)} (${timeDiff >= 0 ? '+' : ''}${this.tripStatistics.formatTime(Math.abs(timeDiff))})`;
    document.getElementById('drawerStatTime').textContent = timeText;

    // Update efficiency
    document.getElementById('drawerStatEfficiency').textContent = `${score.total}/100`;

    // Update transport breakdown
    const transportEl = document.getElementById('drawerStatTransport');
    if (transportEl && transport.length > 0) {
      transportEl.innerHTML = '';
      transport.forEach(t => {
        const item = document.createElement('div');
        item.className = 'drawer-transport-item';
        item.innerHTML = `
          <span>${this.tripStatistics.getTransportIcon(t.mode)} ${t.mode}</span>
          <span>${this.tripStatistics.formatDistance(t.distance)}km (${Math.round(t.percentage)}%)</span>
        `;
        transportEl.appendChild(item);
      });
    }

    // Setup collapse button if not already done
    const btnToggle = document.getElementById('btnDrawerToggleStats');
    const content = document.getElementById('drawerStatsContent');
    if (btnToggle && content && !btnToggle.dataset.initialized) {
      btnToggle.dataset.initialized = 'true';
      btnToggle.addEventListener('click', () => {
        const isCollapsed = content.classList.toggle('collapsed');
        btnToggle.dataset.collapsed = isCollapsed;

        const svg = btnToggle.querySelector('svg');
        if (svg) {
          if (isCollapsed) {
            svg.innerHTML = `
              <line x1="5" y1="12" x2="19" y2="12"/>
              <line x1="12" y1="5" x2="12" y2="19"/>
            `;
          } else {
            svg.innerHTML = `<line x1="5" y1="12" x2="19" y2="12"/>`;
          }
        }
      });
    }

    console.log('📊 Drawer stats: Update complete');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
  });
} else {
  window.app = new App();
  window.app.init();
}

