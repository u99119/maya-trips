# Phase 2 Functional Testing Guide

**Date:** 2026-03-12
**Phase:** 2.4 & 2.5 (Social System & Trip Sharing)
**Status:** Ready for Testing

---

## 🎯 Testing Overview

This document provides a comprehensive testing checklist for Phase 2.4 (Social System) and Phase 2.5 (Trip Sharing & Collaboration).

**Testing Goals:**
- ✅ Verify all social features work end-to-end
- ✅ Confirm security rules protect user data
- ✅ Ensure UI is responsive and user-friendly
- ✅ Validate error handling and edge cases
- ✅ Test on mobile device (Pixel 9A)

---

## 👥 Test Accounts Setup

### **Account 1: Primary Test User**
- **Email:** `test1@example.com` (or your personal email)
- **Name:** Test User 1
- **Purpose:** Main testing account

### **Account 2: Secondary Test User**
- **Email:** `test2@example.com` (or another email you control)
- **Name:** Test User 2
- **Purpose:** Friend interactions, trip sharing recipient

### **Setup Instructions:**

1. **Create Account 1:**
   ```
   - Open app: https://maya-trips.pages.dev/
   - Click "Sign In" button
   - Click "Sign up" or "Create account"
   - Enter email: test1@example.com
   - Enter password: [choose a secure password]
   - Verify email if required
   - Complete profile setup
   ```

2. **Create Account 2:**
   ```
   - Open app in incognito/private window
   - OR: Sign out from Account 1 first
   - Repeat signup process with test2@example.com
   ```

3. **Keep Both Sessions Open:**
   ```
   - Browser 1 (normal): Logged in as test1@example.com
   - Browser 2 (incognito): Logged in as test2@example.com
   - OR: Use two different browsers
   ```

**Note:** You can use your real email addresses for testing. The app uses Firebase Authentication which supports multiple accounts.

---

## ✅ Testing Checklist

### **Test Suite 1: Friends System** 🤝

#### **1.1 Send Friend Request**
- [ ] **User 1:** Click Friends button (top-right)
- [ ] **User 1:** Click "Add Friend" button
- [ ] **User 1:** Enter User 2's email: `test2@example.com`
- [ ] **User 1:** (Optional) Add message: "Let's be friends!"
- [ ] **User 1:** Click "Send Request"
- [ ] **Expected:** Toast notification "Friend request sent!"
- [ ] **Expected:** Request appears in "Sent" tab
- [ ] **Expected:** Request shows "Pending" status

#### **1.2 Receive Friend Request**
- [ ] **User 2:** Refresh page or wait 30 seconds (notification polling)
- [ ] **User 2:** Check notification badge (should show "1")
- [ ] **User 2:** Click Notifications button
- [ ] **Expected:** Notification "Friend request from Test User 1"
- [ ] **User 2:** Click Friends button
- [ ] **User 2:** Go to "Requests" tab
- [ ] **Expected:** Request from User 1 appears
- [ ] **Expected:** Shows User 1's name and email
- [ ] **Expected:** "Accept" and "Decline" buttons visible

#### **1.3 Accept Friend Request**
- [ ] **User 2:** Click "Accept" button on User 1's request
- [ ] **Expected:** Toast notification "Friend request accepted!"
- [ ] **Expected:** Request disappears from "Requests" tab
- [ ] **Expected:** User 1 appears in "Friends" tab
- [ ] **User 1:** Refresh or wait for notification
- [ ] **Expected:** User 1 gets notification "Test User 2 accepted your friend request"
- [ ] **User 1:** Check Friends tab
- [ ] **Expected:** User 2 appears in friends list

#### **1.4 View Friends List**
- [ ] **User 1:** Go to Friends panel → "Friends" tab
- [ ] **Expected:** User 2 listed with name and email
- [ ] **Expected:** "Remove" button visible
- [ ] **User 2:** Go to Friends panel → "Friends" tab
- [ ] **Expected:** User 1 listed with name and email

#### **1.5 Remove Friend**
- [ ] **User 1:** Click "Remove" button next to User 2
- [ ] **Expected:** Confirmation prompt (if implemented)
- [ ] **User 1:** Confirm removal
- [ ] **Expected:** Toast notification "Friend removed"
- [ ] **Expected:** User 2 disappears from friends list
- [ ] **User 2:** Refresh page
- [ ] **Expected:** User 1 disappears from User 2's friends list

#### **1.6 Decline Friend Request**
- [ ] **User 1:** Send new friend request to User 2
- [ ] **User 2:** Go to "Requests" tab
- [ ] **User 2:** Click "Decline" button
- [ ] **Expected:** Toast notification "Friend request declined"
- [ ] **Expected:** Request disappears from list
- [ ] **User 1:** Check "Sent" tab
- [ ] **Expected:** Request status updated or removed

#### **1.7 Cancel Sent Request**
- [ ] **User 1:** Send friend request to User 2
- [ ] **User 1:** Go to "Sent" tab
- [ ] **User 1:** Click "Cancel" button
- [ ] **Expected:** Toast notification "Friend request cancelled"
- [ ] **Expected:** Request disappears from "Sent" tab
- [ ] **User 2:** Check "Requests" tab
- [ ] **Expected:** Request no longer appears

---

### **Test Suite 2: Notifications System** 🔔

#### **2.1 Notification Badge**
- [ ] **User 2:** Start with no unread notifications
- [ ] **User 1:** Send friend request to User 2
- [ ] **User 2:** Wait 30 seconds (notification polling)
- [ ] **Expected:** Notification badge appears with count "1"
- [ ] **Expected:** Badge is red/highlighted

#### **2.2 View Notifications**
- [ ] **User 2:** Click Notifications button
- [ ] **Expected:** Notifications panel slides in from right
- [ ] **Expected:** Friend request notification visible
- [ ] **Expected:** Shows sender name, message, and timestamp
- [ ] **Expected:** Notification is marked as unread (bold or highlighted)

#### **2.3 Mark as Read**
- [ ] **User 2:** Click on notification
- [ ] **Expected:** Notification marked as read (no longer bold)
- [ ] **Expected:** Badge count decreases
- [ ] **User 2:** Close and reopen notifications panel
- [ ] **Expected:** Notification still marked as read

#### **2.4 Mark All as Read**
- [ ] **User 2:** Have multiple unread notifications
- [ ] **User 2:** Click "Mark all as read" button
- [ ] **Expected:** All notifications marked as read
- [ ] **Expected:** Badge disappears or shows "0"

#### **2.5 Delete Notification**
- [ ] **User 2:** Click delete/dismiss button on notification
- [ ] **Expected:** Notification disappears from list
- [ ] **Expected:** Toast confirmation (optional)

#### **2.6 Empty State**
- [ ] **User 2:** Delete all notifications
- [ ] **Expected:** "No notifications" message appears
- [ ] **Expected:** Empty state icon/illustration (if implemented)

---

### **Test Suite 3: Trip Sharing** 🗺️

**Prerequisites:** User 1 and User 2 are friends

#### **3.1 Create a Trip (User 1)**
- [ ] **User 1:** Load a route (e.g., Vaishno Devi)
- [ ] **User 1:** Create a new trip
- [ ] **Expected:** Trip is active and visible on map

#### **3.2 Share Trip with Friend**
- [ ] **User 1:** Click "Share Trip" button (should be visible when trip is active)
- [ ] **Expected:** Share Trip modal opens
- [ ] **Expected:** Friends list appears
- [ ] **Expected:** User 2 is listed
- [ ] **User 1:** Select User 2 (checkbox or click)
- [ ] **User 1:** (Optional) Select role: "Participant" or "Viewer"
- [ ] **User 1:** Click "Share" or "Send Invite"
- [ ] **Expected:** Toast notification "Trip shared with Test User 2"
- [ ] **Expected:** User 2 appears in participants list

#### **3.3 Receive Trip Invite**
- [ ] **User 2:** Wait for notification (30 seconds)
- [ ] **Expected:** Notification badge updates
- [ ] **User 2:** Click Notifications button
- [ ] **Expected:** Trip invite notification appears
- [ ] **Expected:** Shows trip name, sender, and "Accept" button

#### **3.4 Accept Trip Invite**
- [ ] **User 2:** Click "Accept" on trip invite notification
- [ ] **Expected:** Toast notification "Trip invite accepted"
- [ ] **Expected:** Shared trip appears in User 2's trip list
- [ ] **User 2:** Navigate to shared trip
- [ ] **Expected:** Can view trip on map
- [ ] **Expected:** Can see trip details
- [ ] **Expected:** Cannot edit trip (if role is "Viewer")

#### **3.5 View Participants**
- [ ] **User 1:** Open trip participants panel
- [ ] **Expected:** User 2 appears in participants list
- [ ] **Expected:** Shows User 2's name, email, and role
- [ ] **Expected:** "Remove" button visible (for owner)

#### **3.6 Remove Participant**
- [ ] **User 1:** Click "Remove" button next to User 2
- [ ] **Expected:** Confirmation prompt
- [ ] **User 1:** Confirm removal
- [ ] **Expected:** Toast notification "Participant removed"
- [ ] **Expected:** User 2 disappears from participants list
- [ ] **User 2:** Refresh page
- [ ] **Expected:** Shared trip no longer accessible to User 2

#### **3.7 Leave Shared Trip**
- [ ] **User 1:** Share trip with User 2 again
- [ ] **User 2:** Accept invite
- [ ] **User 2:** Open trip participants panel
- [ ] **User 2:** Click "Leave Trip" button
- [ ] **Expected:** Confirmation prompt
- [ ] **User 2:** Confirm
- [ ] **Expected:** Toast notification "You left the trip"
- [ ] **Expected:** Trip removed from User 2's trip list

---

### **Test Suite 4: Security Testing** 🔒

**Goal:** Verify security rules prevent unauthorized access

#### **4.1 User Data Isolation**
- [ ] **User 1:** Open browser console (F12)
- [ ] **User 1:** Try to read User 2's profile:
  ```javascript
  const db = firebase.firestore();
  await db.collection('users').doc('USER_2_ID').get();
  ```
- [ ] **Expected:** Error: "Missing or insufficient permissions"

#### **4.2 Trip Access Control**
- [ ] **User 1:** Try to read User 2's private trip:
  ```javascript
  await db.collection('users').doc('USER_2_ID').collection('trips').get();
  ```
- [ ] **Expected:** Error: "Missing or insufficient permissions"

#### **4.3 Friend Request Validation**
- [ ] **User 1:** Try to send friend request as User 2:
  ```javascript
  await db.collection('friendRequests').add({
    fromUserId: 'USER_2_ID',  // Not your ID!
    toUserId: 'USER_3_ID',
    // ... other fields
  });
  ```
- [ ] **Expected:** Error: "Missing or insufficient permissions"

#### **4.4 Notification Privacy**
- [ ] **User 1:** Try to read User 2's notifications:
  ```javascript
  await db.collection('users').doc('USER_2_ID').collection('notifications').get();
  ```
- [ ] **Expected:** Error: "Missing or insufficient permissions"

#### **4.5 Shared Trip Access**
- [ ] **User 1:** Create a private trip (don't share)
- [ ] **User 2:** Try to access User 1's private trip:
  ```javascript
  await db.collection('sharedTrips').doc('TRIP_ID').get();
  ```
- [ ] **Expected:** Error: "Missing or insufficient permissions" (if not a participant)

---

### **Test Suite 5: UI/UX Testing** 📱

#### **5.1 Mobile Responsiveness (Pixel 9A)**
- [ ] Open app on Pixel 9A (or Chrome DevTools mobile emulation)
- [ ] **Friends Panel:**
  - [ ] Panel slides in smoothly from right
  - [ ] All tabs accessible
  - [ ] Text readable (10-11px fonts)
  - [ ] Buttons large enough to tap (44px minimum)
  - [ ] No horizontal scrolling
- [ ] **Notifications Panel:**
  - [ ] Panel slides in smoothly
  - [ ] Notifications list scrollable
  - [ ] Badge visible and positioned correctly
  - [ ] Actions (mark as read, delete) easy to tap
- [ ] **Share Trip Modal:**
  - [ ] Modal centered and sized appropriately
  - [ ] Friends list scrollable
  - [ ] Checkboxes/buttons easy to tap
  - [ ] Close button accessible

#### **5.2 Panel Animations**
- [ ] **Friends Panel:** Slides in from right smoothly (no jank)
- [ ] **Notifications Panel:** Slides in from right smoothly
- [ ] **Share Trip Modal:** Fades in/scales smoothly
- [ ] **Overlay:** Appears behind panels/modals
- [ ] **Close:** Panels slide out smoothly when closed

#### **5.3 Toast Notifications**
- [ ] Toast appears at bottom of screen
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Multiple toasts stack properly
- [ ] Toast doesn't block important UI elements
- [ ] Toast is readable on mobile

#### **5.4 Empty States**
- [ ] **No Friends:** Shows "No friends yet" message with helpful text
- [ ] **No Requests:** Shows "No pending requests" message
- [ ] **No Notifications:** Shows "No notifications" message
- [ ] **No Shared Trips:** Shows appropriate empty state

#### **5.5 Error Handling**
- [ ] **Network Error:** Shows user-friendly error message
- [ ] **Invalid Email:** Shows validation error when adding friend
- [ ] **Duplicate Request:** Prevents sending duplicate friend requests
- [ ] **Expired Invite:** Handles expired trip invites gracefully
- [ ] **Offline Mode:** Shows offline indicator (if implemented)

---

### **Test Suite 6: Edge Cases** ⚠️

#### **6.1 Concurrent Actions**
- [ ] **User 1 & User 2:** Both send friend requests to each other simultaneously
- [ ] **Expected:** Both requests handled correctly (or merged into friendship)

#### **6.2 Request Expiry**
- [ ] Send friend request
- [ ] Wait 10 days (or manually update timestamp in Firestore)
- [ ] **Expected:** Expired request handled appropriately

#### **6.3 Deleted User**
- [ ] **User 1:** Send friend request to User 2
- [ ] **User 2:** Delete account (via Firebase Console)
- [ ] **User 1:** Try to view friend request
- [ ] **Expected:** Graceful handling (no crash)

#### **6.4 Network Interruption**
- [ ] **User 1:** Start sending friend request
- [ ] **User 1:** Disable network mid-request
- [ ] **Expected:** Error message shown
- [ ] **User 1:** Re-enable network
- [ ] **Expected:** Can retry action

#### **6.5 Maximum Limits**
- [ ] **User 1:** Try to send 21st friend request (MAX_PENDING_REQUESTS = 20)
- [ ] **Expected:** Error message "Too many pending requests"
- [ ] **User 1:** Try to add 101st friend (MAX_FRIENDS = 100)
- [ ] **Expected:** Error message "Friend limit reached"

---

## 📊 Test Results Template

Use this template to record your test results:

```markdown
### Test Session: [Date]
**Tester:** [Your Name]
**Device:** [Browser/Device]
**Build:** [Commit hash or version]

#### Test Suite 1: Friends System
- [x] 1.1 Send Friend Request - ✅ PASS
- [x] 1.2 Receive Friend Request - ✅ PASS
- [ ] 1.3 Accept Friend Request - ❌ FAIL - [Bug description]
...

#### Bugs Found:
1. **Bug #1:** [Description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Screenshot:** [Link if available]

#### Notes:
- [Any additional observations]
```

---

## 🐛 Bug Reporting

If you find bugs during testing, report them with:

1. **Title:** Short, descriptive title
2. **Severity:** Critical / High / Medium / Low
3. **Steps to Reproduce:** Numbered steps
4. **Expected Behavior:** What should happen
5. **Actual Behavior:** What actually happens
6. **Environment:** Browser, device, OS
7. **Screenshot/Video:** If applicable
8. **Console Errors:** Any errors in browser console

---

## ✅ Testing Completion Criteria

**Phase 2 testing is complete when:**
- [ ] All Test Suite 1 (Friends) tests pass
- [ ] All Test Suite 2 (Notifications) tests pass
- [ ] All Test Suite 3 (Trip Sharing) tests pass
- [ ] All Test Suite 4 (Security) tests pass
- [ ] All Test Suite 5 (UI/UX) tests pass on mobile
- [ ] Critical bugs fixed
- [ ] High-priority bugs documented
- [ ] Test results documented

---

## 🚀 Next Steps After Testing

1. **Fix Critical Bugs** - Address any blocking issues
2. **Document Known Issues** - Create issue tracker for non-critical bugs
3. **Performance Optimization** - If needed based on testing
4. **Deploy to Production** - Merge to main branch
5. **Plan Phase 3** - Photo & Note sharing

---

**Happy Testing!** 🧪

