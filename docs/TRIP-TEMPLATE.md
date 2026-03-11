# Trip Creation Template

## Overview

This template is designed to be filled by ChatGPT (or manually) to create a new trip route for the PWA.

**Target Output:** JSON file compatible with Route Schema v2.0 (junction-based graph architecture)

---

## Template Instructions for ChatGPT

```
You are helping create a trip route for a Progressive Web App (PWA) that tracks GPS-based journeys.

The user will describe a trip (e.g., "Walk from my home to the local park via the coffee shop").

Your task is to:
1. Identify all key decision points (junctions) where the user might choose different routes
2. Identify all route segments between junctions
3. Determine transport modes (walking, driving, cycling, etc.)
4. Estimate distances and times
5. Assign difficulty levels
6. Fill the JSON template below

**Important:**
- Use real GPS coordinates (latitude, longitude) - look them up if needed
- Junctions are decision points (intersections, landmarks where routes diverge)
- Segments connect junctions (A→B)
- Each segment has ONE transport mode
- Distances in meters, times in minutes
- Difficulty: easy, moderate, hard, extreme
```

---

## JSON Template

```json
{
  "id": "TRIP_ID",
  "name": "TRIP_NAME",
  "description": "TRIP_DESCRIPTION",
  "region": "REGION_NAME",
  "country": "COUNTRY_CODE",
  "difficulty": "easy|moderate|hard|extreme",
  "estimatedDuration": "DURATION_TEXT",
  "totalDistance": DISTANCE_IN_METERS,
  "startJunction": "JUNCTION_ID",
  "endJunction": "JUNCTION_ID",
  "junctions": [
    {
      "id": "JUNCTION_ID",
      "name": "Junction Name",
      "description": "Brief description",
      "coordinates": [LATITUDE, LONGITUDE],
      "elevation": ELEVATION_IN_METERS,
      "facilities": ["facility1", "facility2"],
      "isStart": true|false,
      "isEnd": true|false,
      "outgoingSegments": ["SEGMENT_ID_1", "SEGMENT_ID_2"]
    }
  ],
  "segments": [
    {
      "id": "SEGMENT_ID",
      "name": "Segment Name",
      "from": "FROM_JUNCTION_ID",
      "to": "TO_JUNCTION_ID",
      "mode": "walking|driving|cycling|bus|train|ropeway|helicopter|boat",
      "distance": DISTANCE_IN_METERS,
      "estimatedTime": TIME_IN_MINUTES,
      "difficulty": "easy|moderate|hard|extreme",
      "description": "Brief description",
      "path": [
        [LAT1, LON1],
        [LAT2, LON2]
      ],
      "subMilestones": [
        {
          "name": "Sub-milestone Name",
          "coordinates": [LATITUDE, LONGITUDE],
          "description": "Brief description"
        }
      ]
    }
  ],
  "metadata": {
    "createdBy": "chatgpt|manual|user",
    "createdDate": "ISO_DATE",
    "version": "2.0",
    "source": "chatgpt-assisted|manual|imported"
  }
}
```

---

## Field Descriptions

### Trip Level
- **id**: Unique identifier (lowercase, hyphens, e.g., "home-to-park")
- **name**: Display name (e.g., "Home to Park via Coffee Shop")
- **description**: 1-2 sentence overview
- **region**: City/area name
- **country**: ISO country code (e.g., "US", "IN")
- **difficulty**: Overall trip difficulty
- **estimatedDuration**: Human-readable (e.g., "30-45 minutes")
- **totalDistance**: Total meters
- **startJunction**: ID of starting junction
- **endJunction**: ID of ending junction

### Junction
- **id**: Unique identifier (e.g., "home", "coffee-shop", "park")
- **name**: Display name (e.g., "Home", "Starbucks Coffee")
- **description**: Brief description (e.g., "Starting point")
- **coordinates**: [latitude, longitude]
- **elevation**: Meters above sea level (optional, use 0 if unknown)
- **facilities**: Array of available facilities (e.g., ["parking", "restroom", "food"])
- **isStart**: true if this is the trip start
- **isEnd**: true if this is the trip end
- **outgoingSegments**: Array of segment IDs that start from this junction

### Segment
- **id**: Unique identifier (e.g., "home-to-coffee", "coffee-to-park")
- **name**: Display name (e.g., "Home to Coffee Shop")
- **from**: Junction ID where segment starts
- **to**: Junction ID where segment ends
- **mode**: Transport mode (walking, driving, cycling, bus, train, ropeway, helicopter, boat)
- **distance**: Meters
- **estimatedTime**: Minutes
- **difficulty**: Segment difficulty (easy, moderate, hard, extreme)
- **description**: Brief description (e.g., "Flat sidewalk along Main St")
- **path**: Array of [lat, lon] coordinates defining the route (minimum 2 points: start and end)
- **subMilestones**: Optional array of intermediate points of interest

### Facilities Options
- parking, restroom, food, water, medical, shelter, viewpoint, temple, mosque, church, atm, phone, wifi

---

## Example: Simple Trip

**User Input:** "Walk from my home at 123 Main St, Springfield to the local park, with a stop at Starbucks"

**ChatGPT Output:**

```json
{
  "id": "home-to-park-springfield",
  "name": "Home to Springfield Park",
  "description": "A short walk from home to the local park with a coffee stop",
  "region": "Springfield",
  "country": "US",
  "difficulty": "easy",
  "estimatedDuration": "25-30 minutes",
  "totalDistance": 1800,
  "startJunction": "home",
  "endJunction": "park",
  "junctions": [
    {
      "id": "home",
      "name": "Home",
      "description": "Starting point at 123 Main St",
      "coordinates": [39.7817, -89.6501],
      "elevation": 180,
      "facilities": ["parking"],
      "isStart": true,
      "isEnd": false,
      "outgoingSegments": ["home-to-coffee"]
    },
    {
      "id": "coffee-shop",
      "name": "Starbucks Coffee",
      "description": "Coffee shop at Main St & 5th Ave",
      "coordinates": [39.7825, -89.6485],
      "elevation": 182,
      "facilities": ["food", "restroom", "wifi"],
      "isStart": false,
      "isEnd": false,
      "outgoingSegments": ["coffee-to-park"]
    },
    {
      "id": "park",
      "name": "Springfield Park",
      "description": "Local park with playground and trails",
      "coordinates": [39.7840, -89.6470],
      "elevation": 185,
      "facilities": ["restroom", "water", "parking"],
      "isStart": false,
      "isEnd": true,
      "outgoingSegments": []
    }
  ],
  "segments": [
    {
      "id": "home-to-coffee",
      "name": "Home to Starbucks",
      "from": "home",
      "to": "coffee-shop",
      "mode": "walking",
      "distance": 900,
      "estimatedTime": 12,
      "difficulty": "easy",
      "description": "Flat sidewalk along Main St",
      "path": [
        [39.7817, -89.6501],
        [39.7825, -89.6485]
      ],
      "subMilestones": []
    },
    {
      "id": "coffee-to-park",
      "name": "Starbucks to Park",
      "from": "coffee-shop",
      "to": "park",
      "mode": "walking",
      "distance": 900,
      "estimatedTime": 13,
      "difficulty": "easy",
      "description": "Sidewalk along 5th Ave to park entrance",
      "path": [
        [39.7825, -89.6485],
        [39.7840, -89.6470]
      ],
      "subMilestones": []
    }
  ],
  "metadata": {
    "createdBy": "chatgpt",
    "createdDate": "2026-03-11T12:00:00Z",
    "version": "2.0",
    "source": "chatgpt-assisted"
  }
}
```

---

## ChatGPT Prompt Template

**Copy this prompt to ChatGPT when creating a new trip:**

```
I need help creating a trip route for my GPS tracking PWA. Please use the Trip Creation Template to generate a JSON file.

**Trip Description:**
[Describe your trip here - start point, end point, any stops, transport modes, etc.]

**Example:**
"I want to walk from my home at [address] to [destination], stopping at [landmark]. The route should include [specific details]."

**Requirements:**
1. Look up real GPS coordinates for all locations
2. Identify logical junctions (decision points, landmarks)
3. Create segments between junctions
4. Estimate realistic distances and times
5. Assign appropriate transport modes
6. Include any notable facilities or points of interest
7. Output the complete JSON following the template format

**Output Format:**
Please provide the complete JSON that I can copy and import into my PWA.
```

---

## Example: Multi-Route Trip with Junctions

**User Input:** "Create a trip from Downtown Station to Hilltop Viewpoint. There are two route options: the scenic trail (walking, harder) or the road route (driving, easier). Both routes meet at Midpoint Cafe."

**ChatGPT Output:**

```json
{
  "id": "downtown-to-hilltop",
  "name": "Downtown to Hilltop Viewpoint",
  "description": "Journey to hilltop with choice of scenic trail or road route",
  "region": "Mountain City",
  "country": "US",
  "difficulty": "moderate",
  "estimatedDuration": "45-90 minutes (depending on route)",
  "totalDistance": 5000,
  "startJunction": "downtown-station",
  "endJunction": "hilltop-viewpoint",
  "junctions": [
    {
      "id": "downtown-station",
      "name": "Downtown Station",
      "description": "Starting point - main transit hub",
      "coordinates": [40.7128, -74.0060],
      "elevation": 10,
      "facilities": ["parking", "restroom", "food", "atm"],
      "isStart": true,
      "isEnd": false,
      "outgoingSegments": ["downtown-to-midpoint-trail", "downtown-to-midpoint-road"]
    },
    {
      "id": "midpoint-cafe",
      "name": "Midpoint Cafe",
      "description": "Cafe where both routes converge",
      "coordinates": [40.7200, -74.0000],
      "elevation": 150,
      "facilities": ["food", "restroom", "water", "wifi"],
      "isStart": false,
      "isEnd": false,
      "outgoingSegments": ["midpoint-to-hilltop"]
    },
    {
      "id": "hilltop-viewpoint",
      "name": "Hilltop Viewpoint",
      "description": "Scenic viewpoint at the summit",
      "coordinates": [40.7250, -73.9950],
      "elevation": 300,
      "facilities": ["viewpoint", "restroom", "parking"],
      "isStart": false,
      "isEnd": true,
      "outgoingSegments": []
    }
  ],
  "segments": [
    {
      "id": "downtown-to-midpoint-trail",
      "name": "Scenic Trail Route",
      "from": "downtown-station",
      "to": "midpoint-cafe",
      "mode": "walking",
      "distance": 2500,
      "estimatedTime": 45,
      "difficulty": "moderate",
      "description": "Scenic hiking trail through forest, moderate incline",
      "path": [
        [40.7128, -74.0060],
        [40.7150, -74.0040],
        [40.7180, -74.0020],
        [40.7200, -74.0000]
      ],
      "subMilestones": [
        {
          "name": "Forest Entrance",
          "coordinates": [40.7150, -74.0040],
          "description": "Trail entrance with signage"
        },
        {
          "name": "Creek Crossing",
          "coordinates": [40.7180, -74.0020],
          "description": "Small bridge over creek"
        }
      ]
    },
    {
      "id": "downtown-to-midpoint-road",
      "name": "Road Route",
      "from": "downtown-station",
      "to": "midpoint-cafe",
      "mode": "driving",
      "distance": 3000,
      "estimatedTime": 15,
      "difficulty": "easy",
      "description": "Paved road route, gentle curves",
      "path": [
        [40.7128, -74.0060],
        [40.7140, -74.0050],
        [40.7170, -74.0030],
        [40.7200, -74.0000]
      ],
      "subMilestones": []
    },
    {
      "id": "midpoint-to-hilltop",
      "name": "Midpoint to Hilltop",
      "from": "midpoint-cafe",
      "to": "hilltop-viewpoint",
      "mode": "walking",
      "distance": 1500,
      "estimatedTime": 25,
      "difficulty": "moderate",
      "description": "Final ascent to viewpoint, steeper incline",
      "path": [
        [40.7200, -74.0000],
        [40.7225, -73.9975],
        [40.7250, -73.9950]
      ],
      "subMilestones": [
        {
          "name": "Lookout Point",
          "coordinates": [40.7225, -73.9975],
          "description": "Intermediate viewpoint"
        }
      ]
    }
  ],
  "metadata": {
    "createdBy": "chatgpt",
    "createdDate": "2026-03-11T12:00:00Z",
    "version": "2.0",
    "source": "chatgpt-assisted"
  }
}
```

---

## Validation Checklist

Before importing the JSON, verify:

- [ ] All junction IDs are unique
- [ ] All segment IDs are unique
- [ ] All segment `from` and `to` reference valid junction IDs
- [ ] All junction `outgoingSegments` reference valid segment IDs
- [ ] Start junction has `isStart: true`
- [ ] End junction has `isEnd: true`
- [ ] All coordinates are valid [latitude, longitude]
- [ ] Distances and times are realistic
- [ ] At least 2 points in each segment's `path` array
- [ ] Trip ID is URL-safe (lowercase, hyphens only)

---

## Next Steps

1. **Use this template** with ChatGPT to create your trip
2. **Copy the JSON** output
3. **Import via PWA** (we'll build this interface next)
4. **Preview on map** before saving
5. **Test with GPS** on your device

