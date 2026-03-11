# Firestore Data Model Design

## 🎯 Overview

This document defines the Firestore schema for cloud storage and multi-user collaboration.

**Design Principles:**
- ✅ **Offline-first**: IndexedDB is source of truth, Firestore is backup/sync
- ✅ **Free tier optimized**: Minimize reads/writes to stay within limits
- ✅ **Privacy-focused**: Users own their data, sharing is explicit
- ✅ **OneDrive for photos**: No Firebase Storage (stays on Spark plan)

---

## 📊 Collections Structure

```
firestore/
├── users/                    # User profiles
│   └── {userId}/
│       ├── profile           # User metadata
│       └── trips/            # Subcollection: User's trips
│           └── {tripId}/
│               ├── metadata  # Trip info
│               ├── segments/ # Completed segments
│               └── notes/    # Trip notes
│
├── shared-trips/             # Shared trip access
│   └── {tripId}/
│       ├── metadata          # Trip owner, participants
│       └── participants/     # Subcollection: Access control
│           └── {userId}/
│
└── routes/                   # Cached route configs (optional)
    └── {routeId}/
```

---

## 🗂️ Collection Details

### 1. `users/{userId}`

**Document fields:**
```javascript
{
  userId: "firebase-auth-uid",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  createdAt: "2026-03-11T12:00:00Z",
  lastLoginAt: "2026-03-11T12:00:00Z",
  
  // Settings
  settings: {
    defaultAutoCenter: true,
    defaultBatterySaver: false,
    theme: "auto" // "light", "dark", "auto"
  },
  
  // Statistics
  stats: {
    totalTrips: 5,
    totalDistance: 50000, // meters
    totalTime: 18000 // seconds
  }
}
```

**Indexes:**
- `email` (for user lookup)
- `createdAt` (for admin queries)

---

### 2. `users/{userId}/trips/{tripId}`

**Document fields:**
```javascript
{
  tripId: "uuid-v4",
  routeId: "pune-eisha-cisco",
  tripName: "Morning Commute - March 11",
  
  // Status
  status: "in-progress", // "planned", "in-progress", "completed", "archived"
  createdAt: "2026-03-11T06:00:00Z",
  startedAt: "2026-03-11T06:30:00Z",
  completedAt: null,
  
  // Current state
  currentJunction: "eisha-zenith",
  currentSegment: null,
  
  // Progress
  visitedMilestones: [
    {
      milestoneId: "eisha-zenith",
      visitedAt: "2026-03-11T06:30:00Z",
      location: { lat: 18.612078, lng: 73.745192 }
    }
  ],
  
  // Completed segments
  completedSegments: [
    {
      segmentId: "eisha-akshara",
      startedAt: "2026-03-11T06:30:00Z",
      completedAt: "2026-03-11T06:35:00Z",
      actualDistance: 1050,
      actualTime: 300,
      transportMode: "driving"
    }
  ],
  
  // Settings snapshot
  settings: {
    gpsEnabled: true,
    batterySaver: false,
    autoCenter: true
  },
  
  // Statistics
  stats: {
    totalDistance: 1050,
    totalTime: 300,
    averageSpeed: 3.5,
    efficiency: 95
  },
  
  // Sharing
  isShared: false,
  sharedWith: [], // Array of userIds
  
  // Sync metadata
  lastSyncedAt: "2026-03-11T06:35:00Z",
  syncVersion: 1
}
```

**Indexes:**
- `routeId` (filter trips by route)
- `status` (filter by status)
- `createdAt` (sort by date)
- `isShared` (find shared trips)

---

### 3. `users/{userId}/trips/{tripId}/notes/{noteId}`

**Document fields:**
```javascript
{
  noteId: "uuid-v4",
  tripId: "trip-uuid",
  milestoneId: "junction-id",
  
  text: "Great view from here!",
  
  createdAt: "2026-03-11T07:00:00Z",
  updatedAt: "2026-03-11T07:05:00Z",
  
  location: {
    lat: 18.612078,
    lng: 73.745192
  },
  
  // Photo reference (OneDrive)
  photos: [
    {
      oneDriveId: "file-id-123",
      oneDriveUrl: "https://onedrive.live.com/...",
      thumbnail: "https://...",
      uploadedAt: "2026-03-11T07:01:00Z"
    }
  ]
}
```

---

### 4. `shared-trips/{tripId}`

**Document fields:**
```javascript
{
  tripId: "uuid-v4",
  ownerId: "owner-user-id",
  ownerName: "John Doe",
  
  tripName: "Family Trip to Vaishno Devi",
  routeId: "vaishno-devi",
  
  // Access control
  participants: [
    {
      userId: "user-id-1",
      email: "user1@example.com",
      displayName: "Jane Doe",
      role: "editor", // "viewer", "editor"
      joinedAt: "2026-03-11T08:00:00Z"
    }
  ],
  
  createdAt: "2026-03-11T06:00:00Z",
  lastActivityAt: "2026-03-11T08:30:00Z"
}
```

---

## 🔒 Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      // Users can read/write their own profile
      allow read, write: if isOwner(userId);

      // Trips subcollection
      match /trips/{tripId} {
        // Users can read/write their own trips
        allow read, write: if isOwner(userId);

        // Notes subcollection
        match /notes/{noteId} {
          allow read, write: if isOwner(userId);
        }
      }
    }

    // Shared trips collection
    match /shared-trips/{tripId} {
      // Owner can read/write
      allow read, write: if isAuthenticated() &&
        resource.data.ownerId == request.auth.uid;

      // Participants can read
      allow read: if isAuthenticated() &&
        request.auth.uid in resource.data.participants;

      // Participants with editor role can write
      allow write: if isAuthenticated() &&
        resource.data.participants[request.auth.uid].role == 'editor';
    }

    // Routes collection (public read, admin write)
    match /routes/{routeId} {
      allow read: if true; // Public routes
      allow write: if false; // Only via admin SDK
    }
  }
}
```

---

## 📈 Sync Strategy

### Offline-First Architecture

```
┌─────────────────┐
│   IndexedDB     │ ← Source of truth (local)
│  (Local First)  │
└────────┬────────┘
         │
         │ Bidirectional Sync
         │
         ↓
┌─────────────────┐
│   Firestore     │ ← Cloud backup/sync
│  (Cloud Backup) │
└─────────────────┘
```

### Sync Rules

1. **Write to IndexedDB first** (instant, offline-capable)
2. **Sync to Firestore in background** (when online)
3. **On app start**: Check Firestore for newer data
4. **Conflict resolution**: Last-write-wins (based on `lastSyncedAt`)

### Sync Triggers

- **Trip created**: Sync immediately
- **Segment completed**: Sync immediately
- **Note added**: Sync immediately
- **Settings changed**: Debounce 5 seconds
- **App start**: Full sync check
- **Network reconnect**: Resume pending syncs

---

## 💰 Cost Optimization

### Free Tier Limits (Firestore)

| Operation | Free Limit | Expected Usage | % Used |
|-----------|-----------|----------------|--------|
| **Reads** | 50,000/day | ~500/day | 1% |
| **Writes** | 20,000/day | ~200/day | 1% |
| **Deletes** | 20,000/day | ~10/day | 0.05% |
| **Storage** | 1 GB | ~50 MB | 5% |

### Optimization Strategies

1. **Batch writes**: Group multiple updates into single transaction
2. **Debounce syncs**: Don't sync every GPS update (only milestones/segments)
3. **Selective sync**: Only sync changed fields, not entire documents
4. **Cache locally**: Read from IndexedDB, not Firestore
5. **Lazy load**: Only fetch trips when user opens trip list

### What NOT to Sync

- ❌ GPS position updates (too frequent)
- ❌ Map state (zoom, center)
- ❌ UI state (drawer height, layer visibility)
- ❌ Photos (use OneDrive instead)

### What TO Sync

- ✅ Trip metadata (name, status, dates)
- ✅ Completed segments
- ✅ Visited milestones
- ✅ Notes (text only, photos via OneDrive)
- ✅ User settings
- ✅ Sharing permissions

---

## 🔄 Migration Plan

### Phase 1: Add Firestore Sync (Task 2.3)
1. Create Firestore sync module
2. Implement user profile sync
3. Implement trip sync (one-way: IndexedDB → Firestore)
4. Test with existing trips

### Phase 2: Bidirectional Sync
1. Implement Firestore → IndexedDB sync
2. Conflict resolution
3. Test multi-device sync

### Phase 3: Sharing (Task 2.4)
1. Implement shared-trips collection
2. Invitation system
3. Real-time collaboration

### Phase 4: OneDrive Photos (Task 2.5)
1. Microsoft Graph API integration
2. Photo upload to OneDrive
3. Photo references in Firestore notes

---

## 📝 Next Steps

1. ✅ Review this data model
2. ⏳ Create Firestore sync module (`firestore-sync.js`)
3. ⏳ Implement user profile sync
4. ⏳ Implement trip sync
5. ⏳ Deploy security rules
6. ⏳ Test multi-device sync

---

**Status:** ✅ Data model designed, ready for implementation
**Next Task:** Task 2.3 - Implement Firestore sync module

