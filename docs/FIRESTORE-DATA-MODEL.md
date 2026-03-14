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
│       ├── trips/            # Subcollection: User's trips
│       │   └── {tripId}/
│       │       ├── metadata  # Trip info
│       │       ├── segments/ # Completed segments
│       │       └── notes/    # Trip notes
│       ├── friends/          # Subcollection: User's friends (Phase 2.4)
│       │   └── {friendId}    # Friend relationship
│       └── notifications/    # Subcollection: User's notifications (Phase 2.4)
│           └── {notificationId}
│
├── friendRequests/           # Global friend requests (Phase 2.4)
│   └── {requestId}
│
├── shared-trips/             # Shared trip access (Phase 2.5)
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

## 🤝 Phase 2.4: Friends System

### 4. `users/{userId}/friends/{friendId}`

**Document fields:**
```javascript
{
  friendId: "user_abc123",
  friendEmail: "friend@example.com",
  friendName: "John Doe",
  friendPhotoURL: "https://...",

  status: "accepted", // Always "accepted" in this collection

  addedAt: Timestamp,
  acceptedAt: Timestamp,
  lastInteraction: Timestamp, // Last trip shared, message sent, etc.

  // Metadata
  sharedTripsCount: 3, // Number of trips shared with this friend
  mutualFriends: 5 // Number of mutual friends (optional, computed)
}
```

**Indexes:**
- `friendEmail` (for search)
- `addedAt` (for sorting)
- `lastInteraction` (for sorting by recent)

**Notes:**
- Only accepted friends are stored here
- Pending requests are in the global `friendRequests` collection
- Both users have a document in each other's friends subcollection

---

### 5. `friendRequests/{requestId}`

**Document fields:**
```javascript
{
  requestId: "req_xyz789",

  // Sender info
  fromUserId: "user_abc123",
  fromUserEmail: "sender@example.com",
  fromUserName: "John Doe",
  fromUserPhotoURL: "https://...",

  // Recipient info
  toUserId: "user_def456",
  toUserEmail: "recipient@example.com",

  // Request details
  status: "pending", // "pending", "accepted", "declined", "cancelled", "expired"
  message: "Hey! Let's plan trips together!", // Optional message

  // Timestamps
  createdAt: Timestamp,
  respondedAt: Timestamp,
  expiresAt: Timestamp // Auto-expire after 10 days (SOCIAL_CONFIG.REQUEST_EXPIRY_DAYS)
}
```

**Indexes:**
- `fromUserId` (to query sent requests)
- `toUserId` (to query received requests)
- `status` (to filter by status)
- `expiresAt` (for cleanup)

**Lifecycle:**
1. User A sends request → Document created with `status: "pending"`
2. User B accepts → `status: "accepted"`, both users get friend documents
3. User B declines → `status: "declined"`
4. User A cancels → `status: "cancelled"`
5. After 10 days → `status: "expired"` (auto-cleanup)

---

### 6. `users/{userId}/notifications/{notificationId}`

**Document fields:**
```javascript
{
  notificationId: "notif_abc123",
  userId: "user_def456", // Recipient

  // Notification type and priority
  type: "friend_request", // See NOTIFICATION_TYPES in social-config.js
  priority: "normal", // "low", "normal", "high", "urgent"

  // Content
  title: "New Friend Request",
  message: "John Doe sent you a friend request",
  icon: "👥", // Emoji or icon identifier

  // Related data (for context)
  relatedUserId: "user_abc123", // Who triggered this notification
  relatedUserName: "John Doe",
  relatedUserPhotoURL: "https://...",

  relatedTripId: "trip_xyz789", // If trip-related
  relatedTripName: "Vaishno Devi - May 2024",

  relatedRequestId: "req_xyz789", // If friend request

  // Actions
  actionUrl: "/friends/requests", // Where to navigate on click
  actionType: "friend_request", // What action to take
  actionData: { requestId: "req_xyz789" }, // Additional data for action

  // Status
  read: false,
  readAt: Timestamp,
  dismissed: false,
  dismissedAt: Timestamp,

  // Timestamps
  createdAt: Timestamp,
  expiresAt: Timestamp // Auto-delete after 30 days
}
```

**Indexes:**
- `userId` (implicit - subcollection)
- `type` (to filter by notification type)
- `read` (to query unread notifications)
- `createdAt` (for sorting)
- `expiresAt` (for cleanup)

**Automatic Cleanup:**
- Notifications older than 30 days are auto-deleted
- Only last 50 notifications are kept per user
- Cleanup runs every hour (configurable in `social-config.js`)

---

## 🎁 Phase 2.5: Trip Sharing

### 7. Updated `users/{userId}/trips/{tripId}`

**New fields for sharing:**
```javascript
{
  // ... existing trip fields ...

  // Ownership & Visibility
  owner: "user_abc123", // Trip owner (creator)
  visibility: "private", // "private", "friends", "public"

  // Participants (collaborators)
  participants: [
    {
      userId: "user_def456",
      email: "friend@example.com",
      name: "John Doe",
      photoURL: "https://...",
      role: "participant", // "owner", "participant", "viewer"
      addedAt: Timestamp,
      addedBy: "user_abc123",
      lastActive: Timestamp
    }
  ],

  // Pending invites
  invites: [
    {
      inviteId: "invite_xyz789",
      email: "pending@example.com",
      role: "participant",
      status: "pending", // "pending", "accepted", "declined", "expired"
      invitedAt: Timestamp,
      invitedBy: "user_abc123",
      expiresAt: Timestamp // Auto-expire after 7 days
    }
  ],

  // Collaboration stats
  totalPhotos: 15,
  totalNotes: 8,
  lastActivity: Timestamp,
  lastActivityBy: "user_def456"
}
```

**Participant Roles:**
- **Owner**: Full control (edit, delete, manage participants)
- **Participant**: Can add photos/notes, mark milestones
- **Viewer**: Read-only access

---

### 8. `shared-trips/{tripId}`

**Purpose:** Public index for trip discovery (friends/public trips)

**Document fields:**
```javascript
{
  tripId: "trip_abc123",
  tripName: "Vaishno Devi - May 2024",
  routeId: "vaishno-devi",
  routeName: "Vaishno Devi Yatra",

  // Owner info
  owner: "user_abc123",
  ownerName: "Mayank Singh",
  ownerPhotoURL: "https://...",

  // Sharing settings
  visibility: "friends", // "friends", "public"
  participantCount: 3,

  // Timestamps
  createdAt: Timestamp,
  lastActivity: Timestamp,

  // For search/filtering
  tags: ["pilgrimage", "trekking", "family"],
  region: "Jammu & Kashmir",
  difficulty: "moderate"
}
```

**Indexes:**
- `owner` (to query user's shared trips)
- `visibility` (to filter public/friends trips)
- `tags` (array-contains for search)
- `region` (for location-based search)
- `lastActivity` (for sorting by recent)

**Notes:**
- Only created when trip visibility is "friends" or "public"
- Deleted when trip is made private or deleted
- Used for discovery, not for actual trip data

---

## 📝 Next Steps

1. ✅ Review this data model
2. ✅ Create Firestore sync module (`firestore-sync.js`)
3. ✅ Implement user profile sync
4. ✅ Implement trip sync
5. ✅ Deploy security rules
6. ✅ Test multi-device sync
7. ⏳ Implement friends system (Phase 2.4)
8. ⏳ Implement trip sharing (Phase 2.5)

---

**Status:** ✅ Data model designed, ready for implementation
**Next Task:** Task 2.3 - Implement Firestore sync module

