# How to Add Built-in Routes

This guide explains how to add permanent routes to your PWA codebase.

## Quick Steps

1. **Create route folder** in `public/routes/`
2. **Add `config-v2.json`** file with route data
3. **Register route** in `public/js/app.js`
4. **Done!** Route is now permanent

---

## Detailed Instructions

### Step 1: Create Route Folder

Create a new folder in `public/routes/` with a kebab-case name:

```bash
public/routes/
  ├── vaishno-devi/          # Existing
  ├── pune-eisha-cisco/      # Existing
  └── your-new-route/        # New route
```

**Naming convention:** Use lowercase with hyphens (kebab-case)
- ✅ `mumbai-local-train`
- ✅ `delhi-metro-route`
- ❌ `Mumbai_Local_Train`
- ❌ `delhiMetroRoute`

### Step 2: Create config-v2.json

Create `config-v2.json` in your route folder:

```json
{
  "id": "your-new-route",
  "name": "Your Route Display Name",
  "version": "2.0",
  "description": "Route description",
  "region": "City/Region",
  "country": "IN",
  "difficulty": "easy",
  "estimatedDuration": "30 minutes",
  "totalDistance": 5000,
  "startJunction": "start_point_id",
  "endJunction": "end_point_id",
  "junctions": [
    {
      "id": "start_point_id",
      "name": "Start Point Name",
      "description": "Description",
      "coordinates": [18.5204, 73.8567],
      "elevation": 560,
      "facilities": ["parking", "food"],
      "isStart": true,
      "isEnd": false,
      "outgoingSegments": ["segment_1"]
    },
    {
      "id": "end_point_id",
      "name": "End Point Name",
      "description": "Description",
      "coordinates": [18.5304, 73.8667],
      "elevation": 570,
      "facilities": ["parking"],
      "isStart": false,
      "isEnd": true,
      "outgoingSegments": []
    }
  ],
  "segments": [
    {
      "id": "segment_1",
      "name": "Segment Name",
      "from": "start_point_id",
      "to": "end_point_id",
      "mode": "driving",
      "distance": 5000,
      "estimatedTime": 15,
      "difficulty": "easy",
      "description": "Segment description",
      "path": [
        [18.5204, 73.8567],
        [18.5304, 73.8667]
      ],
      "subMilestones": []
    }
  ],
  "metadata": {
    "createdBy": "your-name",
    "createdDate": "2026-03-11",
    "version": "2.0",
    "source": "manual"
  }
}
```

**Important:**
- `id` must match the folder name
- `version` must be `"2.0"`
- Use Trip Template format (see `docs/TRIP-TEMPLATE.md`)

### Step 3: Register Route in app.js

Open `public/js/app.js` and find the `populateRouteDropdown` method (around line 264):

```javascript
// Built-in routes (hardcoded for now)
const builtInRoutes = [
  { id: 'vaishno-devi', name: 'Vaishno Devi Yatra' },
  { id: 'pune-eisha-cisco', name: 'Pune: Eisha Zenith to Cisco Hinjewadi' },
  { id: 'your-new-route', name: 'Your Route Display Name' }  // Add this line
];
```

**Important:**
- `id` must match the folder name and JSON `id`
- `name` is what appears in the dropdown

### Step 4: Test the Route

1. Refresh the app: http://localhost:5173/
2. Click "Create New Trip"
3. Your route should appear in the dropdown
4. Select it and create a trip
5. Route should load on the map

---

## Example: Adding Mumbai Route

### 1. Create folder
```bash
mkdir public/routes/mumbai-local-train
```

### 2. Create config-v2.json
```bash
touch public/routes/mumbai-local-train/config-v2.json
```

### 3. Add route data
```json
{
  "id": "mumbai-local-train",
  "name": "Mumbai: Churchgate to Virar",
  "version": "2.0",
  ...
}
```

### 4. Register in app.js
```javascript
const builtInRoutes = [
  { id: 'vaishno-devi', name: 'Vaishno Devi Yatra' },
  { id: 'pune-eisha-cisco', name: 'Pune: Eisha Zenith to Cisco Hinjewadi' },
  { id: 'mumbai-local-train', name: 'Mumbai: Churchgate to Virar' }
];
```

---

## Route Format Reference

See these files for complete format documentation:
- `docs/TRIP-TEMPLATE.md` - Trip Template v2.0 format
- `docs/ROUTE-SCHEMA-V2.md` - Route Schema v2.0 format
- `public/routes/pune-eisha-cisco/config-v2.json` - Example route

---

## Benefits of Built-in Routes

✅ **Permanent** - Survives browser restarts and site data clearing  
✅ **Version controlled** - Part of your codebase  
✅ **Shareable** - Deploy to all users  
✅ **No import needed** - Available immediately  

---

**Status:** Documentation Complete  
**Date:** 2026-03-11

