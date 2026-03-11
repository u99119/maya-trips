/**
 * Trip Validator - Validates user-generated trip JSON
 * Supports Trip Template v2.0 format
 */

class TripValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a trip JSON object
   * @param {Object} tripData - The trip JSON to validate
   * @returns {Object} { valid: boolean, errors: [], warnings: [] }
   */
  validate(tripData) {
    this.errors = [];
    this.warnings = [];

    // Run all validation checks
    this.validateSchema(tripData);
    this.validateIds(tripData);
    this.validateCoordinates(tripData);
    this.validateGraph(tripData);
    this.validateRealisticValues(tripData);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Validate required schema fields
   */
  validateSchema(trip) {
    // Required root fields
    const requiredFields = ['id', 'name', 'description', 'region', 'country', 'difficulty', 
                           'estimatedDuration', 'totalDistance', 'junctions', 'segments'];
    
    requiredFields.forEach(field => {
      if (!trip[field]) {
        this.errors.push(`Missing required field: ${field}`);
      }
    });

    // Check version
    if (trip.version && trip.version !== '2.0') {
      this.errors.push(`Unsupported version: ${trip.version}. Expected 2.0`);
    }

    // Check arrays
    if (trip.junctions && !Array.isArray(trip.junctions)) {
      this.errors.push('junctions must be an array');
    }
    if (trip.segments && !Array.isArray(trip.segments)) {
      this.errors.push('segments must be an array');
    }

    // Check for at least one junction and segment
    if (trip.junctions && trip.junctions.length === 0) {
      this.errors.push('Trip must have at least one junction');
    }
    if (trip.segments && trip.segments.length === 0) {
      this.errors.push('Trip must have at least one segment');
    }

    // Validate junction fields
    if (trip.junctions && Array.isArray(trip.junctions)) {
      trip.junctions.forEach((junction, index) => {
        const requiredJunctionFields = ['id', 'name', 'coordinates'];
        requiredJunctionFields.forEach(field => {
          if (!junction[field]) {
            this.errors.push(`Junction ${index}: missing required field '${field}'`);
          }
        });

        // Check coordinates format
        if (junction.coordinates && !Array.isArray(junction.coordinates)) {
          this.errors.push(`Junction ${junction.id || index}: coordinates must be an array`);
        } else if (junction.coordinates && junction.coordinates.length !== 2) {
          this.errors.push(`Junction ${junction.id || index}: coordinates must have exactly 2 values [lat, lon]`);
        }

        // Check outgoingSegments
        if (junction.outgoingSegments && !Array.isArray(junction.outgoingSegments)) {
          this.errors.push(`Junction ${junction.id || index}: outgoingSegments must be an array`);
        }
      });
    }

    // Validate segment fields
    if (trip.segments && Array.isArray(trip.segments)) {
      trip.segments.forEach((segment, index) => {
        const requiredSegmentFields = ['id', 'name', 'from', 'to', 'mode', 'distance', 'estimatedTime', 'path'];
        requiredSegmentFields.forEach(field => {
          if (segment[field] === undefined || segment[field] === null) {
            this.errors.push(`Segment ${segment.id || index}: missing required field '${field}'`);
          }
        });

        // Check path format
        if (segment.path && !Array.isArray(segment.path)) {
          this.errors.push(`Segment ${segment.id || index}: path must be an array`);
        } else if (segment.path && segment.path.length < 2) {
          this.errors.push(`Segment ${segment.id || index}: path must have at least 2 coordinate points`);
        }
      });
    }
  }

  /**
   * Validate ID uniqueness
   */
  validateIds(trip) {
    if (!trip.junctions || !trip.segments) return;

    // Check junction ID uniqueness
    const junctionIds = new Set();
    const duplicateJunctions = [];
    trip.junctions.forEach(junction => {
      if (junctionIds.has(junction.id)) {
        duplicateJunctions.push(junction.id);
      }
      junctionIds.add(junction.id);
    });
    if (duplicateJunctions.length > 0) {
      this.errors.push(`Duplicate junction IDs: ${duplicateJunctions.join(', ')}`);
    }

    // Check segment ID uniqueness
    const segmentIds = new Set();
    const duplicateSegments = [];
    trip.segments.forEach(segment => {
      if (segmentIds.has(segment.id)) {
        duplicateSegments.push(segment.id);
      }
      segmentIds.add(segment.id);
    });
    if (duplicateSegments.length > 0) {
      this.errors.push(`Duplicate segment IDs: ${duplicateSegments.join(', ')}`);
    }

    // Check trip ID format (URL-safe)
    if (trip.id && !/^[a-z0-9_-]+$/.test(trip.id)) {
      this.warnings.push('Trip ID should be URL-safe (lowercase letters, numbers, hyphens, underscores only)');
    }
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(trip) {
    if (!trip.junctions) return;

    trip.junctions.forEach(junction => {
      if (!junction.coordinates || !Array.isArray(junction.coordinates)) return;

      const [lat, lon] = junction.coordinates;

      // Check latitude range (-90 to 90)
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        this.errors.push(`Junction ${junction.id}: invalid latitude ${lat} (must be between -90 and 90)`);
      }

      // Check longitude range (-180 to 180)
      if (typeof lon !== 'number' || lon < -180 || lon > 180) {
        this.errors.push(`Junction ${junction.id}: invalid longitude ${lon} (must be between -180 and 180)`);
      }

      // Warn if coordinates are [0, 0] (likely placeholder)
      if (lat === 0 && lon === 0) {
        this.warnings.push(`Junction ${junction.id}: coordinates are [0, 0] - this may be a placeholder`);
      }
    });

    // Validate segment path coordinates
    if (trip.segments && Array.isArray(trip.segments)) {
      trip.segments.forEach(segment => {
        if (!segment.path || !Array.isArray(segment.path)) return;

        segment.path.forEach((coord, index) => {
          if (!Array.isArray(coord) || coord.length !== 2) {
            this.errors.push(`Segment ${segment.id}: path point ${index} must be [lat, lon] array`);
            return;
          }

          const [lat, lon] = coord;
          if (typeof lat !== 'number' || lat < -90 || lat > 90) {
            this.errors.push(`Segment ${segment.id}: path point ${index} has invalid latitude ${lat}`);
          }
          if (typeof lon !== 'number' || lon < -180 || lon > 180) {
            this.errors.push(`Segment ${segment.id}: path point ${index} has invalid longitude ${lon}`);
          }
        });
      });
    }
  }

  /**
   * Validate graph structure and references
   */
  validateGraph(trip) {
    if (!trip.junctions || !trip.segments) return;

    const junctionIds = new Set(trip.junctions.map(j => j.id));
    const segmentIds = new Set(trip.segments.map(s => s.id));

    // Check for start and end junctions
    const startJunctions = trip.junctions.filter(j => j.isStart === true);
    const endJunctions = trip.junctions.filter(j => j.isEnd === true);

    if (startJunctions.length === 0) {
      this.errors.push('Trip must have at least one start junction (isStart: true)');
    }
    if (endJunctions.length === 0) {
      this.errors.push('Trip must have at least one end junction (isEnd: true)');
    }

    // Validate segment references
    trip.segments.forEach(segment => {
      // Check 'from' junction exists
      if (!junctionIds.has(segment.from)) {
        this.errors.push(`Segment ${segment.id}: 'from' junction '${segment.from}' does not exist`);
      }

      // Check 'to' junction exists
      if (!junctionIds.has(segment.to)) {
        this.errors.push(`Segment ${segment.id}: 'to' junction '${segment.to}' does not exist`);
      }

      // Check for circular segments
      if (segment.from === segment.to) {
        this.errors.push(`Segment ${segment.id}: circular segment (from and to are the same)`);
      }
    });

    // Validate junction outgoing segments
    trip.junctions.forEach(junction => {
      if (!junction.outgoingSegments || !Array.isArray(junction.outgoingSegments)) return;

      junction.outgoingSegments.forEach(segmentId => {
        if (!segmentIds.has(segmentId)) {
          this.errors.push(`Junction ${junction.id}: outgoing segment '${segmentId}' does not exist`);
        }

        // Check that the segment actually starts from this junction
        const segment = trip.segments.find(s => s.id === segmentId);
        if (segment && segment.from !== junction.id) {
          this.errors.push(`Junction ${junction.id}: segment '${segmentId}' does not start from this junction`);
        }
      });
    });

    // Check for orphaned junctions (not reachable from start)
    if (startJunctions.length > 0) {
      const reachable = this.findReachableJunctions(trip);
      trip.junctions.forEach(junction => {
        if (!reachable.has(junction.id) && !junction.isStart) {
          this.warnings.push(`Junction ${junction.id} may not be reachable from any start junction`);
        }
      });
    }
  }

  /**
   * Find all junctions reachable from start junctions
   */
  findReachableJunctions(trip) {
    const reachable = new Set();
    const queue = [];

    // Start from all start junctions
    trip.junctions.forEach(junction => {
      if (junction.isStart) {
        queue.push(junction.id);
        reachable.add(junction.id);
      }
    });

    // BFS to find all reachable junctions
    while (queue.length > 0) {
      const currentId = queue.shift();
      const current = trip.junctions.find(j => j.id === currentId);

      if (!current || !current.outgoingSegments) continue;

      current.outgoingSegments.forEach(segmentId => {
        const segment = trip.segments.find(s => s.id === segmentId);
        if (segment && !reachable.has(segment.to)) {
          reachable.add(segment.to);
          queue.push(segment.to);
        }
      });
    }

    return reachable;
  }

  /**
   * Validate realistic values for distances and times
   */
  validateRealisticValues(trip) {
    if (!trip.segments) return;

    trip.segments.forEach(segment => {
      // Check distance is positive
      if (segment.distance <= 0) {
        this.errors.push(`Segment ${segment.id}: distance must be positive (got ${segment.distance})`);
      }

      // Check time is positive
      if (segment.estimatedTime <= 0) {
        this.errors.push(`Segment ${segment.id}: estimatedTime must be positive (got ${segment.estimatedTime})`);
      }

      // Warn if distance is very large (>100km)
      if (segment.distance > 100000) {
        this.warnings.push(`Segment ${segment.id}: distance is very large (${(segment.distance/1000).toFixed(1)}km) - is this correct?`);
      }

      // Warn if time is very large (>24 hours for minutes, >86400 for seconds)
      const maxTime = segment.estimatedTime > 1440 ? 1440 : 86400; // Assume minutes if < 1440, else seconds
      if (segment.estimatedTime > maxTime) {
        this.warnings.push(`Segment ${segment.id}: estimatedTime is very large (${segment.estimatedTime}) - is this correct?`);
      }

      // Check difficulty values
      const validDifficulties = ['easy', 'moderate', 'hard', 'extreme'];
      if (segment.difficulty && !validDifficulties.includes(segment.difficulty)) {
        this.warnings.push(`Segment ${segment.id}: difficulty '${segment.difficulty}' is not standard (use: easy, moderate, hard, extreme)`);
      }

      // Check transport mode
      const validModes = ['walking', 'driving', 'cycling', 'bus', 'train', 'ropeway', 'helicopter', 'boat', 'battery-car', 'flying'];
      if (segment.mode && !validModes.includes(segment.mode)) {
        this.warnings.push(`Segment ${segment.id}: transport mode '${segment.mode}' is not standard`);
      }
    });

    // Check overall difficulty
    const validDifficulties = ['easy', 'moderate', 'hard', 'extreme'];
    if (trip.difficulty && !validDifficulties.includes(trip.difficulty)) {
      this.warnings.push(`Trip difficulty '${trip.difficulty}' is not standard (use: easy, moderate, hard, extreme)`);
    }
  }
}

// Export singleton instance
export const tripValidator = new TripValidator();

