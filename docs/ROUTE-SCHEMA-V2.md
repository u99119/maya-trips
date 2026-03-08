# Route Config Schema v2.0 - Junction-Based Architecture

## Overview

Route Config v2.0 introduces a **junction-based graph architecture** that supports:
- Dynamic route selection at decision points
- Multiple transport modes (walking, driving, flying, battery-car, ropeway, helicopter)
- Mid-segment route alternatives (not just start-to-end)
- Sub-milestones along segments
- Rich trip history and statistics

## Key Concepts

### 1. Junctions (Nodes)
**Decision points** where routes can branch or merge.

**Types:**
- `start` - Starting point of the route
- `junction` - Decision point with multiple outgoing segments
- `end` - Ending point of the route

### 2. Segments (Edges)
**Paths between junctions** with specific transport modes.

**Transport Modes:**

| Mode | Icon | Description |
|------|------|-------------|
| `walking` | 🚶 | On foot |
| `driving` | 🚗 | Car/bus/vehicle |
| `flying` | ✈️ | Airplane |
| `battery-car` | 🚡 | Electric vehicle on fixed route |
| `ropeway` | 🚠 | Cable car |
| `helicopter` | 🚁 | Helicopter service |

**Difficulty Levels:**

| Difficulty | Badge | Color | Description |
|------------|-------|-------|-------------|
| `easy` | Easy | Green (#4CAF50) | Suitable for all fitness levels |
| `moderate` | Moderate | Orange (#FF9800) | Requires moderate fitness |
| `hard` | Hard | Red (#F44336) | Requires good fitness and experience |

### 3. Sub-Milestones
**Points of interest along a segment** (not decision points).
- Smaller markers on map
- Clickable for info popup
- Not shown in milestone drawer
- Not tickable (only main junctions can be ticked)

### 4. Route Graph
**Directed graph** where:
- Nodes = Junctions
- Edges = Segments
- Trip = Path through the graph

## Schema Structure

### Root Object

```json
{
  "id": "route-id",
  "name": "Route Name",
  "version": "2.0",
  "description": "Route description",
  "region": "Region name",
  "country": "Country",
  "difficulty": "easy" | "moderate" | "hard",
  "estimatedDuration": 18000,
  "totalDistance": 13000,
  
  "junctions": [...],
  "segments": [...],
  "recommendedPaths": [...],
  "emergencyPoints": [...]
}
```

### Junction Object

```json
{
  "id": "junction-id",
  "name": "Junction Name",
  "location": [longitude, latitude],
  "type": "start" | "junction" | "end",
  "elevation": 2500,
  "facilities": ["food", "water", "medical", "accommodation", "restroom"],
  "description": "Junction description",
  "outgoingSegments": ["segment-id-1", "segment-id-2"],
  "proximityRadius": 30
}
```

**Fields:**
- `id` (string, required) - Unique junction identifier
- `name` (string, required) - Display name
- `location` (array, required) - [longitude, latitude] in decimal degrees
- `type` (string, required) - Junction type
- `elevation` (number, optional) - Elevation in meters
- `facilities` (array, optional) - Available facilities
- `description` (string, optional) - Additional info
- `outgoingSegments` (array, required) - IDs of segments that start from this junction
- `proximityRadius` (number, optional) - Detection radius in meters (default: 30)

### Segment Object

```json
{
  "id": "segment-id",
  "name": "Segment Name",
  "from": "junction-id-start",
  "to": "junction-id-end",
  "geojson": "routes/route-id/segments/segment-id.geojson",
  "distance": 3000,
  "estimatedTime": 3600,
  "transportMode": "walking",
  "difficulty": "moderate",
  "elevation": {
    "gain": 100,
    "loss": 50
  },
  "tags": ["main-route", "walking"],
  "requiresTicket": false,
  "ticketInfo": null,
  "description": "Segment description",
  
  "style": {
    "color": "#2196F3",
    "weight": 4,
    "opacity": 0.8,
    "dashArray": null
  },
  
  "milestones": [...]
}
```

**Fields:**
- `id` (string, required) - Unique segment identifier
- `name` (string, required) - Display name
- `from` (string, required) - Starting junction ID
- `to` (string, required) - Ending junction ID
- `geojson` (string, required) - Path to segment GeoJSON file
- `distance` (number, required) - Distance in meters
- `estimatedTime` (number, required) - Estimated time in seconds
- `transportMode` (string, required) - Transport mode
- `difficulty` (string, required) - Difficulty level
- `elevation` (object, optional) - Elevation gain/loss
- `tags` (array, optional) - Tags for filtering
- `requiresTicket` (boolean, optional) - Whether ticket is required
- `ticketInfo` (string, optional) - Ticket information
- `description` (string, optional) - Additional info
- `style` (object, required) - Map rendering style
- `milestones` (array, optional) - Sub-milestones along this segment

### Sub-Milestone Object

```json
{
  "id": "sub-milestone-id",
  "name": "Sub-Milestone Name",
  "location": [longitude, latitude],
  "distanceFromStart": 500,
  "facilities": ["water"],
  "description": "Sub-milestone description"
}
```

**Fields:**
- `id` (string, required) - Unique sub-milestone identifier
- `name` (string, required) - Display name
- `location` (array, required) - [longitude, latitude]
- `distanceFromStart` (number, required) - Distance from segment start in meters
- `facilities` (array, optional) - Available facilities
- `description` (string, optional) - Additional info

### Recommended Path Object

```json
{
  "id": "path-id",
  "name": "Path Name",
  "description": "Path description",
  "segments": ["segment-1", "segment-2", "segment-3"],
  "totalDistance": 13000,
  "estimatedTime": 18000,
  "difficulty": "moderate",
  "tags": ["main", "recommended"]
}
```

**Fields:**
- `id` (string, required) - Unique path identifier
- `name` (string, required) - Display name
- `description` (string, optional) - Path description
- `segments` (array, required) - Ordered list of segment IDs
- `totalDistance` (number, required) - Total distance in meters
- `estimatedTime` (number, required) - Total estimated time in seconds
- `difficulty` (string, required) - Overall difficulty
- `tags` (array, optional) - Tags for filtering

### Emergency Point Object

```json
{
  "id": "emergency-id",
  "name": "Emergency Point Name",
  "location": [longitude, latitude],
  "type": "medical" | "police" | "shelter",
  "facilities": ["first-aid", "doctor", "ambulance"],
  "contact": "+91-1234567890",
  "description": "Emergency point description"
}
```

**Fields:**
- `id` (string, required) - Unique emergency point identifier
- `name` (string, required) - Display name
- `location` (array, required) - [longitude, latitude]
- `type` (string, required) - Emergency point type
- `facilities` (array, optional) - Available facilities
- `contact` (string, optional) - Emergency contact number
- `description` (string, optional) - Additional info

## Complete Example: Vaishno Devi Route

See `public/routes/vaishno-devi/config-v2.json` for full example.

**Simplified structure:**

```json
{
  "id": "vaishno-devi",
  "name": "Vaishno Devi Yatra",
  "version": "2.0",

  "junctions": [
    {
      "id": "katra",
      "name": "Katra",
      "type": "start",
      "outgoingSegments": ["katra-darshani"]
    },
    {
      "id": "banganga",
      "name": "Banganga",
      "type": "junction",
      "outgoingSegments": ["banganga-charan", "banganga-shortcut"]
    }
  ],

  "segments": [
    {
      "id": "katra-darshani",
      "from": "katra",
      "to": "darshani-deodhi",
      "transportMode": "walking",
      "milestones": [...]
    },
    {
      "id": "banganga-charan",
      "from": "banganga",
      "to": "charan-paduka",
      "transportMode": "walking"
    },
    {
      "id": "banganga-shortcut",
      "from": "banganga",
      "to": "ardhkuwari",
      "transportMode": "walking"
    }
  ],

  "recommendedPaths": [
    {
      "id": "main",
      "name": "Main Traditional Route",
      "segments": ["katra-darshani", "darshani-banganga", "banganga-charan", ...]
    }
  ]
}
```

## Validation Rules

### Graph Validation

1. **No Orphaned Junctions**: Every junction must be reachable from start
2. **Valid Segment References**: All segment `from`/`to` must reference existing junctions
3. **Valid Outgoing Segments**: All junction `outgoingSegments` must reference existing segments
4. **At Least One Start**: Must have at least one junction with `type: "start"`
5. **At Least One End**: Must have at least one junction with `type: "end"`
6. **No Circular Segments**: A segment cannot have same `from` and `to`

### Path Validation

1. **Valid Segment References**: All path segments must exist
2. **Connected Path**: Segments must form a connected path (segment[i].to === segment[i+1].from)
3. **Starts at Start Junction**: First segment must start from a `start` junction
4. **Ends at End Junction**: Last segment must end at an `end` junction

## Migration from v1 to v2

**Breaking Changes:**
- v1 routes are NOT compatible with v2
- Manual conversion required

**Conversion Steps:**
1. Identify all decision points → create junctions
2. Split route into segments between junctions
3. Create segment GeoJSON files
4. Define sub-milestones within segments
5. Define recommended paths
6. Test route loading and validation

## File Structure

```
/public/routes/vaishno-devi/
  config-v2.json              # Route config (this schema)
  segments/
    katra-darshani.geojson    # Segment GeoJSON
    darshani-banganga.geojson
    banganga-charan.geojson
    banganga-shortcut.geojson
    ...
  legacy/
    config.json               # Old v1 config (backup)
    route.geojson
    milestones.geojson
```

## Notes

- **Coordinates**: Always [longitude, latitude] (GeoJSON standard)
- **Distances**: Always in meters
- **Times**: Always in seconds
- **Elevations**: Always in meters above sea level
- **IDs**: Use kebab-case (e.g., "katra-banganga")
- **Transport Modes**: Lowercase, hyphenated (e.g., "battery-car")

---

**Schema Version**: 2.0
**Last Updated**: 2026-03-03
**Status**: Draft - Subject to change during Phase 1.6 implementation

