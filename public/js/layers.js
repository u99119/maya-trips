/**
 * Layers Module
 * Manages route layers and their visibility
 */

class Layers {
  constructor() {
    this.layers = new Map();
    this.milestoneMarkers = new Map();
    this.map = null;
  }

  /**
   * Initialize layers with map instance
   */
  init(map) {
    this.map = map;
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
    const bounds = L.latLngBounds([]);
    let hasContent = false;

    // Include visible route layers
    this.layers.forEach((layerData) => {
      if (layerData.visible) {
        bounds.extend(layerData.layer.getBounds());
        hasContent = true;
      }
    });

    // Include all milestone markers
    this.milestoneMarkers.forEach((marker) => {
      bounds.extend(marker.getLatLng());
      hasContent = true;
    });

    if (hasContent) {
      this.map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15 // Prevent zooming in too much
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
  }
}

export default new Layers();

