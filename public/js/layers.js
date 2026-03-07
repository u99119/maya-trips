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
        <div style="
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
    console.log(`📍 Adding segment layer: ${segment.name} (${segment.id})`);

    // Use segment style from config, or defaults
    const style = segment.style || {};
    const defaultStyle = {
      color: style.color || '#2196F3',
      weight: style.weight || 6,  // Increased from 4 to 6 for easier tapping
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
          <div style="min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: ${layerOptions.color};">${segment.name}</h3>
            <p style="margin: 4px 0;"><strong>Transport:</strong> ${transportIcon} ${segment.transportMode}</p>
            <p style="margin: 4px 0;"><strong>Distance:</strong> ${(segment.distance / 1000).toFixed(2)} km</p>
            <p style="margin: 4px 0;"><strong>Est. Time:</strong> ${Math.round(segment.estimatedTime / 60)} min</p>
            <p style="margin: 4px 0;"><strong>Difficulty:</strong> ${difficultyBadge}</p>
            ${segment.elevation ? `<p style="margin: 4px 0;"><strong>Elevation:</strong> +${segment.elevation.gain}m / -${segment.elevation.loss}m</p>` : ''}
            ${segment.requiresTicket ? `<p style="margin: 8px 0 4px 0; color: #FF9800;"><strong>⚠️ Ticket Required</strong></p>` : ''}
            ${segment.description ? `<p style="margin: 8px 0 4px 0;">${segment.description}</p>` : ''}
          </div>
        `;

        featureLayer.bindPopup(popupContent);

        // Store original style and difficulty color
        featureLayer._originalStyle = {
          color: layerOptions.color,
          weight: layerOptions.weight,
          opacity: layerOptions.opacity
        };
        featureLayer._difficultyColor = this.getDifficultyColor(segment.difficulty);
        featureLayer._isHighlighted = false;
        featureLayer._segmentId = segment.id;

        console.log(`Segment ${segment.name}: difficulty=${segment.difficulty}, color=${featureLayer._difficultyColor}`);

        // Desktop: Hover effects (preview)
        featureLayer.on('mouseover', () => {
          if (!featureLayer._isHighlighted) {
            featureLayer.setStyle({
              weight: layerOptions.weight + 2,
              opacity: 1
            });
          }
        });

        featureLayer.on('mouseout', () => {
          if (!featureLayer._isHighlighted) {
            featureLayer.setStyle({
              weight: layerOptions.weight,
              opacity: layerOptions.opacity
            });
          }
        });

        // Click/Tap: First click highlights, second click opens popup
        featureLayer.on('click', (e) => {
          try {
            console.log(`🖱️ CLICK detected on segment: ${segment.name}`);
            console.log(`   Is highlighted: ${featureLayer._isHighlighted}`);

            L.DomEvent.stopPropagation(e);

            if (!featureLayer._isHighlighted) {
              // First click: Highlight with difficulty color
              console.log(`   → Calling highlightSegment()`);
              this.highlightSegment(featureLayer, segment);
              console.log(`   ✅ highlightSegment() completed`);
            } else {
              // Second click: Open popup (default Leaflet behavior will handle this)
              console.log(`   → Opening popup (already highlighted)`);
              // Popup will open automatically, we just need to ensure it's not prevented
            }
          } catch (error) {
            console.error(`❌ Error in click handler:`, error);
            console.error(`   Stack:`, error.stack);
          }
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

    console.log(`✅ Segment layer added to map: ${segment.name}`);
    console.log(`   Layer has ${layer.getLayers().length} features`);

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
   * Highlight segment with difficulty color (Phase 1.6)
   * Used for tap-to-highlight interaction
   */
  highlightSegment(featureLayer, segment) {
    try {
      console.log(`🎨 Highlighting segment: ${segment.name}`);
      console.log(`  Difficulty: ${segment.difficulty}`);
      console.log(`  Difficulty Color: ${featureLayer._difficultyColor}`);
      console.log(`  Original Color: ${featureLayer._originalStyle.color}`);

      // Unhighlight any previously highlighted segment
      console.log(`  Calling unhighlightAllSegments()...`);
      this.unhighlightAllSegments();
      console.log(`  ✅ Unhighlight complete`);

      // Highlight this segment
      console.log(`  Setting new style...`);
      featureLayer.setStyle({
        color: featureLayer._difficultyColor,
        weight: featureLayer._originalStyle.weight + 3,
        opacity: 1
      });
      featureLayer._isHighlighted = true;

      console.log(`  ✅ Applied style - color: ${featureLayer._difficultyColor}, weight: ${featureLayer._originalStyle.weight + 3}`);

      // Blink the transport icon (find junction markers with this segment's transport mode)
      this.blinkTransportIcon(segment);
    } catch (error) {
      console.error(`❌ Error in highlightSegment:`, error);
      console.error(`   Stack:`, error.stack);
    }
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
   * Blink transport icon for 1-2 seconds (Phase 1.6)
   */
  blinkTransportIcon(segment) {
    // Find the junction markers at the start/end of this segment
    // For now, we'll add a visual indicator to the segment itself
    // TODO: If we have separate transport icons on the map, blink those

    console.log(`Blinking transport icon for: ${segment.transportMode}`);

    // We could add a pulsing marker at the segment's midpoint
    // For now, just log it - we can enhance this later if needed
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
   */
  markSegmentCompleted(segmentId) {
    const layerData = this.segmentLayers.get(segmentId);
    if (!layerData) return false;

    layerData.layer.setStyle({
      color: '#4CAF50',
      weight: 5,
      opacity: 0.9
    });

    layerData.completed = true;
    return true;
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
}

export default new Layers();

