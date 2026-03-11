# Trip Creation Quick Guide

## 🚀 Quick Start

### Step 1: Prepare Your Trip Description

Think about:
- **Start point:** Where does the trip begin? (address or landmark)
- **End point:** Where does it end?
- **Stops:** Any intermediate stops or decision points?
- **Routes:** Are there multiple route options?
- **Transport:** Walking, driving, cycling, bus, etc.?
- **Distance:** Approximate total distance
- **Duration:** How long should it take?

### Step 2: Use ChatGPT to Generate JSON

**Copy this prompt to ChatGPT:**

```
I need help creating a trip route for my GPS tracking PWA. Please use the Trip Creation Template from this document: [paste the template from docs/TRIP-TEMPLATE.md]

**My Trip:**
[Describe your trip here]

Example: "I want to create a walking route from my home at 123 Oak Street, San Francisco to Golden Gate Park. The route should go through Alamo Square Park as a midpoint stop. Total distance is about 3 km."

**Requirements:**
1. Look up real GPS coordinates for all locations
2. Identify logical junctions (decision points, landmarks)
3. Create segments between junctions
4. Estimate realistic distances and times
5. Assign appropriate transport modes
6. Include any notable facilities or points of interest
7. Output the complete JSON following the template format

Please provide the complete JSON that I can copy and import into my PWA.
```

### Step 3: Review ChatGPT's Output

Check:
- ✅ All locations have real coordinates
- ✅ Distances seem realistic
- ✅ Times seem realistic
- ✅ Transport modes are correct
- ✅ Start and end junctions are marked correctly

### Step 4: Import into PWA

1. Open your PWA (https://maya-trips.pages.dev)
2. Click **Menu** → **Import Trip**
3. Paste the JSON or upload the .json file
4. Click **Validate**
5. Review any errors or warnings
6. Click **Preview on Map**
7. Verify the route looks correct
8. Click **Save Trip**

### Step 5: Test with GPS

1. Start a new trip instance
2. Navigate to the start location
3. Verify GPS tracking works
4. Move toward first junction
5. Verify junction detection works
6. Complete the trip!

---

## 📋 Example: Creating a Local Test Trip

**Scenario:** You want to test GPS tracking near your current location.

### Example Description to ChatGPT:

```
Create a simple walking trip for GPS testing:

Start: Starbucks at 1234 Main Street, Mountain View, CA
Stop 1: City Hall at 500 Castro Street, Mountain View, CA
End: Central Park at 201 S Rengstorff Ave, Mountain View, CA

This is a simple urban walk, mostly flat, on sidewalks. Total distance about 2 km, should take 25-30 minutes walking.

Please create the JSON with:
- 3 junctions (Starbucks, City Hall, Central Park)
- 2 segments (Starbucks→City Hall, City Hall→Park)
- Walking mode for both segments
- Real GPS coordinates for Mountain View, CA
- Realistic distances and times
```

### Expected Output:

ChatGPT will generate a JSON file with:
- 3 junctions with real coordinates
- 2 walking segments
- Estimated distances and times
- Facilities at each junction

### Import and Test:

1. Copy the JSON
2. Import into PWA
3. Preview on map (should show Mountain View area)
4. Save trip
5. Go to Starbucks location
6. Start trip
7. Walk to City Hall (GPS should detect arrival)
8. Walk to Central Park (GPS should detect arrival)
9. Complete trip!

---

## 🎯 Tips for Good Trips

### Junction Placement

**Good junctions:**
- ✅ Intersections where routes diverge
- ✅ Landmarks (coffee shops, parks, monuments)
- ✅ Decision points (trail fork, road junction)
- ✅ Facilities (rest stops, viewpoints)

**Bad junctions:**
- ❌ Random points along a straight path
- ❌ Too many junctions (keep it simple)
- ❌ Junctions too close together (<50m)

### Segment Design

**Good segments:**
- ✅ Clear start and end points
- ✅ Single transport mode
- ✅ Realistic distance and time
- ✅ Path follows actual roads/trails

**Bad segments:**
- ❌ Mixing transport modes in one segment
- ❌ Unrealistic times (too fast or too slow)
- ❌ Path cuts through buildings or obstacles

### Distance and Time Estimates

**Walking:**
- Flat: ~5 km/h (12 min/km)
- Moderate incline: ~4 km/h (15 min/km)
- Steep incline: ~3 km/h (20 min/km)

**Driving:**
- City: ~30 km/h (2 min/km)
- Highway: ~80 km/h (0.75 min/km)

**Cycling:**
- Flat: ~15 km/h (4 min/km)
- Moderate incline: ~10 km/h (6 min/km)

---

## 🔧 Troubleshooting

### ChatGPT gives invalid coordinates

**Problem:** Coordinates are [0, 0] or clearly wrong

**Solution:** Ask ChatGPT to look up real coordinates:
```
Please look up the actual GPS coordinates for [location name] and update the JSON.
```

### Validation errors in PWA

**Problem:** PWA shows validation errors

**Common fixes:**
- Check all junction IDs are unique
- Check all segment IDs are unique
- Check segment `from`/`to` match junction IDs
- Check coordinates are [latitude, longitude] not [longitude, latitude]
- Check all required fields are present

### Trip doesn't appear on map

**Problem:** Trip imported but not visible

**Solution:**
- Check coordinates are in correct format [lat, lon]
- Check coordinates are in the right region
- Zoom out on map to find the trip
- Check browser console for errors

---

## 📚 Resources

- **Full Template:** `docs/TRIP-TEMPLATE.md`
- **Route Schema:** `docs/ROUTE-SCHEMA-V2.md`
- **Validation Rules:** (will be in PWA validation module)

---

## 🎉 Success!

Once you've created and imported your first trip:
1. ✅ You can test GPS tracking locally
2. ✅ You can verify junction detection works
3. ✅ You can complete Phase 1.6.10 testing
4. ✅ You're ready for Phase 2 (cloud sync)!

