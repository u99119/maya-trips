# TODO & Future Plans

## Current Status

✅ **Phase 1 Complete** - Vaishno Devi route mapping with GPS, milestone toggles, route layers, offline support

---

## Phase 2: Enhanced Features (Planned)

### Photo & Notes System
- [ ] Photo capture at milestones using device camera
- [ ] Photo storage in IndexedDB (structure already created)
- [ ] Photo gallery view for each milestone
- [ ] Rich text notes editor
- [ ] Notes storage in IndexedDB (structure already created)
- [ ] Attach notes to specific milestones
- [ ] Export notes as text/PDF

### Multi-Route Selector
- [ ] Route selection UI on app start
- [ ] Browse available routes
- [ ] Route preview with map
- [ ] Switch between routes without reload
- [ ] Recent routes history

### Route Statistics & Analytics
- [ ] Total distance traveled
- [ ] Time spent on trek
- [ ] Average speed calculation
- [ ] Elevation gain/loss tracking
- [ ] Calories burned estimation
- [ ] Personal records and achievements

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
  - Status: ✅ ANSWERED - Ready to deploy
  - Context: App tested on dev server, icons generated, app name configured
  - Answer: User will deploy when ready

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

