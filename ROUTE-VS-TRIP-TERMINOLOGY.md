# Route vs Trip - Terminology Guide

## 📖 Definitions

### Route (The Blueprint)
A **route** is a **template** that defines the path and structure:

**What it contains:**
- Junctions (decision points with coordinates)
- Segments (paths between junctions)
- Distances, elevations, facilities
- Transport modes (walking, driving, etc.)
- Geographic information

**Examples:**
- "Vaishno Devi Yatra"
- "Pune: Eisha Zenith to Cisco Hinjewadi"
- "Mumbai Local Train Route"

**Storage:**
- Built-in routes: `/routes/{id}/config-v2.json` (file system)
- Imported routes: `localStorage` with key `route_config_{id}`

**Persistence:**
- ✅ Permanent (like a map in a guidebook)
- ✅ Can be reused for multiple trips
- ✅ Survives browser sessions

**Analogy:** A hiking trail map - it exists whether you hike it or not

---

### Trip (The Journey Instance)
A **trip** is a **specific instance** of traveling a route:

**What it contains:**
- Reference to a route (routeId)
- Trip name (e.g., "My Morning Commute - March 11")
- Start date/time
- Status (planned, in-progress, completed)
- Visited milestones
- Progress tracking
- Photos, notes (future)

**Examples:**
- "My Vaishno Devi Trip - March 2026"
- "Daily Commute - Week 1"
- "Test Run - Pune Route"

**Storage:**
- IndexedDB `trips` object store

**Persistence:**
- ✅ Permanent (saved to IndexedDB)
- ✅ Tracks your actual journey
- ✅ Survives browser sessions

**Analogy:** Your actual hike - you can hike the same trail multiple times, each is a different trip

---

## 🔄 Relationship

```
Route (1) ──────> Trips (Many)

Example:
"Vaishno Devi Yatra" route
    ├── Trip 1: "My First Yatra - Jan 2026"
    ├── Trip 2: "Family Yatra - March 2026"
    └── Trip 3: "Solo Yatra - Dec 2026"
```

---

## 🎯 User Workflows

### Workflow 1: Import Route, Create Trip Later
1. Click "Import Route"
2. Paste/upload route JSON
3. Validate
4. Leave trip name empty
5. Click "Import Route & Create Trip"
6. ✅ Route saved to localStorage
7. Route appears in "Create New Trip" dropdown
8. Later: Create trips from this route as needed

### Workflow 2: Import Route & Create Trip Immediately
1. Click "Import Route"
2. Paste/upload route JSON
3. Validate
4. Enter trip name (e.g., "My Morning Commute")
5. Click "Import Route & Create Trip"
6. ✅ Route saved to localStorage
7. ✅ Trip created in IndexedDB
8. ✅ Trip loads on map immediately

### Workflow 3: Create Multiple Trips from Same Route
1. Route already imported (e.g., "Pune: Eisha to Cisco")
2. Click "Create New Trip"
3. Select route from dropdown
4. Enter trip name (e.g., "Week 1 Commute")
5. ✅ New trip created
6. Repeat for "Week 2 Commute", "Week 3 Commute", etc.

---

## 🗂️ UI Elements

### "Import Route" Button
- **Location:** Trip selection screen
- **Purpose:** Import a new route definition
- **Result:** Route saved to localStorage, optionally creates first trip

### "Create New Trip" Button
- **Location:** Trip selection screen
- **Purpose:** Create a new trip from an existing route
- **Dropdown:** Shows all available routes (built-in + imported)

### Route Dropdown
- **Built-in routes:** Vaishno Devi Yatra
- **Separator:** "--- Imported Routes ---"
- **Imported routes:** Pune: Eisha to Cisco (imported)

### Trip List
- **Groups trips by route**
- **Shows all trip instances**
- **Each trip is clickable to load**

---

## 💾 Storage Summary

| Type | Storage | Key/Table | Persistent | Reusable |
|------|---------|-----------|------------|----------|
| Built-in Route | File System | `/routes/{id}/config-v2.json` | ✅ | ✅ |
| Imported Route | localStorage | `route_config_{id}` | ✅ | ✅ |
| Trip Instance | IndexedDB | `trips` table | ✅ | ❌ |

---

## ✅ What You Can Do Now

1. **Import routes** from ChatGPT or manual creation
2. **Routes persist** across browser sessions (permanent)
3. **Create multiple trips** from the same route
4. **Track each trip separately** with its own progress
5. **Routes appear in dropdown** for easy trip creation
6. **Import once, use forever** - routes are permanent like Vaishno Devi

---

**Status:** ✅ Complete  
**Date:** 2026-03-11  
**Phase:** 1.7 - Trip Creation and Management

