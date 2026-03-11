# TODO & Future Plans

## Current Status

✅ **Phase 1 Complete** - Vaishno Devi route mapping with GPS, milestone toggles, route layers, offline support
✅ **Phase 1.5 Complete** - Trip instance system with multiple trips, data isolation, trip management
✅ **Deployed to Cloudflare Pages** - https://maya-trips.pages.dev/ (auto-deploys from GitHub main branch)
✅ **Deployed to Netlify** - https://maya-trips.netlify.app (auto-deploys from GitHub)

## ✅ COMPLETE: Phase 1.6 - Multi-Route Architecture

**Status:** 9/10 tasks complete (90%) - Production deployed ✅

**Branch Strategy:**
- `main` - Production deployment (v2 junction architecture)
- `dev-junction` - Active development branch
- `main-v1-backup` - Archived v1 linear architecture

**Completed Tasks:**
- ✅ Task 1.6.1-1.6.9: All implementation tasks complete
- ⏳ Task 1.6.10: End-to-End Testing (pending real-world GPS testing - see below)

**Next:** Phase 1.7 (Trip Creation Interface) to enable local trip testing

---

## 🆕 NEXT: Phase 1.7 - Trip Creation & Management System (PRIORITY)

**Status:** 📋 PLANNED - Before Phase 2

**Goal:** Enable users to create, import, manage, and edit trips via ChatGPT-assisted workflow and PWA interface

**Branch:** `dev-junction` → `main` when ready

**Estimated Effort:**
- **Core (Tasks 1.7.1-1.7.4):** 8-10 hours
- **Optional ChatGPT Integration (Task 1.7.5):** 4-6 hours (can be done later)
- **Trip Editor (Task 1.7.6):** 3-5 hours
- **Total (all tasks):** 15-21 hours
- **Minimum viable (1.7.1-1.7.4):** 8-10 hours

**Why This First:**
- ✅ Enables testing Phase 1.6 with local trips (real GPS data)
- ✅ Critical for creating test routes near current location
- ✅ Foundation for user-generated content
- ✅ Required before Phase 2 (cloud sync of user trips)

### Task 1.7.1: Trip Template & ChatGPT Integration (1-2 hours)

- [x] Create trip template documentation (`docs/TRIP-TEMPLATE.md`)
- [x] Create trip creation guide (`docs/TRIP-CREATION-GUIDE.md`)
- [ ] Test template with ChatGPT (create sample trip)
- [ ] Refine ChatGPT prompt based on testing
- [ ] Create 2-3 example trips (simple, multi-route, complex)

**Deliverables:**
- ✅ `docs/TRIP-TEMPLATE.md` created
- ✅ `docs/TRIP-CREATION-GUIDE.md` created
- [ ] ChatGPT prompt tested and refined
- [ ] 2-3 example trips generated and validated

### Task 1.7.2: JSON Validation Module (2-3 hours)

- [ ] Create `public/js/trip-validator.js`
- [ ] Implement validation functions:
  - [ ] Schema validation (all required fields present)
  - [ ] ID uniqueness (junctions, segments)
  - [ ] Reference integrity (from/to junctions exist)
  - [ ] Coordinate validation (valid lat/lon)
  - [ ] Distance/time sanity checks
  - [ ] Path validation (minimum 2 points)
  - [ ] outgoingSegments validation
- [ ] Error reporting with specific messages
- [ ] Warning system (non-critical issues)
- [ ] Validation summary (errors, warnings, info)

**Deliverables:**
- [ ] Validation module working
- [ ] Comprehensive error messages
- [ ] Returns structured validation results
- [ ] Unit tests (optional)

### Task 1.7.3: Trip Import UI (3-4 hours)

- [ ] Add "Import Trip" button to menu
- [ ] Create import modal/panel:
  - [ ] JSON text area (paste JSON)
  - [ ] File upload (.json)
  - [ ] Validate button
  - [ ] Validation results display (errors, warnings)
  - [ ] Preview button (enabled only if valid)
- [ ] Map preview mode:
  - [ ] Show all junctions with markers
  - [ ] Show all segments with paths
  - [ ] Highlight start/end junctions
  - [ ] Show trip stats (distance, time, junctions, segments)
  - [ ] Zoom to fit trip bounds
- [ ] Confirm and save workflow
- [ ] Error handling and user feedback
- [ ] Mobile-responsive design

**Deliverables:**
- [ ] Import UI working on desktop and mobile
- [ ] Validation integrated and user-friendly
- [ ] Map preview functional and informative
- [ ] Trip saves to IndexedDB correctly

### Task 1.7.4: Trip Management UI (2-3 hours)

- [ ] Enhance trip list view:
  - [ ] Show trip metadata (created date, source, version)
  - [ ] Delete trip (with confirmation)
  - [ ] Duplicate trip (creates copy with new ID)
  - [ ] Export trip as JSON (download file)
- [ ] Trip details view:
  - [ ] Show all junctions and segments in list
  - [ ] Show trip statistics
  - [ ] View trip on map
- [ ] Bulk operations:
  - [ ] Import multiple trips (batch upload)
  - [ ] Export all trips (single JSON file)
  - [ ] Delete all trips (with strong confirmation)

**Deliverables:**
- [ ] Trip management UI complete
- [ ] View/delete/export functionality working
- [ ] Bulk operations safe and tested

**Note:** Edit functionality moved to Task 1.7.6

---

### Task 1.7.5: ChatGPT Integration within PWA (OPTIONAL - 4-6 hours)

**Status:** Optional enhancement - can be done later

**Goal:** Integrate ChatGPT API directly into PWA for in-app trip creation

**Why Optional:**
- ✅ Requires OpenAI API key (costs money)
- ✅ User can use ChatGPT externally for free
- ✅ Not critical for core functionality
- ✅ Can be added later as enhancement

**Implementation (if/when needed):**

- [ ] Set up OpenAI API integration
  - [ ] API key management (user provides their own key)
  - [ ] Or: Server-side proxy for API calls
- [ ] Create in-app trip creation wizard:
  - [ ] Natural language input form
  - [ ] "Describe your trip" text area
  - [ ] Submit to ChatGPT API
  - [ ] Parse response (extract JSON)
- [ ] Display ChatGPT response:
  - [ ] Show generated JSON
  - [ ] Allow editing before import
  - [ ] Validate and preview
- [ ] Error handling:
  - [ ] API errors
  - [ ] Invalid responses
  - [ ] Retry mechanism
- [ ] Cost management:
  - [ ] Show estimated cost per request
  - [ ] Request confirmation before API call
  - [ ] Usage tracking

**Deliverables (if implemented):**
- [ ] ChatGPT API integrated
- [ ] In-app trip creation wizard
- [ ] Seamless flow: describe → generate → preview → save
- [ ] Cost-effective (user's own API key or minimal server costs)

**Alternative Approaches:**
1. **User's own API key:** User provides their OpenAI API key (stored locally)
2. **Server-side proxy:** Your server makes API calls (you control costs)
3. **Free tier:** Use free ChatGPT web interface (current approach)

**Recommendation:** Start with free ChatGPT web interface (Task 1.7.1), add API integration later if needed.

---

### Task 1.7.6: Trip Editor - Modify Existing Trips (3-5 hours)

**Status:** Planned - after basic import/export works

**Goal:** Allow users to edit trips after importing them

**Why Important:**
- ✅ Fix errors in imported trips
- ✅ Update coordinates after field testing
- ✅ Add/remove junctions and segments
- ✅ Adjust distances and times based on real data
- ✅ Refine trips iteratively

**Implementation:**

- [ ] Trip metadata editor:
  - [ ] Edit trip name, description
  - [ ] Edit region, country
  - [ ] Edit difficulty, estimated duration
  - [ ] Update total distance (auto-calculate option)
- [ ] Junction editor:
  - [ ] Add new junction
  - [ ] Edit existing junction (name, description, coordinates)
  - [ ] Delete junction (with validation - check if used in segments)
  - [ ] Reorder junctions (optional)
  - [ ] Edit facilities list
  - [ ] Mark as start/end
- [ ] Segment editor:
  - [ ] Add new segment (select from/to junctions)
  - [ ] Edit existing segment (name, description, mode, distance, time)
  - [ ] Delete segment (with confirmation)
  - [ ] Edit path coordinates (advanced)
  - [ ] Add/edit/delete sub-milestones
  - [ ] Adjust difficulty
- [ ] Visual editor (advanced):
  - [ ] Click on map to add junction
  - [ ] Drag junctions to adjust coordinates
  - [ ] Draw segments on map
  - [ ] Auto-calculate distances from path
- [ ] Validation:
  - [ ] Real-time validation as user edits
  - [ ] Show errors/warnings
  - [ ] Prevent saving invalid trips
  - [ ] Auto-fix common issues (optional)
- [ ] Save and versioning:
  - [ ] Save as new version (keep history)
  - [ ] Or: Overwrite existing trip
  - [ ] Export edited trip
  - [ ] Undo/redo (optional)

**Deliverables:**
- [ ] Trip editor UI (form-based)
- [ ] Junction CRUD operations
- [ ] Segment CRUD operations
- [ ] Real-time validation
- [ ] Save edited trips
- [ ] Visual map editor (optional, advanced)

**UI Design Considerations:**
- Mobile-friendly (Pixel 9A)
- Compact forms (10-11px fonts)
- Clear validation feedback
- Easy to add/remove items
- Preview changes on map before saving

**Future Enhancements:**
- Visual drag-and-drop editor
- Collaborative editing (Phase 2+)
- Version history and rollback
- Merge trips (combine multiple trips)
- Split trips (break into smaller trips)

### Success Criteria

**Core Functionality (Tasks 1.7.1-1.7.4):**
- ✅ ChatGPT can generate valid trip JSON (external, free)
- ✅ User can paste JSON and import trip
- ✅ Validation catches all errors with helpful messages
- ✅ Map preview shows trip correctly before saving
- ✅ Trip saves and loads properly
- ✅ Can create local test trip for GPS testing
- ✅ Export/import round-trip works perfectly
- ✅ Trip management (view, delete, duplicate, export) works

**Optional Enhancements:**
- ⏳ ChatGPT integrated within PWA (Task 1.7.5 - optional)
- ⏳ Trip editor for modifying existing trips (Task 1.7.6 - planned)

### Testing Plan

1. **ChatGPT Generation Test:**
   - Create 3 different trips with ChatGPT
   - Verify JSON validity
   - Import into PWA

2. **Validation Test:**
   - Test with invalid JSON (missing fields, bad IDs, etc.)
   - Verify error messages are helpful
   - Test edge cases (empty arrays, null values, etc.)

3. **Import Test:**
   - Import via paste
   - Import via file upload
   - Preview on map
   - Save and reload

4. **Real-World Test:**
   - Create trip near current location
   - Import into PWA
   - Test GPS tracking on mobile
   - Verify junction detection works

---

## 📋 Task 1.6.10: End-to-End Testing (PENDING)

**Status:** Deferred until real-world GPS testing is possible

**Goal:** Comprehensive testing to ensure production quality

### Testing Areas

#### 1. Junction Detection Accuracy
- [ ] GPS proximity detection (30m arrival radius)
- [ ] Junction approach warnings (100m)
- [ ] Correct junction identification
- [ ] Multiple junctions in close proximity
- [ ] GPS signal loss at junction
- [ ] Junction detection in tunnels/covered areas

#### 2. Route Selection at Junctions
- [ ] Route selector modal appears on arrival
- [ ] All available segments shown correctly
- [ ] Recommended route highlighted
- [ ] Segment details accurate (distance, time, mode, difficulty)
- [ ] Single-option junctions auto-select
- [ ] Route selection saves to trip history

#### 3. Segment Tracking and Completion
- [ ] Segment starts correctly after selection
- [ ] GPS tracking updates progress
- [ ] Distance calculation accurate
- [ ] ETA updates based on actual pace
- [ ] Segment completion detection
- [ ] Completed segments saved to trip
- [ ] Manual completion via checkmarks works

#### 4. Map Visualization
- [ ] All junctions render correctly
- [ ] All segments render with correct styling
- [ ] Sub-milestones appear
- [ ] Transport mode icons display
- [ ] Difficulty colors accurate
- [ ] Layer toggles work (show/hide)
- [ ] Transport filters work
- [ ] Segment highlighting on tap/click
- [ ] Active segment animation
- [ ] Completed segment styling (green)

#### 5. Trip Statistics Accuracy
- [ ] Distance calculations correct
- [ ] Time tracking accurate
- [ ] Transport mode breakdown correct
- [ ] Efficiency score calculation
- [ ] Route adherence tracking
- [ ] Drawer stats match map stats panel
- [ ] Real-time updates on segment completion
- [ ] Export functions work (JSON, CSV, Text)

#### 6. Offline Functionality
- [ ] App loads without internet
- [ ] Map tiles cached
- [ ] Route data available offline
- [ ] GPS tracking works offline
- [ ] Trip data saves locally
- [ ] Service worker updates
- [ ] Offline indicator shows

#### 7. Mobile Testing (Pixel 9A)
- [ ] All buttons accessible and sized correctly
- [ ] Drawer drag functionality smooth
- [ ] Panels slide in/out smoothly
- [ ] Text readable (10-11px fonts)
- [ ] No UI overlap or clipping
- [ ] Battery usage acceptable
- [ ] Performance smooth (no lag)
- [ ] Touch targets adequate (44px minimum)

#### 8. Edge Cases
- [ ] User skips junction without choosing route
- [ ] User backtracks to previous junction
- [ ] GPS signal loss mid-segment
- [ ] App backgrounded during trip
- [ ] Device rotation during trip
- [ ] Low battery mode
- [ ] Multiple trips active simultaneously
- [ ] Trip deletion with active segment

#### 9. Performance Testing
- [ ] App startup time < 3 seconds
- [ ] Route loading time < 2 seconds
- [ ] Map rendering smooth (60fps)
- [ ] Memory usage stable (no leaks)
- [ ] Battery drain acceptable
- [ ] Storage usage reasonable
- [ ] Network usage minimal

#### 10. Data Integrity
- [ ] Trip state persists across sessions
- [ ] No data loss on app crash
- [ ] IndexedDB data consistent
- [ ] Completed segments accurate
- [ ] Junction choices recorded
- [ ] Statistics calculations correct

### Success Criteria

- ✅ All critical tests pass
- ✅ No data loss scenarios
- ✅ Performance acceptable on target device
- ✅ Offline functionality verified
- ✅ Edge cases handled gracefully
- ✅ Known limitations documented

### Deliverables

- [ ] Test report with findings
- [ ] Bug fixes for critical issues
- [ ] Performance optimizations
- [ ] Updated documentation
- [ ] Known limitations documented

**Note:** Testing will be performed during actual trip to Vaishno Devi or similar location with real GPS movement.

---

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

**Progress**: 5/10 tasks complete (50%)
- ✅ Task 1.6.1 - Route Schema v2.0 designed and documented
- ✅ Task 1.6.2 - Route loader v2 module created with graph validation
- ✅ Task 1.6.3 - Vaishno Devi converted to v2 format (9 junctions, 11 segments)
- ✅ Task 1.6.4 - Junction detection module with GPS proximity and events
- ✅ Task 1.6.5 - Route Selection UI with segment comparison cards
- ⏳ Task 1.6.6 - Segment Tracking (NEXT)
- 🔄 **INTEGRATION CHECKPOINT** after Task 1.6.6 (see below)

**⚠️ IMPORTANT - Implementation vs Testing Status:**

**What's Been Done (Tasks 1.6.1-1.6.5):**
- ✅ Module code written (route-loader-v2.js, junction-detector.js, route-selector.js)
- ✅ HTML/CSS created for route selection modal
- ✅ Vaishno Devi v2 config and GeoJSON files created
- ✅ Documentation updated

**What's NOT Done Yet (Critical):**
- ❌ **Integration** - Modules not imported/initialized in main app
- ❌ **Testing** - No manual or automated testing performed
- ❌ **Error Handling** - GPS failures, network issues, invalid data
- ❌ **Mobile Testing** - Not tested on actual devices
- ❌ **Build Verification** - Not tested in production build
- ❌ **Real GPS Testing** - Detection radii not validated with real coordinates

**Time Estimates Explained:**
- Original estimates (2-8 hours per task) included: Design + Implementation + Testing + Integration + Iteration
- Actual time spent (20-45 min per task) was: Design + Implementation only
- Remaining work per task: Testing (1-2h) + Integration (30min-1h) + Bug fixes (1-2h)

**Approach: Hybrid (Option 3) - ACTIVE:**
1. ✅ Complete Tasks 1.6.1-1.6.5 (implementation only)
2. ⏳ Complete Task 1.6.6 (Segment Tracking implementation)
3. 🔄 **INTEGRATION CHECKPOINT** - Stop and integrate/test everything
4. ✅ Continue Tasks 1.6.7-1.6.10 after validation

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

**Legend:**
- ✅ Implementation complete
- 🧪 Testing pending
- 🔗 Integration pending

---

- [✅] **Task 1.6.1**: Design & Document Route Graph Schema (2-3 hours) - COMPLETE
  - ✅ Create `docs/ROUTE-SCHEMA-V2.md` with full schema documentation (337 lines)
  - ✅ Finalize junction structure with all fields
  - ✅ Finalize segment structure with transport modes
  - ✅ Define transport modes: walking, driving, flying, battery-car, ropeway, helicopter
  - ✅ Document sub-milestone structure within segments
  - ✅ Create schema validation rules
  - ✅ Document migration guide from v1 to v2
  - 🧪 **Testing Pending:** Schema validation against actual route files

- [✅] **Task 1.6.2**: Update Route Config Loader (4-5 hours) - COMPLETE
  - ✅ Create `public/js/route-loader-v2.js` module (313 lines)
  - ✅ Parse v2 route config (junctions + segments)
  - ✅ Build route graph in memory (adjacency list)
  - ✅ Validate graph structure (orphaned junctions, invalid segments, circular refs)
  - ✅ Load and cache segment GeoJSON files
  - ✅ Validate recommended paths
  - ✅ Add query API (getJunction, getSegment, getOutgoingSegments, findNearestJunction)
  - 🔗 **Integration Pending:** Not imported in main app yet
  - 🧪 **Testing Pending:**
    - [ ] Load Vaishno Devi v2 config
    - [ ] Verify graph structure in console
    - [ ] Test all 11 segment GeoJSON files load
    - [ ] Test findNearestJunction with real coordinates
    - [ ] Test graph validation catches errors

- [✅] **Task 1.6.3**: Convert Vaishno Devi Route to v2 (6-8 hours) - COMPLETE
  - ✅ Created config-v2.json with 9 junctions, 11 segments
  - ✅ Identified all junctions: Katra, Darshani Deodhi, Banganga, Charan Paduka, Ardhkuwari, Himkoti, Sanjichhat, Bhawan, Bhairavnath
  - ✅ Created 11 segment GeoJSON files
  - ✅ Added 6 sub-milestones (5a Garbh Joon, 5b Battery Terminal, 7a Helicopter, 8a Accommodation, 8b Darshan Queue, 9a Ropeway)
  - ✅ Defined transport modes per segment (walking, battery-car, ropeway)
  - ✅ Defined 3 recommended paths (main-traditional, shortcut-route, senior-friendly)
  - ✅ Added 4 emergency medical points
  - ✅ Moved v1 files to legacy folder
  - 🧪 **Testing Pending:**
    - [ ] Verify all junction coordinates are accurate
    - [ ] Test GeoJSON paths render correctly on map
    - [ ] Validate segment distances match actual paths
    - [ ] Test recommended paths are valid (all segments exist)

- [✅] **Task 1.6.4**: Implement Junction Detection System (4-5 hours) - COMPLETE
  - ✅ Create `public/js/junction-detector.js` module (322 lines)
  - ✅ GPS proximity detection (30m arrival, 100m approach)
  - ✅ Event system (junctionApproach, junctionArrival, junctionDeparture)
  - ✅ Available segments determination
  - ✅ Recommended segment calculation
  - ✅ ETA calculation and formatting
  - ✅ Configurable detection/approach radius
  - 🔗 **Integration Pending:** Not initialized in main app yet
  - 🧪 **Testing Pending:**
    - [ ] Test detection at Katra: 32.98944, 74.93333
    - [ ] Test detection at Banganga: 32.99500, 74.94000
    - [ ] Test detection at Sanjichhat: 33.03500, 74.97500
    - [ ] Test 30m radius is appropriate (might need adjustment)
    - [ ] Test approach warning at 100m
    - [ ] Test departure detection
    - [ ] Test with GPS accuracy variations

- [✅] **Task 1.6.5**: Build Route Selection UI (6-8 hours) - COMPLETE
  - ✅ Added route selection modal HTML to index.html
  - ✅ Created CSS styles for segment cards (205 lines)
  - ✅ Create `public/js/route-selector.js` module (323 lines)
  - ✅ Junction arrival modal with icon and junction info
  - ✅ Segment comparison cards with distance, time, transport, difficulty
  - ✅ Transport mode icons (6 modes)
  - ✅ Difficulty badges (easy, moderate, hard) with color coding
  - ✅ Recommended segment highlighting
  - ✅ Ticket requirement display
  - ✅ Auto-selection for single-option junctions
  - ✅ Segment selection handler
  - ✅ Modal animations and transitions
  - 🔗 **Integration Pending:** Not connected to junction-detector events yet
  - 🧪 **Testing Pending:**
    - [ ] Test modal appears on junction arrival
    - [ ] Test segment cards render correctly
    - [ ] Test all transport icons display
    - [ ] Test difficulty badges show correct colors
    - [ ] Test recommended badge highlights correct segment
    - [ ] Test ticket warning appears when required
    - [ ] Test segment selection updates state
    - [ ] Test "Skip for Now" button
    - [ ] Test modal close button
    - [ ] Test on mobile (touch interactions)
    - [ ] Test with 2, 3, 4+ segment options

- [✅] **Task 1.6.6**: Implement Multi-Segment Trip Tracking (5-6 hours) - COMPLETE
  - ✅ Created `public/js/segment-tracker.js` module (472 lines)
  - ✅ Segment tracking with GPS progress monitoring
  - ✅ Distance calculation using Haversine formula
  - ✅ Progress percentage calculation
  - ✅ Segment completion detection (when reaching destination junction)
  - ✅ Recording completed segments to trip instance
  - ✅ Recording junction choices to trip history
  - ✅ Event system (segmentStarted, segmentProgress, segmentCompleted, segmentAbandoned)
  - ✅ Updated route-selector.js to integrate with segment tracker
  - ✅ Added tripId tracking to route selector
  - ✅ Integrated segment tracking start on segment selection
  - 🔗 **Integration Pending:** Not connected to GPS module yet
  - 🧪 **Testing Pending:**
    - [ ] Test segment tracking starts on segment selection
    - [ ] Test GPS progress updates calculate distance correctly
    - [ ] Test segment completion detection at destination junction
    - [ ] Test completedSegments saved to trip instance
    - [ ] Test junctionChoices saved to trip instance
    - [ ] Test trip stats updated (totalDistance, totalTime)
    - [ ] Test segment abandonment (user goes off-route)
    - [ ] Test ETA calculation accuracy
    - [ ] Test with different transport modes
    - [ ] Test with varying GPS accuracy

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

---

#### 🔄 INTEGRATION CHECKPOINT (After Task 1.6.6)

**Status:** ⏳ IN PROGRESS
**When:** After completing Task 1.6.6 (Segment Tracking)
**Duration:** 3-4 hours
**Goal:** Integrate and validate Tasks 1.6.1-1.6.6 before continuing
**Test Log:** See `docs/INTEGRATION-TEST-LOG.md` for detailed test results

**Integration Tasks:**

1. **Module Integration (1 hour)** ✅ COMPLETE
   - [✅] Import route-loader-v2.js in main app.js
   - [✅] Import junction-detector.js in main app.js
   - [✅] Import route-selector.js in main app.js
   - [✅] Import segment-tracker.js in main app.js
   - [✅] Initialize modules on app startup (initV2Modules method)
   - [✅] Connect to existing trip system
   - [✅] Add v2 route detection (try v2 first, fallback to v1)
   - [✅] Fallback to v1 loader for old routes
   - [✅] Connect GPS updates to junction detector and segment tracker
   - [✅] Wire up all event listeners
   - [✅] Build test passed

2. **Core Flow Testing (1-2 hours)**
   - [ ] Test route loading: Load Vaishno Devi v2 config
   - [ ] Test graph building: Verify adjacency list structure
   - [ ] Test graph validation: Check for errors in console
   - [ ] Test GeoJSON loading: Verify all 11 segments load
   - [ ] Test junction detection: Simulate GPS at each junction
     - Katra (start): 32.98944, 74.93333
     - Banganga: 32.99500, 74.94000
     - Sanjichhat: 33.03500, 74.97500
     - Bhawan: 33.03000, 74.98000
   - [ ] Test route selection modal: Verify modal appears at junctions
   - [ ] Test segment selection: Click segment card, verify selection
   - [ ] Test segment tracking: Verify progress updates
   - [ ] Test segment completion: Verify next junction detection

3. **Error Handling (30 min)**
   - [ ] Test GPS failure: Disable location, verify graceful degradation
   - [ ] Test network failure: Offline mode, verify cached GeoJSON
   - [ ] Test invalid route: Load non-existent route, verify error
   - [ ] Test missing GeoJSON: Remove segment file, verify error
   - [ ] Test invalid coordinates: Use wrong junction coords, verify detection

4. **Build & Deploy Test (30 min)**
   - [ ] Run `npm run build` - verify no errors
   - [ ] Test production build locally
   - [ ] Verify service worker caches v2 routes
   - [ ] Test offline functionality
   - [ ] Deploy to dev branch on Cloudflare Pages
   - [ ] Test on deployed URL

5. **Mobile Testing (30 min)**
   - [ ] Test on iOS Safari (if available)
   - [ ] Test on Android Chrome (if available)
   - [ ] Test touch interactions on modal
   - [ ] Test GPS accuracy on real device
   - [ ] Test performance (map rendering, modal animations)

**Critical Issues to Watch For:**

- ❌ **Module import errors** - ES6 import/export issues
- ❌ **Circular dependencies** - Modules importing each other
- ❌ **GPS coordinate format** - GeoJSON [lng,lat] vs Leaflet [lat,lng]
- ❌ **Detection radius too small/large** - 30m might not work in all scenarios
- ❌ **Modal not appearing** - Event listener not connected
- ❌ **Segment GeoJSON not loading** - Path issues, CORS issues
- ❌ **IndexedDB schema mismatch** - New fields not compatible with old trips
- ❌ **Service worker cache issues** - Old routes cached, new routes not loading

**Success Criteria:**

✅ All modules load without errors
✅ Route graph builds correctly
✅ Junction detection works at test coordinates
✅ Route selection modal appears and functions
✅ Segment selection updates trip state
✅ Build completes without errors
✅ App works offline
✅ No console errors during normal flow

**If Issues Found:**

- Document all issues in GitHub Issues
- Fix critical blockers before continuing
- Defer minor issues to Task 1.6.10 (Testing)
- Update time estimates for remaining tasks

**After Checkpoint:**

- ✅ Proceed to Task 1.6.7 (Map Visualization)
- ✅ Continue with confidence that core architecture works
- ✅ Focus on polish and features, not debugging fundamentals

---

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

## 🧠 Phase 1.8: Smart Features (PLANNED)

**Status**: 📋 PLANNED - After Phase 1.7

**Goal**: Add intelligent features to enhance user experience

**Branch**: `dev-junction` → `main` when ready

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

## 📡 Phase 1.9: Offline Map Tiles (LOW PRIORITY)

**Status**: 📋 PLANNED - Low priority, future enhancement

**Goal**: True offline capability with cached map tiles

**Branch**: `dev-junction` → `main` when ready

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

## 🚀 NEXT: Phase 2 - Cloud Backend & Authentication (FOUNDATION)

**Status**: 📋 PLANNED - Next major phase

**Goal**: Set up cloud infrastructure for multi-user, multi-device support

**Branch**: `dev-junction` → `main` when ready

**Estimated Effort:** 15-20 hours

### Why This First?

- ✅ Foundation for all future features (photos, notes, sharing)
- ✅ Enables multi-device sync
- ✅ Enables collaborative trips
- ✅ Required before photos/notes make sense
- ✅ Offline-first architecture preserved

### Task 2.1: Firebase Setup & Authentication (4-5 hours)

- [ ] Create Firebase project
- [ ] Install Firebase SDK
- [ ] Set up Firebase Authentication
- [ ] Implement login/signup UI
  - Email/password
  - Google Sign-In
  - Phone number (optional)
- [ ] User profile management
- [ ] Anonymous → authenticated migration
- [ ] Session persistence

**Deliverables:**
- Firebase project configured
- Authentication UI working
- User can sign up, log in, log out
- Profile page with basic info

### Task 2.2: Cloud Data Model Design (3-4 hours)

- [ ] Design Firestore schema
  - Users collection
  - Trips collection (with owner + participants)
  - Photos collection (future)
  - Notes collection (future)
- [ ] User permissions model
  - Owner: full control
  - Participant: add photos/notes
  - Viewer: read-only
- [ ] Sharing and invitation system design
- [ ] Data migration plan (IndexedDB → Firestore)
- [ ] Document schema in `docs/FIRESTORE-SCHEMA.md`

**Deliverables:**
- Complete Firestore schema documented
- Security rules defined
- Migration strategy documented

### Task 2.3: Cloud Sync Implementation (5-6 hours)

- [ ] Firestore integration
- [ ] Real-time sync for trips
  - Trip metadata (name, route, dates)
  - Completed segments
  - Junction choices
  - Trip statistics
- [ ] Offline support (Firestore offline persistence)
- [ ] Conflict resolution strategy
- [ ] Background sync
- [ ] Sync status indicator

**Deliverables:**
- Trips sync to cloud automatically
- Multi-device sync working
- Offline changes sync when online
- No data loss scenarios

### Task 2.4: Sharing & Collaboration (3-4 hours)

- [ ] Trip invitation system
  - Invite by email
  - Invite by shareable link
  - Accept/decline invitations
- [ ] Participant management UI
  - View participants
  - Remove participants (owner only)
  - Change permissions
- [ ] Permission controls
  - Owner can edit/delete trip
  - Participants can add content
  - Viewers can only view
- [ ] Real-time participant updates
  - See who's online
  - See participant locations (optional)

**Deliverables:**
- Trip sharing working
- Multiple users can collaborate on same trip
- Permissions enforced
- Real-time updates across devices

### Success Criteria

- ✅ User authentication working
- ✅ Trips stored in cloud
- ✅ Multi-device sync working
- ✅ Trip sharing working
- ✅ Offline-first still works
- ✅ No data loss
- ✅ Security rules enforced

---

## 📸 Phase 3: Photos & Notes System (COLLABORATIVE)

**Status**: 📋 PLANNED - After Phase 2

**Goal**: Capture memories with multi-user collaboration

**Branch**: `dev-junction` → `main` when ready

**Estimated Effort:** 20-25 hours

### Task 3.1: Photo Capture & Storage (6-8 hours)

- [ ] Camera integration (mobile)
- [ ] Photo upload to Firebase Storage
- [ ] Image compression (client-side)
  - Compress to max 1920px width
  - Generate thumbnail (300px)
- [ ] Geolocation tagging
  - Auto-tag with current location
  - Junction/segment association
  - Manual location override
- [ ] User attribution (who took it)
- [ ] Upload progress indicator
- [ ] Retry failed uploads

**Deliverables:**
- Camera works on mobile
- Photos upload to cloud
- Thumbnails generated
- Location tagged automatically

### Task 3.2: Photo Gallery (5-6 hours)

- [ ] Grid view with lazy loading
- [ ] Filter by:
  - User (who took it)
  - Location (junction/segment)
  - Date/time
  - Transport mode
- [ ] Slideshow mode
- [ ] Photo details view
  - Full resolution
  - Location on map
  - User, timestamp
  - Comments (future)
- [ ] Download original
- [ ] Delete (owner/author only)
- [ ] Real-time updates (new photos appear)

**Deliverables:**
- Beautiful photo gallery
- Filtering works
- Slideshow mode
- Real-time collaboration

### Task 3.3: Notes System (4-5 hours)

- [ ] Rich text editor
  - Bold, italic, lists
  - Links
  - Markdown support (optional)
- [ ] Geolocation tagging
  - Auto-tag with current location
  - Manual location selection
  - Junction/segment association
- [ ] User attribution
- [ ] Edit/delete (author only)
- [ ] Import from text file
  - Parse location from text
  - Bulk import
- [ ] Voice notes (future enhancement)

**Deliverables:**
- Rich text notes working
- Location tagging automatic
- Import from text file
- Real-time sync

### Task 3.4: Real-time Collaboration (3-4 hours)

- [ ] Real-time photo/note updates
- [ ] Notifications
  - New photo added
  - New note added
  - Participant joined
- [ ] Activity feed
  - Recent photos
  - Recent notes
  - Recent events
- [ ] Participant presence
  - Who's online
  - Who's at which location (optional)

**Deliverables:**
- Real-time updates across all devices
- Notifications working
- Activity feed showing recent activity

### Task 3.5: Import/Export (2-3 hours)

- [ ] Import notes from text/CSV
- [ ] Export trip as PDF
  - Cover page with stats
  - Map with route
  - Photos with captions
  - Notes with locations
- [ ] Export photo album as ZIP
- [ ] Export data as JSON

**Deliverables:**
- Import/export working
- PDF looks professional
- All data exportable

### Success Criteria

- ✅ Multi-user photo sharing
- ✅ Collaborative notes
- ✅ Real-time updates
- ✅ Import/export working
- ✅ Beautiful gallery experience

---

## 🎨 Phase 4: Trip Views & Experience (POST-TRIP)

**Status**: 📋 PLANNED - After Phase 3

**Goal**: Rich post-trip experience and sharing

**Branch**: `dev-junction` → `main` when ready

**Estimated Effort:** 15-18 hours

### Task 4.1: Trip Summary Page (4-5 hours)

- [ ] New route: `/trip/:tripId/summary`
- [ ] Overview section
  - Trip name, dates, participants
  - Route map with completed segments
  - Total distance, time, efficiency score
- [ ] Statistics cards
  - Distance breakdown (by transport mode)
  - Time breakdown
  - Efficiency metrics
  - Route choices analysis
- [ ] Participant list
  - Profile pictures
  - Contribution stats (photos, notes)
- [ ] Photo count, note count
- [ ] Timeline visualization
  - Start to end
  - Key milestones
- [ ] Share trip button
  - Generate public link
  - Social media preview card

**Deliverables:**
- Beautiful trip summary page
- All stats displayed
- Shareable link generated

### Task 4.2: Trip Gallery Page (4-5 hours)

- [ ] New route: `/trip/:tripId/gallery`
- [ ] Photo grid view
  - Masonry layout
  - Lazy loading
  - Infinite scroll
- [ ] Filters
  - By user
  - By location
  - By date
  - By transport mode
- [ ] View modes
  - Grid view
  - Map view (photos on map)
  - Timeline view (chronological)
- [ ] Slideshow mode
  - Full screen
  - Auto-advance
  - Captions
- [ ] Download all photos button

**Deliverables:**
- Photo gallery page
- Multiple view modes
- Filtering works
- Slideshow mode

### Task 4.3: Trip Timeline Page (3-4 hours)

- [ ] New route: `/trip/:tripId/timeline`
- [ ] Chronological feed
  - Photos
  - Notes
  - Junctions reached
  - Segments completed
  - Route choices
- [ ] Filter by type
  - All events
  - Photos only
  - Notes only
  - Milestones only
- [ ] Filter by user
- [ ] Scroll to date/time
- [ ] Export timeline as PDF

**Deliverables:**
- Timeline page working
- All events shown chronologically
- Filtering works
- Export to PDF

### Task 4.4: Trip Export & Sharing (4-5 hours)

- [ ] PDF trip report
  - Cover page (trip name, dates, stats)
  - Route map
  - Photo gallery (grid)
  - Notes section
  - Timeline
  - Professional layout
- [ ] Public trip link
  - View-only access
  - No login required
  - Custom URL slug
  - Privacy controls (public/unlisted/private)
- [ ] Social media sharing
  - Open Graph meta tags
  - Twitter Card
  - Preview image (route map + stats)
- [ ] Embed trip on website
  - iframe embed code
  - Responsive
  - Customizable (show/hide sections)

**Deliverables:**
- PDF export working
- Public trip links
- Social media previews
- Embed code generated

### Success Criteria

- ✅ Beautiful trip summary
- ✅ Photo gallery experience
- ✅ Timeline view
- ✅ Shareable trip links
- ✅ Professional PDF export

---

## 🧠 Phase 5: Smart Features (INTELLIGENT)

**Status**: 📋 PLANNED - After Phase 4

**Goal**: Intelligent recommendations using historical data

**Branch**: `dev-junction` → `main` when ready

**Estimated Effort:** 18-22 hours

### Task 5.1: User-Contributed Reports (5-6 hours)

- [ ] Report system
  - Report types: crowd level, conditions, closures, hazards
  - Location-based (junction/segment)
  - Timestamp
  - User attribution
- [ ] Upvote/downvote reports
  - Community validation
  - Trust score
- [ ] Report expiry
  - Auto-expire after 24-48 hours
  - Manual mark as resolved
- [ ] Display on map
  - Icon badges on segments
  - Color coding (green/yellow/red)
- [ ] Notifications
  - Alert when approaching reported issue
  - "Heavy crowd ahead at Adhkuwari (500m)"

**Deliverables:**
- Report submission working
- Reports displayed on map
- Notifications for nearby reports
- Community validation

### Task 5.2: Historical Data Analysis (4-5 hours)

- [ ] Compare trips over time
  - Personal best times
  - Improvement tracking
  - Seasonal patterns
- [ ] Crowd level predictions
  - Based on historical user data
  - Time of day patterns
  - Day of week patterns
  - Holiday/festival predictions
- [ ] Route popularity
  - Most taken routes
  - Least crowded alternatives
- [ ] Personal insights
  - "You're 15% faster than last time"
  - "This segment usually takes 30 min"

**Deliverables:**
- Trip comparison view
- Crowd predictions
- Personal insights

### Task 5.3: Smart Recommendations (5-6 hours)

- [ ] Route suggestions
  - Based on time of day
  - Based on crowd levels
  - Based on weather
  - Based on user fitness level
- [ ] Avoid crowded segments
  - Suggest alternatives
  - Show time savings
- [ ] Weather-based recommendations
  - OpenWeatherMap API integration
  - "Rain expected, consider ropeway"
  - "Clear skies, great for trek"
- [ ] Personalized suggestions
  - Based on past trips
  - Based on preferences
  - "You usually prefer walking routes"

**Deliverables:**
- Smart route recommendations
- Weather integration
- Personalized suggestions

### Task 5.4: Progress Predictions (4-5 hours)

- [ ] ETA updates based on actual pace
  - Real-time pace calculation
  - Adjust ETA dynamically
  - "You're moving faster than expected"
- [ ] Segment time predictions
  - Based on historical data
  - Based on current pace
  - Confidence intervals
- [ ] Battery usage predictions
  - Estimate remaining battery
  - Suggest battery saver mode
  - "Battery will last until Bhawan"
- [ ] Suggest breaks
  - Based on pace decline
  - Based on time since last break
  - "Consider a break at next junction"

**Deliverables:**
- Accurate ETA predictions
- Battery predictions
- Break suggestions

### Success Criteria

- ✅ Community reports working
- ✅ Historical insights valuable
- ✅ Smart recommendations helpful
- ✅ Accurate predictions

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

- [x] **Q: Which map controls should be always visible vs toggle-able?**
  - Status: ✅ DECIDED
  - Context: Task 1.6.7 - Map controls and legend UI/UX
  - **Decision:**
    - **Map controls (vertical strip on right):**
      - Legend toggle (L button) - always visible
      - Auto Center toggle - always visible
      - Center on Location button - always visible
      - View Full Route button - always visible
    - **Legend:** Side panel that slides in from right when L button pressed
    - **Transport filters:** Move to bottom drawer under "Route Layers" section
  - **Enhanced hover effects:**
    - Path color changes to difficulty color (Easy=Green, Moderate=Orange, Hard=Red)
    - Path becomes bold/darker
    - Transport icon blinks for 1-2 seconds
  - Priority: High (better UX, cleaner map interface)
  - Related: Task 1.6.7 - Layer toggles and map legend

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

