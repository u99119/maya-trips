/**
 * Route Loader v2.0 - Junction-Based Route Graph
 * Loads and validates route config v2.0 with junction-based architecture
 */

class RouteLoaderV2 {
  constructor() {
    this.route = null;
    this.graph = null; // Adjacency list representation
    this.junctionMap = new Map(); // id -> junction object
    this.segmentMap = new Map(); // id -> segment object
  }

  /**
   * Load route from config file
   * @param {string} routeId - Route identifier (e.g., 'vaishno-devi')
   * @returns {Promise<Object>} Loaded route object
   */
  async loadRoute(routeId) {
    try {
      const configPath = `/routes/${routeId}/config-v2.json`;
      const response = await fetch(configPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load route config: ${response.statusText}`);
      }

      const config = await response.json();
      
      // Validate schema version
      if (config.version !== '2.0') {
        throw new Error(`Unsupported route version: ${config.version}. Expected 2.0`);
      }

      this.route = config;
      this.buildGraph();
      this.validateGraph();
      
      console.log(`✅ Route loaded: ${config.name} (${config.junctions.length} junctions, ${config.segments.length} segments)`);
      
      return this.route;
    } catch (error) {
      console.error('❌ Route loading failed:', error);
      throw error;
    }
  }

  /**
   * Build adjacency list graph from junctions and segments
   */
  buildGraph() {
    this.graph = new Map();
    this.junctionMap.clear();
    this.segmentMap.clear();

    // Build junction map
    this.route.junctions.forEach(junction => {
      this.junctionMap.set(junction.id, junction);
      this.graph.set(junction.id, []);
    });

    // Build segment map and adjacency list
    this.route.segments.forEach(segment => {
      this.segmentMap.set(segment.id, segment);
      
      // Add segment to adjacency list
      if (this.graph.has(segment.from)) {
        this.graph.get(segment.from).push(segment);
      }
    });

    console.log('📊 Graph built:', {
      junctions: this.junctionMap.size,
      segments: this.segmentMap.size
    });
  }

  /**
   * Validate graph structure
   * @throws {Error} if validation fails
   */
  validateGraph() {
    const errors = [];

    // 1. Check for at least one start junction
    const startJunctions = this.route.junctions.filter(j => j.type === 'start');
    if (startJunctions.length === 0) {
      errors.push('No start junction found');
    }

    // 2. Check for at least one end junction
    const endJunctions = this.route.junctions.filter(j => j.type === 'end');
    if (endJunctions.length === 0) {
      errors.push('No end junction found');
    }

    // 3. Validate segment references
    this.route.segments.forEach(segment => {
      if (!this.junctionMap.has(segment.from)) {
        errors.push(`Segment ${segment.id}: invalid 'from' junction ${segment.from}`);
      }
      if (!this.junctionMap.has(segment.to)) {
        errors.push(`Segment ${segment.id}: invalid 'to' junction ${segment.to}`);
      }
      if (segment.from === segment.to) {
        errors.push(`Segment ${segment.id}: circular segment (from === to)`);
      }
    });

    // 4. Validate junction outgoing segments
    this.route.junctions.forEach(junction => {
      junction.outgoingSegments?.forEach(segmentId => {
        if (!this.segmentMap.has(segmentId)) {
          errors.push(`Junction ${junction.id}: invalid outgoing segment ${segmentId}`);
        }
      });
    });

    // 5. Check for orphaned junctions (not reachable from start)
    const reachable = this.findReachableJunctions();
    this.junctionMap.forEach((junction, id) => {
      if (!reachable.has(id) && junction.type !== 'start') {
        errors.push(`Junction ${id} is not reachable from any start junction`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Graph validation failed:\n${errors.join('\n')}`);
    }

    console.log('✅ Graph validation passed');
  }

  /**
   * Find all junctions reachable from start junctions (BFS)
   * @returns {Set<string>} Set of reachable junction IDs
   */
  findReachableJunctions() {
    const reachable = new Set();
    const queue = [];

    // Start from all start junctions
    this.route.junctions
      .filter(j => j.type === 'start')
      .forEach(j => {
        queue.push(j.id);
        reachable.add(j.id);
      });

    // BFS traversal
    while (queue.length > 0) {
      const currentId = queue.shift();
      const segments = this.graph.get(currentId) || [];

      segments.forEach(segment => {
        if (!reachable.has(segment.to)) {
          reachable.add(segment.to);
          queue.push(segment.to);
        }
      });
    }

    return reachable;
  }

  /**
   * Load segment GeoJSON file
   * @param {string} segmentId - Segment identifier
   * @returns {Promise<Object>} GeoJSON object
   */
  async loadSegmentGeoJSON(segmentId) {
    const segment = this.segmentMap.get(segmentId);
    if (!segment) {
      throw new Error(`Segment not found: ${segmentId}`);
    }

    try {
      const response = await fetch(segment.geojson);
      if (!response.ok) {
        throw new Error(`Failed to load segment GeoJSON: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Failed to load segment ${segmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get junction by ID
   * @param {string} junctionId - Junction identifier
   * @returns {Object|null} Junction object or null
   */
  getJunction(junctionId) {
    return this.junctionMap.get(junctionId) || null;
  }

  /**
   * Get segment by ID
   * @param {string} segmentId - Segment identifier
   * @returns {Object|null} Segment object or null
   */
  getSegment(segmentId) {
    return this.segmentMap.get(segmentId) || null;
  }

  /**
   * Get all outgoing segments from a junction
   * @param {string} junctionId - Junction identifier
   * @returns {Array<Object>} Array of segment objects
   */
  getOutgoingSegments(junctionId) {
    return this.graph.get(junctionId) || [];
  }

  /**
   * Get all junctions of a specific type
   * @param {string} type - Junction type ('start', 'junction', 'end')
   * @returns {Array<Object>} Array of junction objects
   */
  getJunctionsByType(type) {
    return this.route.junctions.filter(j => j.type === type);
  }

  /**
   * Get recommended path by ID
   * @param {string} pathId - Path identifier
   * @returns {Object|null} Path object or null
   */
  getRecommendedPath(pathId) {
    return this.route.recommendedPaths?.find(p => p.id === pathId) || null;
  }

  /**
   * Get all recommended paths
   * @returns {Array<Object>} Array of path objects
   */
  getAllRecommendedPaths() {
    return this.route.recommendedPaths || [];
  }

  /**
   * Find nearest junction to a location
   * @param {Array<number>} location - [latitude, longitude]
   * @param {number} maxDistance - Maximum distance in meters (default: 100)
   * @returns {Object|null} {junction, distance} or null
   */
  findNearestJunction(location, maxDistance = 100) {
    let nearest = null;
    let minDistance = Infinity;

    this.junctionMap.forEach(junction => {
      const distance = this.calculateDistance(
        location,
        [junction.location[1], junction.location[0]] // Convert to [lat, lng]
      );

      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance;
        nearest = junction;
      }
    });

    return nearest ? { junction: nearest, distance: minDistance } : null;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {Array<number>} point1 - [lat, lng]
   * @param {Array<number>} point2 - [lat, lng]
   * @returns {number} Distance in meters
   */
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = point1[0] * Math.PI / 180;
    const φ2 = point2[0] * Math.PI / 180;
    const Δφ = (point2[0] - point1[0]) * Math.PI / 180;
    const Δλ = (point2[1] - point1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get route metadata
   * @returns {Object} Route metadata
   */
  getRouteInfo() {
    if (!this.route) return null;

    return {
      id: this.route.id,
      name: this.route.name,
      version: this.route.version,
      description: this.route.description,
      region: this.route.region,
      country: this.route.country,
      difficulty: this.route.difficulty,
      estimatedDuration: this.route.estimatedDuration,
      totalDistance: this.route.totalDistance,
      junctionCount: this.junctionMap.size,
      segmentCount: this.segmentMap.size
    };
  }
}

// Export singleton instance
export const routeLoaderV2 = new RouteLoaderV2();

