# Firestore Security Rules Documentation

## 🔒 Overview

This document explains the Firestore security rules that protect user data and ensure proper access control for the PWA Family Travel Navigation app.

**Security Principles:**
- ✅ **Authentication Required**: All operations require a logged-in user
- ✅ **User Data Isolation**: Users can only access their own data
- ✅ **Explicit Sharing**: Trip sharing requires explicit participant records
- ✅ **Friend Verification**: Friend relationships are bidirectional and verified
- ✅ **Notification Privacy**: Users can only read their own notifications
- ✅ **Request Validation**: All writes validate required fields

---

## 📋 Collections & Access Control

### 1. **`users/{userId}`** - User Profiles

**Access Rules:**
- ✅ **Read**: User can read their own profile only
- ✅ **Create**: User can create their own profile on first login
- ✅ **Update**: User can update their own profile
- ❌ **Delete**: Disabled (use Firebase Authentication to delete accounts)

**Required Fields on Create:**
- `userId` (must match authenticated user ID)
- `email`
- `createdAt`

**Security:**
- Users cannot read other users' profiles
- Users cannot impersonate other users
- Profile creation is tied to Firebase Authentication

---

### 2. **`users/{userId}/trips/{tripId}`** - User Trips

**Access Rules:**
- ✅ **Read**: User can read their own trips
- ✅ **Create**: User can create trips in their own collection
- ✅ **Update**: User can update their own trips
- ✅ **Delete**: User can delete their own trips

**Required Fields on Create:**
- `tripId`
- `routeId`
- `tripName`
- `status`
- `createdAt`

**Subcollections:**
- `segments/{segmentId}`: Full read/write access for owner
- `notes/{noteId}`: Full read/write access for owner
- `participants/{participantId}`: Owner has full access, participants can read their own record

**Security:**
- Trips are private by default
- Only the owner can modify trip data
- Participants can only view, not edit

---

### 3. **`users/{userId}/friends/{friendId}`** - Friends List

**Access Rules:**
- ✅ **Read**: User can read their own friends list
- ✅ **Create**: User can add friends (after request is accepted)
- ✅ **Update**: User can update friend metadata
- ✅ **Delete**: User can remove friends

**Required Fields on Create:**
- `friendId`
- `friendEmail`
- `friendName`
- `createdAt`

**Security:**
- Friends list is private
- Only the user can manage their friends
- Friend relationships are created after request acceptance

---

### 4. **`users/{userId}/notifications/{notificationId}`** - Notifications

**Access Rules:**
- ✅ **Read**: User can read their own notifications
- ✅ **Create**: Any authenticated user can create notifications (for friend requests, trip invites, etc.)
- ✅ **Update**: User can update their own notifications (mark as read)
- ✅ **Delete**: User can delete their own notifications

**Required Fields on Create:**
- `type`
- `title`
- `message`
- `createdAt`
- `read`

**Security:**
- Notifications are private to the recipient
- System can create notifications for users
- Users can only modify their own notifications

---

### 5. **`friendRequests/{requestId}`** - Friend Requests

**Access Rules:**
- ✅ **Read**: User can read requests they sent OR received
- ✅ **Create**: User can send friend requests
- ✅ **Update**: Sender can cancel, recipient can accept/decline
- ✅ **Delete**: Sender or recipient can delete

**Required Fields on Create:**
- `fromUserId` (must match authenticated user)
- `fromUserEmail`
- `fromUserName`
- `toUserId`
- `toUserEmail`
- `status`
- `createdAt`

**Security:**
- Users can only send requests as themselves
- Both parties can view the request
- Only recipient can accept/decline
- Only sender can cancel pending requests

---

### 6. **`sharedTrips/{tripId}`** - Shared Trip Metadata

**Access Rules:**
- ✅ **Read**: Owner and participants can read
- ✅ **Create**: Only the owner can create
- ✅ **Update**: Only the owner can update
- ✅ **Delete**: Only the owner can delete

**Required Fields on Create:**
- `tripId`
- `ownerId` (must match authenticated user)
- `ownerEmail`
- `ownerName`
- `tripName`
- `routeId`
- `visibility`
- `createdAt`

**Security:**
- Only the trip owner can share trips
- Participants must be explicitly added
- Owner has full control over sharing

---

### 7. **`sharedTrips/{tripId}/participants/{participantId}`** - Trip Participants

**Access Rules:**
- ✅ **Read**: Owner and the participant can read
- ✅ **Create**: Only the owner can add participants
- ✅ **Update**: Only the owner can change roles
- ✅ **Delete**: Owner can remove, or participant can leave

**Required Fields on Create:**
- `userId`
- `userEmail`
- `userName`
- `role`
- `addedAt`

**Security:**
- Participants cannot add other participants
- Only owner can change participant roles
- Participants can remove themselves (leave trip)

---

### 8. **`routes/{routeId}`** - Route Configurations

**Access Rules:**
- ✅ **Read**: Public (anyone can read)
- ❌ **Write**: Disabled (managed via Firebase Console)

**Security:**
- Routes are public data
- Only admins can modify routes
- Prevents users from creating fake routes

---

## 🛡️ Security Features

### **1. Authentication Enforcement**
All operations require `request.auth != null`

### **2. Owner Verification**
```javascript
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

### **3. Field Validation**
```javascript
function hasRequiredFields(fields) {
  return request.resource.data.keys().hasAll(fields);
}
```

### **4. Friend Verification**
```javascript
function isFriend(userId) {
  return exists(/databases/$(database)/documents/users/$(userId)/friends/$(request.auth.uid));
}
```

### **5. Participant Verification**
```javascript
function isTripParticipant(tripId, ownerId) {
  return request.auth.uid == ownerId ||
         exists(/databases/$(database)/documents/users/$(ownerId)/trips/$(tripId)/participants/$(request.auth.uid));
}
```

---

## 🚀 Deployment Instructions

### **Option 1: Firebase Console (Recommended)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `maya-family-trips`
3. Navigate to **Firestore Database** > **Rules**
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

### **Option 2: Firebase CLI**

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## ✅ Testing Security Rules

After deploying, test the rules:

1. **Test User Isolation:**
   - Create two test accounts
   - Try to access another user's trips (should fail)

2. **Test Friend Requests:**
   - Send a friend request
   - Try to accept your own request (should fail)
   - Accept from the recipient account (should succeed)

3. **Test Trip Sharing:**
   - Share a trip with a friend
   - Try to access as non-participant (should fail)
   - Access as participant (should succeed)

4. **Test Notifications:**
   - Create a notification
   - Try to read another user's notifications (should fail)

---

## 🔍 Common Security Scenarios

| Scenario | Allowed? | Rule |
|----------|----------|------|
| User reads own profile | ✅ Yes | `isOwner(userId)` |
| User reads another's profile | ❌ No | Access denied |
| User creates trip in own collection | ✅ Yes | `isOwner(userId)` |
| User creates trip in another's collection | ❌ No | Access denied |
| User sends friend request | ✅ Yes | `fromUserId == request.auth.uid` |
| User accepts friend request | ✅ Yes | `toUserId == request.auth.uid` |
| User shares own trip | ✅ Yes | `ownerId == request.auth.uid` |
| User shares another's trip | ❌ No | Access denied |
| Participant reads shared trip | ✅ Yes | Participant record exists |
| Non-participant reads shared trip | ❌ No | Access denied |

---

## 📚 Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Best Practices](https://firebase.google.com/docs/firestore/security/rules-conditions)

---

**Last Updated:** 2026-03-12  
**Version:** 1.0 (Phase 2.4 & 2.5)

