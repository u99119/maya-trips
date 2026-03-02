# TODO & Future Plans

## Current Status

✅ **Phase 1 Complete** - Vaishno Devi route mapping with GPS, milestone toggles, route layers, offline support
✅ **Phase 1.5 Complete** - Trip instance system with multiple trips, data isolation, trip management
✅ **Deployed to Cloudflare Pages** - https://maya-trips.pages.dev/ (auto-deploys from GitHub main branch)
✅ **Deployed to Netlify** - https://maya-trips.netlify.app (auto-deploys from GitHub)

## 🚧 ACTIVE: Phase 1.6 - Multi-Route Architecture (IN PROGRESS)

**Branch Strategy:**
- `dev-junction` - Junction-based graph architecture (ACTIVE - Option A)
- `dev-linear` - Linear route with sub-milestones (BACKUP - Option B)
- `dev` - Merged from stable branch after testing
- `main` - Production deployment

**Current Work:** Implementing Option A (Full Junction-Based Architecture) in `dev-junction` branch

## ✅ COMPLETE: Phase 1.5 - Trip Instance System

**Problem Identified**: Current architecture treats routes as single-use, not reusable templates.

**Required Before Phase 2**: Implement trip instance system to support:
- Multiple trips from same route template
- Each trip has isolated data (photos, notes, progress)
- Trip history and management

### Architecture Changes Required

#### 1. Data Model Design

**Route Template** (static, reusable):
```
/public/routes/{route-id}/
  - config.json          # Route metadata
  - route.geojson        # Path geometry
  - milestones.geojson   # Checkpoint locations
```

**Trip Instance** (dynamic, per journey):
```javascript
{
  tripId: "uuid-v4",
  routeId: "vaishno-devi",
  tripName: "May 2024 Family Trip",
  createdAt: "2024-05-15T06:00:00Z",
  startedAt: "2024-05-15T06:30:00Z",
  completedAt: null,
  status: "in-progress", // "planned", "in-progress", "completed", "archived"

  // Trip-specific data
  visitedMilestones: [
    { milestoneId: 1, visitedAt: "2024-05-15T07:15:00Z", lat: 32.98944, lng: 74.93333 }
  ],

  // Settings snapshot
  settings: {
    gpsEnabled: true,
    batterySaver: false,
    autoCenter: true
  },

  // Statistics
  stats: {
    totalDistance: 0,
    totalTime: 0,
    averageSpeed: 0
  }
}
```

**Photos** (attached to trip + milestone):
```javascript
{
  id: "uuid-v4",
  tripId: "trip-uuid",
  milestoneId: 1,
  timestamp: "2024-05-15T07:15:00Z",
  location: { lat: 32.98944, lng: 74.93333 },
  blob: Blob,           // Image data
  thumbnail: Blob,      // Compressed thumbnail
  caption: "At Katra base camp"
}
```

**Notes** (attached to trip + milestone):
```javascript
{
  id: "uuid-v4",
  tripId: "trip-uuid",
  milestoneId: 1,
  timestamp: "2024-05-15T07:15:00Z",
  location: { lat: 32.98944, lng: 74.93333 },
  content: "Started early at 6:30 AM. Weather is perfect!",
  type: "text"          // "text", "voice" (future)
}
```

#### 2. Storage Architecture

**IndexedDB Structure** (update storage.js):

```javascript
// Database: TravelNavDB v2
{
  // Object Stores:

  trips: {
    keyPath: "tripId",
    indexes: ["routeId", "status", "createdAt"]
  },

  photos: {
    keyPath: "id",
    indexes: ["tripId", "milestoneId", "timestamp"]
  },

  notes: {
    keyPath: "id",
    indexes: ["tripId", "milestoneId", "timestamp"]
  },

  routes: {
    keyPath: "id",
    // Cached route configs for offline use
  }
}
```

**LocalStorage** (for current active trip):
```javascript
{
  "currentTripId": "uuid-v4",
  "lastRouteId": "vaishno-devi"
}
```

**Storage Location**:
- ✅ **IndexedDB** (browser storage, ~50MB-100MB+ quota)
- ✅ **Offline-first** - all data stored locally
- ✅ **No backend required** (Phase 1-3)
- ⚠️ **Per-device** - data not synced across devices (Phase 4: optional cloud sync)

**Photo Storage Strategy**:
- Original photos: Compressed to max 1920px width, ~200-500KB each
- Thumbnails: 200px width, ~20-50KB each
- Estimated capacity: 100-200 photos per device (depends on browser quota)

#### 3. UI Changes Required

**New Screens/Components**:

1. **Trip Selection Screen** (new landing page):
   - List of all trips (grouped by route)
   - "Create New Trip" button
   - Trip cards showing: name, route, date, progress, thumbnail

2. **Create Trip Modal**:
   - Select route (dropdown)
   - Enter trip name (default: "{Route} - {Date}")
   - Optional: planned start date
   - Create button

3. **Trip Management**:
   - Switch between trips
   - Archive completed trips
   - Delete trips
   - Export trip data (Phase 3)

4. **In-Trip UI Updates**:
   - Show current trip name in header
   - "Change Trip" button
   - Trip progress persists per instance

**Route Switching Mid-Trip**:
- ✅ **Design Decision Made**: Option C with enhancement
  - Prompt user to save current trip and create new one
  - Enhancement: User can choose to mark current trip as completed or keep in-progress
  - Implemented in Task 1.5.6
- 📝 **Note**: User wants flexibility to change route mid-journey ✅ IMPLEMENTED

#### 4. Implementation Tasks

- [x] **Task 1.5.1**: Update IndexedDB schema (storage.js) ✅ COMPLETE
  - ✅ Added trips object store with indexes (routeId, status, createdAt)
  - ✅ Updated photos/notes stores to include tripId index
  - ✅ Implemented v1 to v2 migration logic (auto-migrates old data)
  - ✅ Added trip CRUD methods:
    - createTrip(routeId, tripName)
    - getTrip(tripId)
    - getAllTrips(filters)
    - updateTrip(tripId, updates)
    - deleteTrip(tripId) - cascades to photos/notes
    - archiveTrip(tripId)
    - startTrip(tripId)
    - completeTrip(tripId)
    - setCurrentTripId(tripId) / getCurrentTripId()
    - markMilestoneVisitedForTrip(tripId, milestoneId, location)
    - getVisitedMilestonesForTrip(tripId)
  - ✅ Build tested successfully

- [x] **Task 1.5.2**: Create Trip Management Module (trips.js) ✅ COMPLETE
  - ✅ Created `public/js/trips.js` with high-level business logic
  - ✅ Trip lifecycle management:
    - init() - Initialize with migration
    - createTrip(routeId, tripName, autoStart)
    - setActiveTrip(tripId) - Set current active trip
    - getCurrentTrip() - Get current trip
    - completeCurrentTrip() - Mark trip as complete
    - archiveTrip(tripId) - Archive trip
    - deleteTrip(tripId) - Delete trip
  - ✅ Trip queries:
    - getAllTripsGrouped() - Get trips grouped by route
    - getTripsForRoute(routeId) - Get trips for specific route
    - getTripSummary(tripId) - Get trip summary for display
    - hasAnyTrips() - Check if user has trips
    - getRecentTrips(limit) - Get recent trips
  - ✅ Milestone management:
    - markMilestoneVisited(milestoneId, location)
    - isMilestoneVisited(milestoneId)
    - getVisitedMilestones()
  - ✅ Utilities:
    - getTripStats(trip) - Calculate trip statistics
    - generateTripName(routeConfig) - Auto-generate trip names
    - loadRouteConfig(routeId) - Load and cache route configs
    - formatDuration(seconds) - Format duration for display
    - formatDate(isoString) - Format dates for display
    - updateTripName(tripId, newName) - Rename trip
  - ✅ Build tested successfully (604.53 KiB precached)

- [x] **Task 1.5.3**: Build Trip Selection UI ✅ COMPLETE
  - ✅ Trip Selection Screen (index.html):
    - Full-screen overlay (z-index: 2000)
    - Centered container (max-width: 600px)
    - Header with title and subtitle
    - Trips list container (dynamically populated)
    - Empty state with icon and message
    - Create trip button (sticky bottom)
  - ✅ Create Trip Modal:
    - Modal overlay with backdrop blur
    - Route selection dropdown
    - Trip name input (optional, auto-generates if empty)
    - Auto-start checkbox
    - Cancel and Create buttons
    - Slide-in animation
  - ✅ Trip Card Component (CSS):
    - Card layout with hover effects
    - Trip title and route name
    - Status badge (planned, in-progress, completed, archived)
    - Meta information (date, duration, milestones)
    - Responsive design
  - ✅ Updated Header:
    - Back button to return to trip list
    - Trip name display below route name
    - Hidden by default (shown when trip active)
  - ✅ UI State Management:
    - Map, drawer, recenter button hidden by default
    - Trip selection screen shown on load
    - All elements toggle visibility based on state
  - ✅ Styling (public/css/app.css):
    - 450+ lines of new CSS
    - Dark mode support for all new components
    - Mobile-first responsive design
    - Smooth animations and transitions
  - ✅ Build tested successfully (614.94 KiB precached)

- [x] **Task 1.5.4**: Update App.js ✅ COMPLETE
  - ✅ Import tripManager module
  - ✅ Initialize tripManager on app load
  - ✅ Trip Selection UI Event Handlers:
    - Create trip button → show modal
    - Modal close/cancel → hide modal
    - Confirm create → handleCreateTrip()
    - Back button → showTripSelection()
  - ✅ Trip Selection Flow:
    - showTripSelection() - hide map, show trip list
    - loadTripsList() - fetch and render trip cards
    - createTripCard() - render individual trip cards
    - showCreateTripModal() / hideCreateTripModal()
    - handleCreateTrip() - validate, create trip, load trip
  - ✅ Trip Loading:
    - loadTrip(tripId) - set active trip, load route, init/update map
    - showMapView() - hide trip selection, show map/header/drawer
    - updateMapForTrip() - clear and re-render map layers
  - ✅ Trip-Scoped State Management:
    - markMilestoneVisited() - uses tripManager.markMilestoneVisited()
    - checkMilestoneProximity() - uses tripManager.isMilestoneVisited()
    - updateProgress() - uses tripManager.getVisitedMilestones()
    - loadTripState() - loads trip settings and visited milestones
  - ✅ Trip-Scoped Settings:
    - saveTripSettings() - saves to trip.settings
    - toggleGPS() - saves gpsEnabled to trip
    - Battery saver / auto center - saves to trip settings
    - saveLayerState() - saves layer visibility to trip settings
  - ✅ UI State Management:
    - isMapView flag to track current view
    - Show/hide appropriate elements based on state
    - Update header with route name and trip name
  - ✅ Build tested successfully (623.37 KiB precached)

- [x] **Task 1.5.5**: Update Storage Methods ✅ COMPLETE
  - ✅ All app.js methods now use trip-scoped storage via tripManager
  - ✅ Deprecated legacy route-scoped methods in storage.js:
    - markMilestoneVisited() → markMilestoneVisitedForTrip()
    - getVisitedMilestones() → getVisitedMilestonesForTrip()
    - saveLayerVisibility() → trip.settings.layerVisibility
    - saveGPSSettings() → trip.settings
    - getGPSSettings() → trip.settings
    - saveRouteState() / getRouteState() → trip object
  - ✅ Legacy methods kept for v1 to v2 migration only
  - ✅ Added @deprecated JSDoc comments to all legacy methods
  - ✅ Build tested successfully (624.14 KiB precached)

- [x] **Task 1.5.6**: Route Switching Logic ✅ COMPLETE
  - ✅ Design decision: Option C with enhancement
    - Prompt user to save current trip and create new one
    - Option to mark current trip as completed or keep in-progress
  - ✅ Added "Switch Route" button to header
  - ✅ Created switch route modal with:
    - New route selection dropdown
    - New trip name input (optional)
    - Checkbox to complete current trip
  - ✅ Implemented JavaScript handlers:
    - showSwitchRouteModal() - Shows modal with form
    - hideSwitchRouteModal() - Hides modal
    - handleSwitchRoute() - Validates input, optionally completes current trip, creates new trip, switches to new trip
  - ✅ Edge cases handled:
    - Validates route selection
    - Prevents switching to same route
    - Optionally completes current trip before switching
    - Creates new trip with auto-start
  - ✅ Build tested successfully (629.50 KiB precached)

- [x] **Task 1.5.7**: Testing (COMPLETE)
  - ✅ Map centering fixed (invalidateSize() race condition)
  - ✅ View Route button works without DevTools
  - ✅ Milestone clicks work without DevTools
  - ✅ Fixed trip list not showing (getAllTripsGrouped returns array)
  - ✅ Fixed GPS auto-center jumping (disabled by default)
  - ✅ Added milestone checkmark buttons
  - ✅ Moved auto-center to map control button (green=ON, blue=OFF)
  - ✅ Create multiple trips from same route
  - ✅ Trip list shows all trips with progress
  - ✅ Can open existing trips from list
  - ✅ Verify data isolation (tested: Trip 1 milestones ≠ Trip 2 milestones)
  - ✅ Test trip switching (works correctly)
  - ✅ Test offline functionality (milestones marked in airplane mode persist after reconnect)
  - ✅ Test on mobile device (works correctly)
  - ⏭️ Test route switching (mid-trip) - SKIPPED (only 1 route available, will test in Phase 1.6)

#### 5. Migration Strategy

**For Existing Users** (after deployment):
- Detect old data format (no tripId)
- Auto-create first trip: "Vaishno Devi - Migrated Trip"
- Migrate visited milestones to new trip
- Preserve all existing progress

---

## 🚧 Phase 1.6: Multi-Route Trip Architecture (IN PROGRESS)

**Goal**: Support complex multi-route trips with dynamic route selection, multiple transport modes, and junction-based navigation

**Status**: � IN PROGRESS - Implementing Option A (Junction-Based) in `dev-junction` branch

**Branch Strategy:**
- **`dev-junction`** (ACTIVE): Full junction-based graph architecture
- **`dev-linear`** (BACKUP): Simpler linear route with sub-milestones
- **`dev`**: Merge target after testing
- **`main`**: Production deployment

**Key Concepts:**
- **Route Graph**: Node-based architecture (junctions + segments)
- **Junction Points**: Decision points where routes branch/merge
- **Route Segments**: Paths between junctions with transport modes (walking, driving, flying, battery-car, ropeway, helicopter)
- **Dynamic Route Selection**: Choose route at each junction based on real-time conditions
- **Multi-Segment Tracking**: Track which segments were taken in trip history
- **Mixed Transport**: Support treks, drives, flights, and combinations

**Example Use Cases:**
```
Use Case 1: Dynamic Route Selection
A (Katra) → B (Banganga) → [CHOICE: C (Main) or X (Shortcut)] → D (Bhawan)

Use Case 2: Mixed Transport
A (Katra) → B (walk) → C (battery car) → D (Bhawan)

Use Case 3: Complex Multi-Path
A → B → [X → Y → Z → D] or [X → Z] or [B → C → D]
```

#### 1. Design Decisions (User Confirmed)

**Route Suggestion Behavior:**
- ✅ **Auto-show modal** when approaching junction with available routes
- Show all available options with comparison data
- User selects which route to take

**Side Trip Completion:**
- ✅ **Auto-return to main route** after completing side trip
- No prompt needed - seamless return to junction point

**Alternative Route Selection:**
- ✅ **Show both routes on map simultaneously** with different styles
- ✅ **Show comparison**: distance, time, difficulty
- ✅ **Allow mid-segment switching** between alternatives

**Trip Statistics:**
- ✅ **Comparison with recommended path**
- Show actual vs. recommended distance/time
- Track which segments were taken

**Backward Compatibility:**
- ✅ **No backward compatibility** with v1 routes
- v2 routes can still represent simple single-route trips
- All v1 functionality achievable with v2 structure

#### 2. Route Config Schema v2.0 (Junction-Based)

**Full Schema Documentation:** See `docs/ROUTE-SCHEMA-V2.md` (to be created)

**Route Structure:**
```javascript
{
  "id": "vaishno-devi",
  "name": "Vaishno Devi Yatra",
  "version": "2.0",

  // Junction points (decision points)
  "junctions": [
    {
      "id": "katra",
      "name": "Katra",
      "location": [74.93333, 32.98944], // [lng, lat]
      "type": "start", // "start" | "junction" | "end"
      "elevation": 2500,
      "facilities": ["food", "water", "medical", "accommodation"],
      "outgoingSegments": ["katra-banganga"] // Available segments from here
    },
    {
      "id": "banganga",
      "name": "Banganga",
      "location": [74.94000, 32.99500],
      "type": "junction", // Decision point!
      "elevation": 2600,
      "facilities": ["food", "water"],
      "outgoingSegments": ["banganga-ardhkuwari", "banganga-shortcut"]
    }
  ],

  // Route segments (paths between junctions)
  "segments": [
    {
      "id": "katra-banganga",
      "name": "Katra to Banganga",
      "from": "katra",
      "to": "banganga",
      "geojson": "routes/vaishno-devi/segments/katra-banganga.geojson",
      "distance": 3000, // meters
      "estimatedTime": 3600, // seconds
      "transportMode": "walking", // "walking" | "driving" | "flying" | "battery-car" | "ropeway" | "helicopter"
      "difficulty": "easy", // "easy" | "moderate" | "hard"
      "elevation": { "gain": 100, "loss": 0 },
      "tags": ["main-route", "walking"],
      "requiresTicket": false,
      "ticketInfo": null,

      // Visual style
      "style": {
        "color": "#2196F3",
        "weight": 4,
        "opacity": 0.8,
        "dashArray": null
      },

      // Sub-milestones along this segment
      "milestones": [
        {
          "id": "darshani-deodhi",
          "name": "Darshani Deodhi",
          "location": [74.93500, 32.99000],
          "distanceFromStart": 500, // meters from segment start
          "facilities": ["water"]
        }
      ]
    }
  ],

  // Recommended paths (for comparison)
  "recommendedPaths": [
    {
      "id": "main",
      "name": "Main Traditional Route",
      "segments": ["katra-banganga", "banganga-ardhkuwari", "ardhkuwari-bhawan"],
      "totalDistance": 13000,
      "estimatedTime": 18000
    },
    {
      "id": "fastest",
      "name": "Fastest Route",
      "segments": ["katra-banganga", "banganga-shortcut", "shortcut-bhawan"],
      "totalDistance": 10000,
      "estimatedTime": 12000
    }
  ]
}
```

#### 3. Updated Trip Data Model (v2.0)

**Trip object with segment tracking:**
```javascript
{
  tripId: "trip_123",
  routeId: "vaishno-devi",
  tripName: "May 2024 Family Trip",
  createdAt: "2024-05-15T06:00:00Z",
  startedAt: "2024-05-15T06:30:00Z",
  completedAt: null,
  status: "in-progress",

  // NEW: Current state
  currentJunction: "banganga", // Current junction ID (null if on segment)
  currentSegment: null, // Current segment ID (null if at junction)

  // NEW: Segment tracking
  completedSegments: [
    {
      segmentId: "katra-banganga",
      startedAt: "2024-05-15T06:00:00Z",
      completedAt: "2024-05-15T07:00:00Z",
      actualDistance: 3100, // GPS tracked
      actualTime: 3600,
      transportMode: "walking"
    }
  ],

  // NEW: Junction history
  junctionChoices: [
    {
      junctionId: "banganga",
      arrivedAt: "2024-05-15T07:00:00Z",
      chosenSegment: "banganga-shortcut",
      availableSegments: ["banganga-ardhkuwari", "banganga-shortcut"]
    }
  ],

  // Existing: Visited milestones (main junctions + sub-milestones)
  visitedMilestones: [
    { milestoneId: "katra", visitedAt: "2024-05-15T06:00:00Z", lat: 32.98944, lng: 74.93333 },
    { milestoneId: "darshani-deodhi", visitedAt: "2024-05-15T06:15:00Z", lat: 32.99000, lng: 74.93500 }
  ],

  // Existing: Settings
  settings: {
    gpsEnabled: true,
    batterySaver: false,
    autoCenter: false
  },

  // NEW: Enhanced statistics
  stats: {
    totalDistance: 3100,
    totalTime: 3600,
    segmentsCompleted: 1,
    segmentsRemaining: 3,

    // Comparison with recommended path
    recommendedPathId: "main",
    distanceVsRecommended: -900, // 900m shorter (took shortcut)
    timeVsRecommended: -1200 // 20 min faster
  }
}
```

#### 4. Implementation Tasks - Option A (Junction-Based) 🔨 ACTIVE

**Branch:** `dev-junction`

- [ ] **Task 1.6.1**: Design & Document Route Graph Schema (2-3 hours)
  - Create `docs/ROUTE-SCHEMA-V2.md` with full schema documentation
  - Finalize junction structure with all fields
  - Finalize segment structure with transport modes
  - Define transport modes: walking, driving, flying, battery-car, ropeway, helicopter
  - Document sub-milestone structure within segments
  - Create schema validation rules
  - Document migration guide from v1 to v2

- [ ] **Task 1.6.2**: Update Route Config Loader (4-5 hours)
  - Create `public/js/route-loader-v2.js` module
  - Parse v2 route config (junctions + segments)
  - Build route graph in memory (adjacency list)
  - Validate graph structure:
    - Detect orphaned junctions
    - Detect invalid segment references
    - Validate outgoingSegments exist
  - Load and cache segment GeoJSON files
  - Validate recommended paths
  - Add backward compatibility check (detect v1 vs v2)

- [ ] **Task 1.6.3**: Convert Vaishno Devi Route to v2 (6-8 hours)
  - Identify all junctions from actual data:
    - 1. Katra (start)
    - 2. Darshani Deodhi (junction)
    - 3. Banganga (junction)
    - 4. Charan Paduka (junction)
    - 5. Ardhkuwari (junction)
    - 6. Himkoti (junction)
    - 7. Sanjichhat (junction)
    - 8. Bhawan (junction/end)
    - 9. Bhairavnath Temple (end)
  - Split existing routes into segments
  - Create segment GeoJSON files for each path
  - Add sub-milestones (5a Garbh Joon Cave, 5b Battery Car Terminal, etc.)
  - Define transport modes per segment
  - Define recommended paths (main, fastest, senior-friendly)
  - Test route loading and validation

- [ ] **Task 1.6.4**: Implement Junction Detection System (4-5 hours)
  - Create `public/js/junction-detector.js` module
  - GPS proximity detection for junctions (30m radius)
  - Junction approach notification (100m warning)
  - Junction arrival detection and state update
  - Determine available segments at current junction
  - Load segment metadata for comparison
  - Update trip state (currentJunction, currentSegment)
  - Handle edge cases (GPS loss, backtracking)

- [ ] **Task 1.6.5**: Build Route Selection UI (6-8 hours)
  - Create junction arrival modal component
  - Auto-show modal when reaching junction
  - Display available segments as cards with:
    - Segment name and description
    - Distance and estimated time
    - Transport mode icon
    - Difficulty indicator
    - Elevation gain/loss
    - Ticket requirement (if any)
  - Segment comparison view (side-by-side)
  - Segment selection handler
  - Update trip with chosen segment
  - Modal animations and transitions
  - "Continue on current route" option (if applicable)

- [ ] **Task 1.6.6**: Implement Multi-Segment Trip Tracking (5-6 hours)
  - Update trip data model in `trips.js`
  - Add segment tracking fields to IndexedDB schema
  - Segment activation logic (when user chooses segment)
  - Segment completion detection (GPS reaches end junction)
  - Record junction choices in trip history
  - Calculate trip statistics:
    - Per-segment distance/time
    - Total trip distance/time
    - Comparison with recommended path
  - Update `storage.js` with new methods:
    - `addCompletedSegment(tripId, segmentData)`
    - `recordJunctionChoice(tripId, junctionData)`
    - `updateCurrentState(tripId, junction, segment)`

- [ ] **Task 1.6.7**: Enhanced Map Visualization (5-6 hours)
  - Update `layers.js` to render segments
  - Render all segments with different styles:
    - Main route: solid blue (#2196F3)
    - Shortcut: dashed orange (#FF9800)
    - Transport (battery/ropeway/heli): solid green (#4CAF50)
    - Completed segments: solid green with checkmarks
    - Active segment: bold blue with animation
  - Junction markers with special icons (decision point icon)
  - Highlight available segments at current junction
  - Segment labels (distance, time, transport mode)
  - Layer toggle for segment types (show/hide by transport mode)
  - Map legend for segment types
  - Sub-milestone markers (smaller dots, clickable popup)

- [ ] **Task 1.6.8**: Update Progress Tracking (4-5 hours)
  - Update milestone drawer to show:
    - Current junction name
    - Current segment info (if on segment)
    - Completed segments list
    - Next junction info
    - Available routes at next junction
  - Progress bar per segment
  - Overall trip progress (% of recommended path)
  - Segment completion notifications
  - Update milestone list to show only main junctions (numbered)
  - Sub-milestones shown only on map (not in drawer)

- [ ] **Task 1.6.9**: Trip Statistics & Comparison (3-4 hours)
  - Create trip statistics view
  - Calculate actual vs. recommended path
  - Display distance comparison (actual vs. recommended)
  - Display time comparison (actual vs. recommended)
  - Show segments taken vs. recommended segments
  - Trip summary with segment breakdown
  - Export trip history as JSON
  - Visual comparison chart (optional)

- [ ] **Task 1.6.10**: Testing (6-8 hours)
  - Test junction detection accuracy (simulate GPS at junctions)
  - Test route selection modal at each junction
  - Test segment tracking and completion
  - Test trip statistics calculation
  - Test map visualization of all segment types
  - Test different transport modes
  - Test complex multi-segment trips
  - Test offline functionality with v2 routes
  - Test on mobile device
  - Test edge cases (GPS loss, backtracking, skipping junctions)

**Total Estimated Effort:** 45-55 hours (~2-3x Phase 1.5)

#### 5. Implementation Tasks - Option B (Linear) 🔖 BACKUP

**Branch:** `dev-linear`

**Note:** This is a simpler fallback approach if Option A proves too complex.

- [ ] **Task 1.6B.1**: Design Linear Route Schema (1-2 hours)
  - Main route with numbered milestones (1, 2, 3...)
  - Sub-milestones (5a, 5b, 7a, 8a, 8b, 9a)
  - Route layers as toggleable overlays
  - Document schema in `docs/ROUTE-SCHEMA-V2-LINEAR.md`

- [ ] **Task 1.6B.2**: Update Route Config Loader (2-3 hours)
  - Parse main milestones and sub-milestones
  - Load route layers (main, shortcut, battery-car, ropeway, helicopter)
  - No junction detection needed

- [ ] **Task 1.6B.3**: Convert Vaishno Devi to Linear v2 (3-4 hours)
  - Main milestones: 1-9 (Katra to Bhairavnath)
  - Sub-milestones: 5a, 5b, 7a, 8a, 8b, 9a
  - Route layers as separate GeoJSON files

- [ ] **Task 1.6B.4**: Implement Sub-Milestone Rendering (2-3 hours)
  - Smaller markers for sub-milestones
  - Clickable popup with info
  - Not shown in drawer list

- [ ] **Task 1.6B.5**: Update Milestone Drawer (2-3 hours)
  - Show only main milestones (numbered)
  - Only main milestones can be ticked

- [ ] **Task 1.6B.6**: Add Route Layer Toggle UI (3-4 hours)
  - Checkboxes in drawer to show/hide layers
  - Different colors for each layer

- [ ] **Task 1.6B.7**: Testing (3-4 hours)
  - Test sub-milestone rendering
  - Test route layer toggles
  - Test milestone ticking (main only)

**Total Estimated Effort:** 16-23 hours (~1.5x Phase 1.5)

**Pros:**
- ✅ Faster to implement
- ✅ Simpler architecture
- ✅ Lower risk

**Cons:**
- ❌ No dynamic route selection
- ❌ No junction-based navigation
- ❌ Limited to static route display

---

#### 6. Technical Considerations (Option A)

**Route Graph Validation:**
- Detect disconnected junctions (orphaned nodes)
- Detect circular dependencies in side trips
- Validate segment relationships
- Ensure all segments have valid from/to junctions

**Performance:**
- Cache route graph in memory
- Efficient junction proximity detection (spatial indexing)
- Lazy-load segment GeoJSON (only active segments)
- Optimize map rendering with many segments

**Edge Cases:**
- User skips junction without choosing (continue on main)
- User backtracks to previous junction
- GPS signal loss at junction
- Multiple junctions in close proximity
- Segment with no alternatives (simple continuation)

**Data Migration:**
- No automatic v1 to v2 migration (breaking change)
- Provide conversion tool/script for route authors
- Document manual conversion process
- Keep v1 Vaishno Devi as reference in separate folder

---

#### 7. Decision Summary

**Chosen Approach:** Option A (Junction-Based) in `dev-junction` branch

**Rationale:**
- ✅ Supports dynamic route selection mid-trip
- ✅ Supports multiple transport modes
- ✅ Foundation for any future route (treks, drives, flights, mixed)
- ✅ Richer trip data and statistics
- ✅ Better user experience

**Backup Plan:** Option B (Linear) in `dev-linear` branch if Option A proves too complex

**Next Steps:**
1. Create `dev-junction` and `dev-linear` branches
2. Start implementation in `dev-junction`
3. Complete Task 1.6.1 (schema design)
4. Test incrementally after each task

---

## � Phase 1.7: Smart Features (PLANNED)

**Status**: 📋 PLANNED - Depends on Phase 1.6 completion

**Goal**: Add intelligent features to enhance user experience

**Branch**: `dev` (merge from `dev-junction` after 1.6 complete)

### Features

#### 1. Best Next Halt Suggestion
- [ ] Analyze current location + time of day
- [ ] Suggest next recommended stop
- [ ] Display: "Next recommended stop: Banganga (500m, 15 min)"
- [ ] Consider user's pace and fatigue
- [ ] Adjust suggestions based on time (e.g., suggest accommodation if evening)

#### 2. Senior-Friendly Route Toggle
- [ ] Add "Senior-Friendly Mode" toggle in settings
- [ ] Highlight easier paths (battery car, ropeway, helicopter)
- [ ] Filter out steep/difficult routes
- [ ] Show rest points more prominently
- [ ] Suggest longer breaks at facilities

#### 3. Emergency Medical Points Highlight
- [ ] Add medical points to route config
- [ ] Red cross markers on map
- [ ] Quick access in drawer ("Nearest Medical: 500m")
- [ ] Distance to nearest medical point
- [ ] Emergency contact quick dial

#### 4. Enhanced Night Mode
- [ ] Adjust map tiles for night visibility
- [ ] Highlight lit paths
- [ ] Show accommodation options
- [ ] Warn about unsafe areas at night
- [ ] Adjust UI brightness

**Estimated Effort:** ~1x Phase 1.5 (20-25 hours)

---

## 📡 Phase 1.8: Offline Map Tiles (LOW PRIORITY)

**Status**: 📋 PLANNED - Low priority, future enhancement

**Goal**: True offline capability with cached map tiles

**Branch**: `dev` (after 1.7 or as separate feature)

### Features

- [ ] Cache map tiles for route area
- [ ] Download tiles for offline use (user-initiated)
- [ ] Storage management (tiles can be large, 50-200MB)
- [ ] Update tiles when online
- [ ] Show download progress
- [ ] Option to delete cached tiles

**Estimated Effort:** ~0.5x Phase 1.5 (10-15 hours)

**Note:** Low priority - current offline mode works for route data, only map tiles need internet on first load

---

## �🔧 Technical Debt & Fixes

### NPM Vulnerabilities

**Status**: ⚠️ Partially addressed, 4 high severity remain

**Issue**: serialize-javascript vulnerability in vite-plugin-pwa dependency chain
- Vulnerability: RCE via RegExp.flags and Date.prototype.toISOString()
- Affected: @rollup/plugin-terser → workbox-build → vite-plugin-pwa

**Actions Taken**:
- [x] Ran `npm audit`
- [x] Attempted `npm audit fix` (no safe fixes available)
- [x] Attempted `npm audit fix --force` (peer dependency conflicts)
- [x] Updated vite-plugin-pwa to latest with --legacy-peer-deps
- [x] Build tested successfully (PWA v1.2.0)

**Current Situation**:
- Vulnerabilities are in dev dependencies (build-time only)
- Not exploitable in production (only affects build process)
- Waiting for upstream fixes in workbox-build/rollup-plugin-terser
- Build and deployment working correctly

**Monitoring**:
- [ ] Check for vite-plugin-pwa updates monthly
- [ ] Re-run `npm audit` after updates
- [ ] Monitor GitHub advisories

**Risk Assessment**: LOW (dev dependencies, not runtime)

---

## Phase 2: Enhanced Features (Depends on Phase 1.5)

### Photo & Notes System (BLOCKED: Requires Phase 1.5)
- [ ] Photo capture at milestones using device camera
- [ ] Photo compression (max 1920px, ~200-500KB)
- [ ] Thumbnail generation (200px, ~20-50KB)
- [ ] Photo storage in IndexedDB per trip instance
- [ ] Photo gallery view per trip/milestone
- [ ] Rich text notes editor
- [ ] Notes storage in IndexedDB per trip instance
- [ ] Attach notes/photos to specific trip + milestone
- [ ] Export trip data (photos + notes) as ZIP/PDF
- [ ] Storage quota management (warn at 80% capacity)

### Multi-Route Selector (BLOCKED: Requires Phase 1.5)
- [ ] Route selection UI when creating trip
- [ ] Browse available routes (route library)
- [ ] Route preview with map and details
- [ ] **Mid-trip route switching** (design decision needed):
  - Option A: Auto-create new trip on route change
  - Option B: Allow multi-route within single trip
  - Option C: Prompt user to save and create new trip
- [ ] Route switching preserves current trip data
- [ ] Recent routes history
- [ ] Route favorites/bookmarks

### Route Statistics & Analytics (BLOCKED: Requires Phase 1.5)
- [ ] Per-trip statistics:
  - Total distance traveled
  - Time spent on trek
  - Average speed calculation
  - Elevation gain/loss tracking
  - Calories burned estimation
- [ ] Trip comparison (compare multiple trips of same route)
- [ ] Personal records and achievements
- [ ] Trip timeline visualization
- [ ] Export statistics as CSV/JSON

---

## Phase 3: Advanced Features (Planned)

### Cloud Backup & Sync
- [ ] Cloud backup for trip data (photos, notes, progress)
- [ ] Cross-device sync (phone, tablet, laptop)
- [ ] Options: Google Drive, Dropbox, or custom backend
- [ ] Automatic backup on trip completion
- [ ] Manual backup/restore functionality
- [ ] Conflict resolution for offline edits
- [ ] **Note**: Currently data stored in IndexedDB (per-device, persistent, not deleted with cookies)

### GPX Import/Export
- [ ] Import GPX files from GPS devices
- [ ] Convert GPX to GeoJSON format
- [ ] Export current route as GPX
- [ ] Share routes with family/friends
- [ ] Batch import multiple routes

### Elevation Profile
- [ ] Elevation graph along route
- [ ] Interactive elevation chart
- [ ] Highlight current position on graph
- [ ] Show elevation at each milestone
- [ ] Gradient/slope indicators

### Weather Integration
- [ ] Current weather at route location
- [ ] Weather forecast for trek day
- [ ] Temperature, humidity, wind speed
- [ ] Weather alerts and warnings
- [ ] Best time to trek suggestions

### Emergency Features
- [ ] Offline emergency instructions
- [ ] Emergency contact quick dial
- [ ] SOS location sharing
- [ ] First aid guide
- [ ] Nearest medical facility info

---

## Phase 4: Route Editing & Creation (Planned)

### Route Editing Capability
- [ ] Edit existing route paths
- [ ] Add/remove waypoints
- [ ] Modify milestone locations
- [ ] Update route metadata
- [ ] Save edited routes locally

### Custom Route Creation
- [ ] Draw routes on map
- [ ] Add custom milestones
- [ ] Set milestone properties
- [ ] Define route variants
- [ ] Route validation

### Adding New Sources/Destinations
- [ ] Add new route from scratch
- [ ] Import from various formats
- [ ] Route templates
- [ ] Community route sharing (optional)
- [ ] Route categories/tags

### Family Shared Progress (Optional Backend)
- [ ] Real-time location sharing
- [ ] Family member tracking
- [ ] Shared milestone completion
- [ ] Group chat/messaging
- [ ] Meeting point suggestions

---

## Technical Improvements

### Performance
- [ ] Optimize tile loading
- [ ] Reduce bundle size further
- [ ] Lazy load route data
- [ ] Implement virtual scrolling for long milestone lists
- [ ] Service worker optimization

### Testing
- [ ] Unit tests for core modules
- [ ] Integration tests
- [ ] E2E tests with Playwright/Cypress
- [ ] Mobile device testing
- [ ] Offline functionality tests

### Security
- [ ] Address npm vulnerabilities (4 high severity)
- [ ] Content Security Policy headers
- [ ] Input validation
- [ ] XSS prevention
- [ ] Secure data storage

### Accessibility
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Font size controls

---

## Platform Support

### iOS Support
- [ ] Test on iPhone
- [ ] Test on iPad
- [ ] iOS-specific PWA optimizations
- [ ] Safari compatibility fixes
- [ ] iOS share functionality

### Desktop Support
- [ ] Responsive design for desktop
- [ ] Keyboard shortcuts
- [ ] Desktop-specific features
- [ ] Multi-window support

---

## Content & Routes

### Additional Routes
- [ ] Research and add more pilgrimage routes
- [ ] Hiking trails
- [ ] City walking tours
- [ ] Bike routes
- [ ] Road trip routes

### Route Data Quality
- [ ] Verify Vaishno Devi GPS coordinates with actual trek data
- [ ] Add more detailed milestone information
- [ ] Include photos of landmarks
- [ ] Add audio guides
- [ ] Multilingual support

---

## GIT WORKFLOW

**Branch Strategy:**
- **`dev`** - Development branch (work here daily, unlimited commits)
- **`main`** - Production branch (deploy only when ready, triggers Cloudflare build)

**Daily workflow:**
1. Work on `dev` branch
2. Commit as many times as needed (no builds triggered)
3. Test locally with `npm run dev`
4. When ready to deploy: merge `dev` → `main` and push

**See:** `docs/GIT-WORKFLOW.md` for detailed commands and best practices

**Build minutes saved:** ~1000 minutes/month by not building on every commit!

---

## UNANSWERED QUESTIONS

### Deployment & Setup
- [x] **Q: Help you deploy to Netlify?**
  - Status: ✅ ANSWERED - Git setup complete, ready to push
  - Context: App tested on dev server, icons generated, app name configured
  - Answer: Git initialized, committed, remote added (u99119/maya-trips)
  - Next: User needs to create GitHub repo and push, then connect to Netlify
  - Guide: See DEPLOYMENT.md for step-by-step instructions

- [x] **Q: Generate the PWA icons?**
  - Status: ✅ ANSWERED - Icons generated and added
  - Context: Icon generator script created at `scripts/generate-icons.html`
  - Answer: User generated icons and added to `public/icons/` folder

- [x] **Q: App name for Netlify deployment?**
  - Status: ✅ ANSWERED - Changed to "Mayank Family Trips"
  - Context: User wanted generic family name, not route-specific
  - Answer: Updated in vite.config.js, index.html, package.json, README.md
  - Changes:
    - PWA name: "Mayank Family Trips"
    - Short name: "Family Trips"
    - Package name: "mayank-family-trips"

- [ ] **Q: Add any additional features?**
  - Status: Pending user input
  - Context: Phase 1 complete, waiting for feature requests

- [ ] **Q: Create tests for the code?**
  - Status: Pending user decision
  - Context: No tests currently implemented
  - Recommendation: Add tests before Phase 2

### Technical Decisions
- [ ] **Q: Should we address the 4 high severity npm vulnerabilities?**
  - Status: Unanswered
  - Context: `npm audit` shows 4 high severity issues
  - Options: Run `npm audit fix --force` or investigate individually

- [ ] **Q: Should we replace MapTiler API key placeholder?**
  - Status: Unanswered
  - Context: MapTiler fallback has placeholder key
  - Impact: Fallback won't work without valid key

- [ ] **Q: Should we verify Vaishno Devi GPS coordinates?**
  - Status: Unanswered
  - Context: Coordinates are approximated based on research
  - Recommendation: Verify with actual GPS data from trek
  - Priority: Low (can be updated later)

- [ ] **Q: Can we reduce fitBounds() delay from 200ms to 50-100ms?**
  - Status: Unanswered - needs testing
  - Context: Race condition fix for map centering (layers.js line 215)
  - Current: 200ms delay to ensure map is fully rendered
  - Issue: Map centering only worked when DevTools was open (slower execution)
  - Fix: Added setTimeout() delay before fitBounds()
  - Question: Can we reduce delay to 50-100ms for better UX?
  - Testing: Test on multiple devices/browsers without DevTools open
  - Priority: Low (200ms works reliably, optimization can wait)

- [x] **Q: Where will photos, notes, etc. be stored?**
  - Status: ✅ ANSWERED
  - Answer: **IndexedDB** (browser storage, offline-first)
  - Storage location: Per-device, local browser storage
  - Capacity: ~50-100MB+ (browser-dependent)
  - Photo strategy: Compressed originals + thumbnails
  - Estimated: 100-200 photos per device
  - Phase 4: Optional cloud sync for cross-device access

- [x] **Q: Need flexibility to change route mid-trip?**
  - Status: ✅ NOTED - Design decision required
  - Context: User wants ability to switch routes during active trip
  - Options documented in Phase 1.5 and Phase 2 Multi-Route Selector
  - Decision needed before implementation

### Feature Priorities
- [ ] **Q: Which Phase 2 feature should be implemented first?**
  - Status: Unanswered
  - Options: Photos, Notes, Multi-route selector, Statistics

- [ ] **Q: Do you want backend integration for family sharing?**
  - Status: Unanswered
  - Context: Currently pure static PWA
  - Impact: Would require backend service (Firebase, Supabase, etc.)

### Design & UX
- [ ] **Q: Any specific UI preferences for Phase 2?**
  - Status: Unanswered
  - Context: Color scheme, icons, layout preferences

- [ ] **Q: Should we add onboarding/tutorial for first-time users?**
  - Status: Unanswered
  - Recommendation: Would improve user experience

### Data & Privacy
- [ ] **Q: Should we add analytics tracking?**
  - Status: Unanswered
  - Options: Google Analytics, Plausible, self-hosted
  - Privacy consideration: User consent required

- [ ] **Q: Data export/backup functionality needed?**
  - Status: Unanswered
  - Context: User data (visited milestones, notes, photos) stored locally

---

## Notes

- All Phase 1 tasks completed successfully
- Build is production-ready
- Documentation is comprehensive
- Architecture is modular and extensible
- Ready for deployment and testing

---

**Last Updated**: 2026-03-01

