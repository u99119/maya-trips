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
- ⚠️ **Design Decision Needed**:
  - Option A: Allow route change, create new trip automatically
  - Option B: Allow route change within same trip (multi-route trip)
  - Option C: Prompt user to save current trip and create new one
- 📝 **Note**: User wants flexibility to change route mid-journey

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

- [ ] **Task 1.5.2**: Create Trip Management Module (trips.js)
  - createTrip(routeId, tripName)
  - getTrip(tripId)
  - getAllTrips(filters)
  - updateTrip(tripId, updates)
  - deleteTrip(tripId)
  - archiveTrip(tripId)

- [ ] **Task 1.5.3**: Build Trip Selection UI
  - Trip list screen
  - Create trip modal
  - Trip card component
  - Empty state (no trips yet)

- [ ] **Task 1.5.4**: Update App.js
  - Load trip instead of route directly
  - Trip context management
  - Switch trip functionality
  - Persist currentTripId

- [ ] **Task 1.5.5**: Update Storage Methods
  - markMilestoneVisited(tripId, milestoneId)
  - getVisitedMilestones(tripId)
  - saveLayerVisibility(tripId, layerStates)
  - All methods now trip-scoped

- [ ] **Task 1.5.6**: Route Switching Logic
  - Design decision on mid-trip route change
  - Implement chosen approach
  - Handle edge cases (unsaved progress, etc.)

- [ ] **Task 1.5.7**: Testing
  - Create multiple trips from same route
  - Verify data isolation
  - Test trip switching
  - Test offline functionality

#### 5. Migration Strategy

**For Existing Users** (after deployment):
- Detect old data format (no tripId)
- Auto-create first trip: "Vaishno Devi - Migrated Trip"
- Migrate visited milestones to new trip
- Preserve all existing progress

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

