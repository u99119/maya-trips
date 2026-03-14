# Firestore Security Rules - Quick Start Guide

## 🚀 Deploy Rules (Choose One Method)

### **Method 1: Firebase Console** (Easiest - No CLI needed)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select project: **maya-family-trips**
3. Go to **Firestore Database** → **Rules** tab
4. Copy all content from `firestore.rules` file
5. Paste into the editor
6. Click **Publish**
7. ✅ Done!

---

### **Method 2: Automated Script** (Recommended for developers)

```bash
# Run the deployment script
./scripts/deploy-firestore-rules.sh
```

The script will:
- ✅ Check if Firebase CLI is installed
- ✅ Verify you're logged in
- ✅ Show current project
- ✅ Ask for confirmation
- ✅ Deploy the rules

---

### **Method 3: Firebase CLI** (Manual)

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Set the project
firebase use maya-family-trips

# 4. Deploy rules
firebase deploy --only firestore:rules
```

---

## 🔒 What These Rules Protect

### ✅ **User Privacy**
- Users can only access their own data
- Profiles, trips, and notifications are private
- No cross-user data leakage

### ✅ **Friend System**
- Friend requests require both parties' consent
- Users can only send requests as themselves
- Friend lists are private

### ✅ **Trip Sharing**
- Only trip owners can share trips
- Participants must be explicitly added
- Non-participants cannot access shared trips

### ✅ **Data Integrity**
- All writes validate required fields
- Users cannot impersonate others
- Malicious data is rejected

---

## 🧪 Test After Deployment

### **1. Test User Isolation**
```javascript
// In browser console (as User A)
const db = firebase.firestore();

// ✅ Should work: Read own trips
await db.collection('users').doc(myUserId).collection('trips').get();

// ❌ Should fail: Read another user's trips
await db.collection('users').doc(otherUserId).collection('trips').get();
// Error: Missing or insufficient permissions
```

### **2. Test Friend Requests**
```javascript
// ✅ Should work: Send friend request
await db.collection('friendRequests').add({
  fromUserId: myUserId,
  fromUserEmail: myEmail,
  fromUserName: myName,
  toUserId: friendUserId,
  toUserEmail: friendEmail,
  status: 'pending',
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

// ❌ Should fail: Send request as someone else
await db.collection('friendRequests').add({
  fromUserId: otherUserId,  // Not your ID!
  // ... rest of fields
});
// Error: Missing or insufficient permissions
```

### **3. Test Trip Sharing**
```javascript
// ✅ Should work: Share your own trip
await db.collection('sharedTrips').doc(myTripId).set({
  tripId: myTripId,
  ownerId: myUserId,  // Your ID
  ownerEmail: myEmail,
  ownerName: myName,
  tripName: 'My Trip',
  routeId: 'some-route',
  visibility: 'friends',
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

// ❌ Should fail: Share someone else's trip
await db.collection('sharedTrips').doc(otherTripId).set({
  ownerId: otherUserId,  // Not your ID!
  // ... rest of fields
});
// Error: Missing or insufficient permissions
```

---

## 🆘 Troubleshooting

### **"Missing or insufficient permissions"**

This is **GOOD**! It means the security rules are working.

**Common causes:**
- ✅ Trying to access another user's data (expected)
- ✅ Missing required fields in write operation
- ✅ Not authenticated (need to sign in)

**How to fix:**
- Make sure you're signed in
- Check you're accessing your own data
- Verify all required fields are present

---

### **Rules not updating**

**Solution:**
1. Wait 1-2 minutes for propagation
2. Clear browser cache
3. Sign out and sign in again
4. Check Firebase Console to verify rules are published

---

### **"Firebase CLI not found"**

**Solution:**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

---

### **"Not logged in to Firebase"**

**Solution:**
```bash
# Login to Firebase
firebase login

# Verify login
firebase projects:list
```

---

## 📊 Security Rules Summary

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `users/{userId}` | Owner only | Owner only | Owner only | ❌ Disabled |
| `users/{userId}/trips/{tripId}` | Owner only | Owner only | Owner only | Owner only |
| `users/{userId}/friends/{friendId}` | Owner only | Owner only | Owner only | Owner only |
| `users/{userId}/notifications/{notificationId}` | Owner only | Anyone (for system) | Owner only | Owner only |
| `friendRequests/{requestId}` | Sender or Recipient | Sender only | Sender or Recipient | Sender or Recipient |
| `sharedTrips/{tripId}` | Owner or Participant | Owner only | Owner only | Owner only |
| `sharedTrips/{tripId}/participants/{participantId}` | Owner or Self | Owner only | Owner only | Owner or Self |
| `routes/{routeId}` | Public | ❌ Disabled | ❌ Disabled | ❌ Disabled |

---

## ✅ Checklist

Before going to production:

- [ ] Deploy security rules to Firebase
- [ ] Test user isolation (cannot read other users' data)
- [ ] Test friend request flow (send, accept, decline)
- [ ] Test trip sharing (share, access, remove participant)
- [ ] Test notifications (create, read, mark as read)
- [ ] Verify rules in Firebase Console
- [ ] Monitor Firestore usage in Firebase Console

---

## 📚 More Information

- **Full Documentation:** `docs/FIRESTORE-SECURITY-RULES.md`
- **Data Model:** `docs/FIRESTORE-DATA-MODEL.md`
- **Firebase Console:** https://console.firebase.google.com/project/maya-family-trips/firestore

---

**Ready to deploy?** Choose a method above and secure your data! 🔒

