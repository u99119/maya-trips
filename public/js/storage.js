/**
 * Storage Module
 * Handles LocalStorage and IndexedDB operations for offline data persistence
 */

const STORAGE_KEYS = {
  ROUTE_STATE: 'route_state',
  VISITED_MILESTONES: 'visited_milestones',
  LAYER_VISIBILITY: 'layer_visibility',
  GPS_SETTINGS: 'gps_settings',
  CURRENT_ROUTE: 'current_route',
  USER_NOTES: 'user_notes'
};

class Storage {
  constructor() {
    this.dbName = 'TravelNavDB';
    this.dbVersion = 1;
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
          notesStore.createIndex('milestoneId', 'milestoneId', { unique: false });
          notesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
          photosStore.createIndex('milestoneId', 'milestoneId', { unique: false });
          photosStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * LocalStorage operations
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Route state management
   */
  saveRouteState(routeId, state) {
    const routeStates = this.getItem(STORAGE_KEYS.ROUTE_STATE, {});
    routeStates[routeId] = {
      ...state,
      lastUpdated: Date.now()
    };
    return this.setItem(STORAGE_KEYS.ROUTE_STATE, routeStates);
  }

  getRouteState(routeId) {
    const routeStates = this.getItem(STORAGE_KEYS.ROUTE_STATE, {});
    return routeStates[routeId] || null;
  }

  /**
   * Visited milestones management
   */
  markMilestoneVisited(routeId, milestoneId) {
    const visited = this.getVisitedMilestones(routeId);
    if (!visited.includes(milestoneId)) {
      visited.push(milestoneId);
      const allVisited = this.getItem(STORAGE_KEYS.VISITED_MILESTONES, {});
      allVisited[routeId] = visited;
      return this.setItem(STORAGE_KEYS.VISITED_MILESTONES, allVisited);
    }
    return true;
  }

  getVisitedMilestones(routeId) {
    const allVisited = this.getItem(STORAGE_KEYS.VISITED_MILESTONES, {});
    return allVisited[routeId] || [];
  }

  clearVisitedMilestones(routeId) {
    const allVisited = this.getItem(STORAGE_KEYS.VISITED_MILESTONES, {});
    delete allVisited[routeId];
    return this.setItem(STORAGE_KEYS.VISITED_MILESTONES, allVisited);
  }

  /**
   * Layer visibility management
   */
  saveLayerVisibility(routeId, layerStates) {
    const allLayers = this.getItem(STORAGE_KEYS.LAYER_VISIBILITY, {});
    allLayers[routeId] = layerStates;
    return this.setItem(STORAGE_KEYS.LAYER_VISIBILITY, allLayers);
  }

  getLayerVisibility(routeId) {
    const allLayers = this.getItem(STORAGE_KEYS.LAYER_VISIBILITY, {});
    return allLayers[routeId] || {};
  }

  /**
   * GPS settings management
   */
  saveGPSSettings(settings) {
    return this.setItem(STORAGE_KEYS.GPS_SETTINGS, settings);
  }

  getGPSSettings() {
    return this.getItem(STORAGE_KEYS.GPS_SETTINGS, {
      enabled: false,
      batterySaver: false,
      autoCenter: true
    });
  }
}

// Export singleton instance
export default new Storage();

