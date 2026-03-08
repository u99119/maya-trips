/**
 * Layers Module
 * Manages route layers and their visibility
 */

class Layers {
  constructor() {
    this.layers = new Map();
    this.milestoneMarkers = new Map();
    this.junctionMarkers = new Map(); // Phase 1.6: Junction markers
    this.segmentLayers = new Map(); // Phase 1.6: Segment layers
    this.subMilestoneMarkers = new Map(); // Phase 1.6: Sub-milestone markers
    this.map = null;
  }

  /**
   * Initialize layers with map instance
   */
  init(map) {
    // Clear existing layers and markers when reinitializing
    this.layers.clear();
    this.milestoneMarkers.clear();
    this.junctionMarkers.clear();
    this.segmentLayers.clear();
    this.subMilestoneMarkers.clear();
    this.map = map;

    // Add map click listener to unhighlight segments when clicking on empty area
    this.map.on('click', (e) => {
      // Only unhighlight if clicking on the map itself (not on a segment)
      if (e.originalEvent.target.tagName === 'svg' ||
          e.originalEvent.target.classList.contains('leaflet-container')) {
        this.unhighlightAllSegments();
      }
    });
  }

  /**
   * Add a route layer
   */
  addRouteLayer(id, geojson, options = {}) {
    const defaultOptions = {
      color: '#2196F3',
      weight: 4,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round'
    };

    const layerOptions = { ...defaultOptions, ...options };

    const layer = L.geoJSON(geojson, {
      style: layerOptions,
      onEachFeature: (feature, layer) => {
        if (feature.properties && feature.properties.name) {
          layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
        }
      }
    });

    this.layers.set(id, {
      layer,
      visible: true,
      options: layerOptions,
      geojson
    });

    layer.addTo(this.map);
    return layer;
  }

  /**
   * Add milestone markers
   */
  addMilestones(milestones, onMilestoneClick) {
    milestones.features.forEach((feature, index) => {
      const coords = feature.geometry.coordinates;
      const props = feature.properties;

      const marker = this.createMilestoneMarker(
        coords[1], // latitude
        coords[0], // longitude
        index + 1,
        props,
        onMilestoneClick
      );

      this.milestoneMarkers.set(props.id || index, marker);
      marker.addTo(this.map);
    });
  }

  /**
   * Create a milestone marker
   */
  createMilestoneMarker(lat, lng, number, properties, onClick) {
    const icon = L.divIcon({
      className: 'milestone-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #2196F3;
          color: white;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">${number}</div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker([lat, lng], { icon });

    // Create popup content
    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #2196F3;">${properties.name}</h3>
        ${properties.elevation ? `<p style="margin: 4px 0;"><strong>Elevation:</strong> ${properties.elevation}m</p>` : ''}
        ${properties.type ? `<p style="margin: 4px 0;"><strong>Type:</strong> ${properties.type}</p>` : ''}
        ${properties.description ? `<p style="margin: 4px 0;">${properties.description}</p>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent);

    if (onClick) {
      marker.on('click', () => onClick(properties, number));
    }

    return marker;
  }

  /**
   * Update milestone marker style (visited/active)
   */
  updateMilestoneStyle(milestoneId, status) {
    const marker = this.milestoneMarkers.get(milestoneId);
    if (!marker) return;

    let color = '#2196F3'; // default
    if (status === 'visited') color = '#4CAF50';
    if (status === 'active') color = '#FF9800';

    const element = marker.getElement();
    if (element) {
      const div = element.querySelector('div');
      if (div) {
        div.style.background = color;
      }
    }
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer(id, visible) {
    const layerData = this.layers.get(id);
    if (!layerData) return false;

    if (visible) {
      layerData.layer.addTo(this.map);
    } else {
      layerData.layer.remove();
    }

    layerData.visible = visible;
    return true;
  }

  /**
   * Get layer visibility state
   */
  getLayerVisibility(id) {
    const layerData = this.layers.get(id);
    return layerData ? layerData.visible : false;
  }

  /**
   * Get all layers
   */
  getAllLayers() {
    return Array.from(this.layers.entries()).map(([id, data]) => ({
      id,
      visible: data.visible,
      options: data.options
    }));
  }

  /**
   * Fit map to show all visible layers and milestones
   */
  fitBounds() {
    if (!this.map) {
      console.error('Map not initialized');
      return;
    }

    const bounds = L.latLngBounds([]);
    let hasContent = false;

    // Include visible route layers
    this.layers.forEach((layerData) => {
      if (layerData.visible) {
        const layerBounds = layerData.layer.getBounds();
        bounds.extend(layerBounds);
        hasContent = true;
      }
    });

    // Include all milestone markers
    this.milestoneMarkers.forEach((marker) => {
      const markerLatLng = marker.getLatLng();
      bounds.extend(markerLatLng);
      hasContent = true;
    });

    if (hasContent && bounds.isValid()) {
      // Use requestAnimationFrame to ensure DOM is ready, then add delay for map rendering
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (this.map && this.map._loaded) {
            this.map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 14,
              animate: true
            });
          } else {
            console.error('Map not loaded yet, retrying...');
            // Retry after another delay
            setTimeout(() => {
              if (this.map) {
                this.map.fitBounds(bounds, {
                  padding: [50, 50],
                  maxZoom: 14,
                  animate: true
                });
              }
            }, 300);
          }
        }, 200);
      });
    }
  }

  /**
   * Remove all layers
   */
  clear() {
    this.layers.forEach((layerData) => {
      layerData.layer.remove();
    });
    this.layers.clear();

    this.milestoneMarkers.forEach((marker) => {
      marker.remove();
    });
    this.milestoneMarkers.clear();

    this.junctionMarkers.forEach((marker) => {
      marker.remove();
    });
    this.junctionMarkers.clear();

    this.segmentLayers.forEach((layerData) => {
      layerData.layer.remove();
    });
    this.segmentLayers.clear();

    this.subMilestoneMarkers.forEach((marker) => {
      marker.remove();
    });
    this.subMilestoneMarkers.clear();
  }

  // ========================================
  // Phase 1.6: v2 Route Visualization Methods
  // ========================================

  /**
   * Add junction marker (Phase 1.6)
   * @param {Object} junction - Junction object from route config
   */
  addJunctionMarker(junction) {
    const [lng, lat] = junction.location; // GeoJSON format

    // Determine junction icon based on type
    let iconHtml = '';
    let bgColor = '#FF9800'; // Orange for junctions

    if (junction.type === 'start') {
      bgColor = '#4CAF50'; // Green for start
      iconHtml = '🚩';
    } else if (junction.type === 'end') {
      bgColor = '#F44336'; // Red for end
      iconHtml = '🏁';
    } else {
      iconHtml = '🔀'; // Junction icon
    }

    const icon = L.divIcon({
      className: 'junction-marker',
      html: `
        <div class="junction-marker-inner" data-junction-id="${junction.id}" style="
          width: 40px;
          height: 40px;
          background: ${bgColor};
          color: white;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: all 0.3s ease;
        ">${iconHtml}</div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([lat, lng], { icon });

    // Create popup content
    const facilitiesHtml = junction.facilities && junction.facilities.length > 0
      ? `<p style="margin: 4px 0;"><strong>Facilities:</strong> ${junction.facilities.join(', ')}</p>`
      : '';

    const popupContent = `
      <div style="min-width: 220px;">
        <h3 style="margin: 0 0 8px 0; color: ${bgColor};">${junction.name}</h3>
        <p style="margin: 4px 0;"><strong>Type:</strong> ${junction.type}</p>
        ${junction.elevation ? `<p style="margin: 4px 0;"><strong>Elevation:</strong> ${junction.elevation}m</p>` : ''}
        ${facilitiesHtml}
        ${junction.description ? `<p style="margin: 8px 0 4px 0;">${junction.description}</p>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(this.map);

    this.junctionMarkers.set(junction.id, marker);
    return marker;
  }

  /**
   * Add all junctions to map (Phase 1.6)
   * @param {Array} junctions - Array of junction objects
   */
  addJunctions(junctions) {
    junctions.forEach(junction => {
      this.addJunctionMarker(junction);
    });
  }

  /**
   * Add segment layer (Phase 1.6)
   * @param {Object} segment - Segment object from route config
   * @param {Object} geojson - Segment GeoJSON data
   * @param {Object} options - Additional layer options
   */
  addSegmentLayer(segment, geojson, options = {}) {
    // Use segment style from config, or defaults
    const style = segment.style || {};
    const defaultStyle = {
      color: style.color || '#2196F3',
      weight: style.weight || 9,  // Increased from 6 to 9 for easier tapping on mobile
      opacity: style.opacity || 0.8,
      dashArray: style.dashArray || null,
      lineJoin: 'round',
      lineCap: 'round'
    };

    const layerOptions = { ...defaultStyle, ...options };

    const layer = L.geoJSON(geojson, {
      style: layerOptions,
      onEachFeature: (feature, featureLayer) => {
        // Create popup with segment info
        const transportIcon = this.getTransportIcon(segment.transportMode);
        const difficultyBadge = this.getDifficultyBadge(segment.difficulty);

        const popupContent = `
          <div class="segment-popup">
            <div class="segment-popup-title" style="color: ${layerOptions.color}; font-weight: 600;">${segment.name}</div>
            <div class="segment-popup-item"><strong>Transport:</strong> ${transportIcon} ${segment.transportMode}</div>
            <div class="segment-popup-item"><strong>Distance:</strong> ${(segment.distance / 1000).toFixed(2)} km</div>
            <div class="segment-popup-item"><strong>Time:</strong> ${Math.round(segment.estimatedTime / 60)} min</div>
            <div class="segment-popup-item"><strong>Difficulty:</strong> ${difficultyBadge}</div>
            ${segment.elevation ? `<div class="segment-popup-item"><strong>Elevation:</strong> +${segment.elevation.gain}m / -${segment.elevation.loss}m</div>` : ''}
            ${segment.requiresTicket ? `<div class="segment-popup-warning">⚠️ Ticket Required</div>` : ''}
            ${segment.description ? `<div class="segment-popup-desc">${segment.description}</div>` : ''}
          </div>
        `;

        featureLayer.bindPopup(popupContent, {
          maxWidth: 280,
          className: 'segment-popup-container'
        });

        // Add tooltip (hover label) - Phase 1.6.7 enhancement
        const distanceKm = (segment.distance / 1000).toFixed(1);
        const timeMin = Math.round(segment.estimatedTime / 60);
        const tooltipContent = `
          <div style="text-align: center;">
            <strong>${segment.name}</strong><br>
            <span style="font-size: 11px; color: #666;">
              ${distanceKm}km • ${timeMin}min • ${this.getTransportIcon(segment.transportMode)}
            </span>
          </div>
        `;

        featureLayer.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'top',
          className: 'segment-tooltip',
          opacity: 0.9
        });

        // Store original style and difficulty color
        featureLayer._originalStyle = {
          color: layerOptions.color,
          weight: layerOptions.weight,
          opacity: layerOptions.opacity
        };
        featureLayer._difficultyColor = this.getDifficultyColor(segment.difficulty);
        featureLayer._isHighlighted = false;
        featureLayer._segmentId = segment.id;

        // Desktop: Hover effects (preview with difficulty color)
        featureLayer.on('mouseover', () => {
          if (!featureLayer._isHighlighted) {
            featureLayer.setStyle({
              color: featureLayer._difficultyColor,  // Show difficulty color on hover
              weight: layerOptions.weight + 2,
              opacity: 1
            });
          }
        });

        featureLayer.on('mouseout', () => {
          if (!featureLayer._isHighlighted) {
            featureLayer.setStyle({
              color: featureLayer._originalStyle.color,  // Restore original color
              weight: layerOptions.weight,
              opacity: layerOptions.opacity
            });
          }
        });

        // Mobile: Long press to highlight, single tap to open popup
        let longPressTimer = null;
        let isLongPress = false;

        featureLayer.on('mousedown touchstart', (e) => {
          isLongPress = false;
          longPressTimer = setTimeout(() => {
            isLongPress = true;
            // Long press: Highlight with difficulty color
            this.unhighlightAllSegments();

            featureLayer.setStyle({
              color: featureLayer._difficultyColor,
              weight: featureLayer._originalStyle.weight + 3,
              opacity: 1
            });

            featureLayer._isHighlighted = true;
            console.log(`✨ Highlighted (long press): ${segment.name} (${segment.difficulty})`);
          }, 500); // 500ms for long press
        });

        featureLayer.on('mouseup touchend', () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        });

        // Click/Tap: Single tap opens popup directly
        featureLayer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);

          // If it was a long press, don't open popup
          if (isLongPress) {
            isLongPress = false;
            return;
          }

          // Single tap: Open popup directly
          console.log(`📋 Opening popup: ${segment.name}`);
          // Popup will open automatically
        });
      }
    });

    this.segmentLayers.set(segment.id, {
      layer,
      segment,
      visible: true,
      options: layerOptions,
      geojson
    });

    layer.addTo(this.map);
    return layer;
  }

  /**
   * Get transport mode icon (Phase 1.6)
   */
  getTransportIcon(mode) {
    const icons = {
      'walking': '🚶',
      'driving': '🚗',
      'flying': '✈️',
      'battery-car': '🚡',
      'ropeway': '🚠',
      'helicopter': '🚁'
    };
    return icons[mode] || '🚶';
  }

  /**
   * Get difficulty badge HTML (Phase 1.6)
   */
  getDifficultyBadge(difficulty) {
    const badges = {
      'easy': '<span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Easy</span>',
      'moderate': '<span style="background: #FF9800; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Moderate</span>',
      'hard': '<span style="background: #F44336; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Hard</span>'
    };
    return badges[difficulty] || difficulty;
  }

  /**
   * Get difficulty color (Phase 1.6)
   */
  getDifficultyColor(difficulty) {
    const colors = {
      'easy': '#4CAF50',      // Green
      'moderate': '#FF9800',  // Orange
      'hard': '#F44336'       // Red
    };
    return colors[difficulty] || '#2196F3'; // Default to blue
  }



  /**
   * Unhighlight all segments (Phase 1.6)
   */
  unhighlightAllSegments() {
    this.segmentLayers.forEach((layerData) => {
      const layer = layerData.layer;
      layer.eachLayer((featureLayer) => {
        if (featureLayer._isHighlighted) {
          featureLayer.setStyle({
            color: featureLayer._originalStyle.color,
            weight: featureLayer._originalStyle.weight,
            opacity: featureLayer._originalStyle.opacity
          });
          featureLayer._isHighlighted = false;
        }
      });
    });
  }



  /**
   * Add sub-milestone marker (Phase 1.6)
   * @param {Object} subMilestone - Sub-milestone object
   * @param {string} segmentId - Parent segment ID
   */
  addSubMilestoneMarker(subMilestone, segmentId) {
    const [lng, lat] = subMilestone.location; // GeoJSON format

    const icon = L.divIcon({
      className: 'sub-milestone-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #9C27B0;
          color: white;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        ">📍</div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([lat, lng], { icon });

    // Create popup content
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 6px 0; color: #9C27B0;">${subMilestone.name}</h4>
        ${subMilestone.type ? `<p style="margin: 4px 0;"><strong>Type:</strong> ${subMilestone.type}</p>` : ''}
        ${subMilestone.description ? `<p style="margin: 4px 0;">${subMilestone.description}</p>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(this.map);

    const markerId = `${segmentId}-${subMilestone.id}`;
    this.subMilestoneMarkers.set(markerId, marker);
    return marker;
  }

  /**
   * Toggle segment layer visibility (Phase 1.6)
   */
  toggleSegmentLayer(segmentId, visible) {
    const layerData = this.segmentLayers.get(segmentId);
    if (!layerData) return false;

    if (visible) {
      layerData.layer.addTo(this.map);
    } else {
      layerData.layer.remove();
    }

    layerData.visible = visible;
    return true;
  }

  /**
   * Highlight segment (Phase 1.6)
   * Used when segment is active or selected
   */
  highlightSegment(segmentId, color = '#FFD700', weight = 6, animate = true) {
    const layerData = this.segmentLayers.get(segmentId);
    if (!layerData) return false;

    layerData.layer.setStyle({
      color: color,
      weight: weight,
      opacity: 1,
      className: animate ? 'segment-active' : ''
    });

    // Store active state
    layerData.active = true;

    return true;
  }

  /**
   * Reset segment style (Phase 1.6)
   */
  resetSegmentStyle(segmentId) {
    const layerData = this.segmentLayers.get(segmentId);
    if (!layerData) return false;

    layerData.layer.setStyle({
      ...layerData.options,
      className: ''
    });

    // Clear active state
    layerData.active = false;

    return true;
  }

  /**
   * Mark segment as completed (Phase 1.6)
   * Shows green color with checkmark icon
   */
  markSegmentCompleted(segmentId) {
    const layerData = this.segmentLayers.get(segmentId);
    if (!layerData) return false;

    // Style completed segment with green color
    layerData.layer.setStyle({
      color: '#4CAF50',  // Green for completed
      weight: 6,
      opacity: 0.7,
      dashArray: '5, 5'  // Dashed line to distinguish from active
    });

    // Add checkmark to popup
    layerData.layer.eachLayer((featureLayer) => {
      const segment = layerData.segment;
      const transportIcon = this.getTransportIcon(segment.transportMode);
      const difficultyBadge = this.getDifficultyBadge(segment.difficulty);

      const popupContent = `
        <div class="segment-popup">
          <div class="segment-popup-title" style="color: #4CAF50; font-weight: 600;">
            ✅ ${segment.name}
          </div>
          <div class="segment-popup-item" style="color: #4CAF50; font-weight: 600;">Status: Completed</div>
          <div class="segment-popup-item"><strong>Transport:</strong> ${transportIcon} ${segment.transportMode}</div>
          <div class="segment-popup-item"><strong>Distance:</strong> ${(segment.distance / 1000).toFixed(2)} km</div>
          <div class="segment-popup-item"><strong>Time:</strong> ${Math.round(segment.estimatedTime / 60)} min</div>
          <div class="segment-popup-item"><strong>Difficulty:</strong> ${difficultyBadge}</div>
          ${segment.elevation ? `<div class="segment-popup-item"><strong>Elevation:</strong> +${segment.elevation.gain}m / -${segment.elevation.loss}m</div>` : ''}
          ${segment.description ? `<div class="segment-popup-desc">${segment.description}</div>` : ''}
        </div>
      `;

      featureLayer.unbindPopup();
      featureLayer.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'segment-popup-container'
      });
    });

    layerData.completed = true;
    console.log(`✅ Marked segment as completed: ${segmentId}`);
    return true;
  }

  /**
   * Mark segment as active (currently being traveled)
   */
  markSegmentActive(segmentId) {
    const layerData = this.segmentLayers.get(segmentId);
    if (!layerData) return false;

    // Style active segment with bold, pulsing effect
    layerData.layer.setStyle({
      color: '#2196F3',  // Blue for active
      weight: 10,
      opacity: 1,
      className: 'active-segment'  // For CSS animation
    });

    // Add "In Progress" to popup
    layerData.layer.eachLayer((featureLayer) => {
      const segment = layerData.segment;
      const transportIcon = this.getTransportIcon(segment.transportMode);
      const difficultyBadge = this.getDifficultyBadge(segment.difficulty);

      const popupContent = `
        <div class="segment-popup">
          <div class="segment-popup-title" style="color: #2196F3; font-weight: 600;">
            🚶 ${segment.name}
          </div>
          <div class="segment-popup-item" style="color: #2196F3; font-weight: 600;">Status: In Progress</div>
          <div class="segment-popup-item"><strong>Transport:</strong> ${transportIcon} ${segment.transportMode}</div>
          <div class="segment-popup-item"><strong>Distance:</strong> ${(segment.distance / 1000).toFixed(2)} km</div>
          <div class="segment-popup-item"><strong>Time:</strong> ${Math.round(segment.estimatedTime / 60)} min</div>
          <div class="segment-popup-item"><strong>Difficulty:</strong> ${difficultyBadge}</div>
          ${segment.elevation ? `<div class="segment-popup-item"><strong>Elevation:</strong> +${segment.elevation.gain}m / -${segment.elevation.loss}m</div>` : ''}
          ${segment.description ? `<div class="segment-popup-desc">${segment.description}</div>` : ''}
        </div>
      `;

      featureLayer.unbindPopup();
      featureLayer.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'segment-popup-container'
      });
    });

    layerData.active = true;
    console.log(`🚶 Marked segment as active: ${segmentId}`);
    return true;
  }

  /**
   * Load completed segments from trip data
   * @param {Array} completedSegments - Array of completed segment IDs
   */
  loadCompletedSegments(completedSegments) {
    if (!completedSegments || completedSegments.length === 0) {
      console.log('No completed segments to load');
      return;
    }

    console.log(`📊 Loading ${completedSegments.length} completed segments`);

    completedSegments.forEach(segmentData => {
      const segmentId = segmentData.segmentId;
      this.markSegmentCompleted(segmentId);
    });
  }

  /**
   * Fit map to show all v2 route content (Phase 1.6)
   */
  fitBoundsV2() {
    if (!this.map) {
      console.error('Map not initialized');
      return;
    }

    const bounds = L.latLngBounds([]);
    let hasContent = false;

    // Include all junction markers
    this.junctionMarkers.forEach((marker) => {
      bounds.extend(marker.getLatLng());
      hasContent = true;
    });

    // Include visible segment layers
    this.segmentLayers.forEach((layerData) => {
      if (layerData.visible) {
        const layerBounds = layerData.layer.getBounds();
        bounds.extend(layerBounds);
        hasContent = true;
      }
    });

    // Include sub-milestone markers
    this.subMilestoneMarkers.forEach((marker) => {
      bounds.extend(marker.getLatLng());
      hasContent = true;
    });

    if (hasContent && bounds.isValid()) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (this.map && this.map._loaded) {
            this.map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 14,
              animate: true
            });
          }
        }, 200);
      });
    }
  }

  /**
   * Mark a junction as completed (Phase 1.6)
   * @param {string} junctionId - Junction ID to mark as completed
   */
  markJunctionCompleted(junctionId) {
    const markerElement = document.querySelector(`.junction-marker-inner[data-junction-id="${junctionId}"]`);
    if (markerElement) {
      // Add green border and glow effect
      markerElement.style.border = '4px solid #4CAF50';
      markerElement.style.boxShadow = '0 0 0 4px rgba(76, 175, 80, 0.3), 0 2px 8px rgba(0,0,0,0.3)';

      // Add checkmark overlay
      const checkmark = document.createElement('div');
      checkmark.innerHTML = '✓';
      checkmark.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: #4CAF50;
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      markerElement.style.position = 'relative';
      markerElement.appendChild(checkmark);

      console.log(`✅ Junction ${junctionId} marked as completed on map`);
    }
  }

  /**
   * Mark multiple junctions as completed
   * @param {Array<string>} junctionIds - Array of junction IDs
   */
  markJunctionsCompleted(junctionIds) {
    junctionIds.forEach(id => this.markJunctionCompleted(id));
  }
}

export default new Layers();

