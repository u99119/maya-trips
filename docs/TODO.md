# TODO & Future Plans

## Current Status

✅ **Phase 1 Complete** - Vaishno Devi route mapping with GPS, milestone toggles, route layers, offline support
✅ **Deployed to Netlify** - https://maya-trips.netlify.app (auto-deploys from GitHub)

## 🚨 CRITICAL: Phase 1.5 - Trip Instance System (IN PROGRESS)

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

- [ ] **Task 1.5.7**: Testing
  - Create multiple trips from same route
  - Verify data isolation
  - Test trip switching
  - Test route switching (mid-trip)
  - Test offline functionality

#### 5. Migration Strategy

**For Existing Users** (after deployment):
- Detect old data format (no tripId)
- Auto-create first trip: "Vaishno Devi - Migrated Trip"
- Migrate visited milestones to new trip
- Preserve all existing progress

---

### Phase 1.6: Multi-Route Trip Architecture (PLANNED)

**Goal**: Support complex multi-route trips with side trips, alternative routes, and junction-based navigation

**Status**: 📋 PLANNED - Detailed design complete, awaiting implementation decision

**Key Concepts:**
- **Route Graph**: Node-based architecture (junctions + segments)
- **Junction Points**: Locations where routes branch/merge
- **Route Segments**: Individual route pieces with relationships (main, alternative, side-trip)
- **Context-Aware Navigation**: Auto-suggest routes based on current location
- **Multi-Segment Tracking**: Track which segments were taken in trip history

**Example Use Case:**
```
Main Route: A → B → C → D → E → F
Side Trip from B: B → M → B (returns to main)
Alternative from C: C → N → P → E (rejoins at E)
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

#### 2. New Route Config Schema (v2.0)

**Route Structure:**
```javascript
{
  "id": "route-id",
  "name": "Route Name",
  "version": "2.0",

  // Junction points (nodes in the graph)
  "junctions": [
    {
      "id": "junction-id",
      "name": "Junction Name",
      "location": [lng, lat],
      "type": "start" | "junction" | "end",
      "availableSegments": ["segment-id-1", "segment-id-2"],
      "proximityRadius": 30 // meters for detection
    }
  ],

  // Route segments (edges in the graph)
  "segments": [
    {
      "id": "segment-id",
      "name": "Segment Name",
      "type": "main" | "alternative" | "side-trip",
      "from": "junction-id-start",
      "to": "junction-id-end",
      "geojson": "path/to/segment.geojson",
      "distance": 1500, // meters
      "estimatedTime": 1800, // seconds
      "difficulty": "easy" | "moderate" | "hard",
      "elevation": { "gain": 100, "loss": 50 },

      // Relationships
      "alternativeTo": "other-segment-id", // if type=alternative
      "requiresTicket": false,
      "optional": true, // for side trips

      // Milestones along this segment
      "milestones": [
        {
          "id": "milestone-id",
          "name": "Milestone Name",
          "location": [lng, lat],
          "distance": 500, // from segment start
          "facilities": ["water", "restroom", "food"]
        }
      ]
    }
  ],

  // Recommended paths (for comparison)
  "recommendedPaths": [
    {
      "id": "fastest",
      "name": "Fastest Route",
      "segments": ["seg-1", "seg-2", "seg-3"],
      "totalDistance": 5000,
      "estimatedTime": 7200
    }
  ],

  // Map layers (same as v1)
  "layers": [...]
}
```

#### 3. Updated Trip Data Model

**Trip object additions:**
```javascript
{
  tripId: "...",
  routeId: "...",

  // NEW: Segment tracking
  segmentHistory: [
    {
      segmentId: "main-a-b",
      startedAt: "2026-03-01T10:00:00Z",
      completedAt: "2026-03-01T10:30:00Z",
      distance: 1500,
      duration: 1800
    }
  ],

  // NEW: Current active segments
  activeSegments: ["main-b-c", "side-b-m"], // Can have multiple if at junction

  // NEW: Junction history
  junctionChoices: [
    {
      junctionId: "junction-b",
      arrivedAt: "2026-03-01T10:30:00Z",
      chosenSegment: "main-b-c",
      availableSegments: ["main-b-c", "side-b-m"]
    }
  ],

  // Existing fields
  visitedMilestones: [...],
  settings: {...},
  stats: {
    totalDistance: 3000,
    totalTime: 3600,

    // NEW: Comparison stats
    recommendedPathId: "fastest",
    distanceVsRecommended: +500, // 500m more than recommended
    timeVsRecommended: -300 // 5 min faster than recommended
  }
}
```

#### 4. Implementation Tasks

- [ ] **Task 1.6.1**: Design & Document Route Graph Schema
  - Finalize junction structure
  - Finalize segment structure with relationships
  - Define segment types and their behaviors
  - Document route.json v2.0 schema
  - Create schema validation rules
  - Document migration guide from v1 to v2

- [ ] **Task 1.6.2**: Update Route Config Loader
  - Add v2 route config parser
  - Add junction loading and validation
  - Add segment loading with relationship parsing
  - Add route graph validation (detect cycles, orphaned nodes)
  - Add recommended path validation
  - Update route cache to support v2 structure

- [ ] **Task 1.6.3**: Convert Vaishno Devi Route to v2
  - Identify junctions (Katra, Ban Ganga, Ardhkuwari, Sanji Chhat, Bhawan)
  - Split existing routes into segments
  - Define segment relationships (main, alternatives, side trips)
  - Create segment GeoJSON files
  - Define recommended paths
  - Test route loading and validation

- [ ] **Task 1.6.4**: Implement Junction Detection System
  - GPS proximity detection for junctions
  - Determine available segments at current junction
  - Junction approach notification (100m warning)
  - Junction arrival detection (30m radius)
  - Load segment options and metadata
  - Handle junction state in app.js

- [ ] **Task 1.6.5**: Build Route Selection UI
  - Junction arrival modal (auto-show)
  - Available segments list with cards
  - Segment comparison display:
    - Distance comparison
    - Time estimate comparison
    - Difficulty indicator
    - Elevation profile preview
  - Segment selection handler
  - "Continue on current route" option
  - Modal animations and transitions

- [ ] **Task 1.6.6**: Implement Multi-Segment Trip Tracking
  - Update trip model with segment tracking fields
  - Segment activation logic (when entering segment)
  - Segment completion detection (reached end junction)
  - Junction choice recording
  - Side trip auto-return logic
  - Trip statistics calculation:
    - Per-segment stats
    - Total trip stats
    - Comparison with recommended path
  - Update storage.js with new trip methods

- [ ] **Task 1.6.7**: Enhanced Map Visualization
  - Render all segments with different styles:
    - Main segments: solid blue
    - Alternative segments: dashed orange
    - Side trips: dotted green
    - Completed segments: solid green
    - Active segment: bold blue
  - Junction markers with special icons
  - Show available segments at current junction (highlight)
  - Segment labels with distance/time
  - Toggle segment visibility by type
  - Legend for segment types

- [ ] **Task 1.6.8**: Update Progress Tracking
  - Milestone tracking per segment
  - Progress bar per segment
  - Overall trip progress (across all segments)
  - Segment completion notifications
  - Update drawer UI to show:
    - Current segment info
    - Completed segments list
    - Upcoming junctions
    - Alternative routes available

- [ ] **Task 1.6.9**: Trip Statistics & Comparison
  - Calculate actual vs. recommended path
  - Distance comparison display
  - Time comparison display
  - Segments taken vs. recommended
  - Efficiency score (optional)
  - Trip summary with segment breakdown

- [ ] **Task 1.6.10**: Testing
  - Test junction detection accuracy
  - Test route selection at junctions
  - Test side trip completion and auto-return
  - Test alternative route switching mid-segment
  - Test segment tracking and history
  - Test trip statistics calculation
  - Test map visualization of all segment types
  - Test offline functionality with v2 routes
  - Test complex multi-segment trips

#### 5. Technical Considerations

**Route Graph Validation:**
- Detect disconnected junctions (orphaned nodes)
- Detect circular dependencies in side trips
- Validate segment relationships (alternativeTo must exist)
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
- Keep v1 Vaishno Devi as reference

#### 6. Estimated Effort

**Total Tasks**: 10 tasks
**Complexity**: High (graph-based architecture, context-aware logic)
**Estimated Time**: 2-3x Phase 1.5 effort

**Dependencies:**
- Phase 1.5 must be complete and tested
- Route graph design must be finalized
- At least one v2 route (Vaishno Devi) for testing

---

## 🔧 Technical Debt & Fixes

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

