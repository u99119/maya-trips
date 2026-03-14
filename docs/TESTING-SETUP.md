# Testing Setup Guide - Phase 2

**Date:** 2026-03-12  
**Phase:** 2.4 & 2.5 (Social System & Trip Sharing)

---

## 🎯 Overview

This guide helps you set up and run tests for the Phase 2 social features.

**What's Included:**
- ✅ Comprehensive functional testing checklist
- ✅ Automated backend tests
- ✅ Test account setup instructions
- ✅ Browser-based test runner

---

## 📋 Test Files

### **1. Functional Testing Checklist**
**File:** `docs/Phase2-Functional-Testing.md`

Comprehensive manual testing checklist covering:
- Friends system (send, accept, decline, remove)
- Notifications (create, read, mark as read, delete)
- Trip sharing (share, invite, accept, leave)
- Security testing (unauthorized access attempts)
- UI/UX testing (mobile responsiveness, animations)
- Edge cases (concurrent actions, network errors, limits)

**Usage:**
1. Open the file
2. Follow the test suites in order
3. Check off each test as you complete it
4. Document any bugs found

---

### **2. Automated Backend Tests**
**File:** `public/js/tests/social-backend-tests.js`

Automated JavaScript tests for backend methods:
- 15+ test cases
- Tests all social backend functions
- Validates data integrity
- Checks error handling

**Usage:**
1. Open browser console on the app
2. Make sure you're logged in
3. Set `TEST_CONFIG.TEST_FRIEND_USER_ID` to a test user ID
4. Run: `await runAllSocialTests()`

---

### **3. Browser Test Runner**
**File:** `test-social-backend.html`

User-friendly web interface for running automated tests:
- Visual test configuration
- Real-time console output
- Test results summary
- No command line needed

**Usage:**
1. Open `test-social-backend.html` in browser
2. Sign in to the app first (in another tab)
3. Enter test user details
4. Click "Run All Tests"
5. View results in the console output

---

## 👥 Setting Up Test Accounts

### **Step 1: Create Primary Test Account**

1. Open app: https://maya-trips.pages.dev/
2. Click "Sign In" → "Sign up"
3. Create account with:
   - Email: Your primary test email
   - Password: Choose a secure password
4. Complete profile setup
5. **Keep this session open**

---

### **Step 2: Create Secondary Test Account**

1. Open app in **incognito/private window**
2. Click "Sign In" → "Sign up"
3. Create account with:
   - Email: `test2@example.com` (or another email you control)
   - Password: Choose a secure password
4. Complete profile setup
5. **Keep this session open**

---

### **Step 3: Get Test User ID**

**Option A: From Browser Console**
1. In the secondary test account window
2. Open browser console (F12)
3. Run: `firebase.auth().currentUser.uid`
4. Copy the User ID (e.g., `abc123xyz456...`)

**Option B: From Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `maya-family-trips`
3. Go to **Authentication** → **Users**
4. Find the test user
5. Copy the User UID

---

## 🧪 Running Tests

### **Method 1: Manual Testing (Recommended First)**

1. Open `docs/Phase2-Functional-Testing.md`
2. Have both test accounts open (normal + incognito windows)
3. Follow Test Suite 1 (Friends System):
   - User 1 sends friend request to User 2
   - User 2 receives and accepts request
   - Both users verify friends list
4. Continue with Test Suite 2 (Notifications)
5. Continue with Test Suite 3 (Trip Sharing)
6. Document results using the template provided

**Estimated Time:** 1-2 hours for complete manual testing

---

### **Method 2: Automated Tests (Browser Console)**

1. Open app and sign in
2. Open browser console (F12)
3. Configure test user:
   ```javascript
   TEST_CONFIG.TEST_FRIEND_USER_ID = 'abc123xyz456...';  // Replace with real ID
   TEST_CONFIG.TEST_FRIEND_EMAIL = 'test2@example.com';
   TEST_CONFIG.TEST_FRIEND_NAME = 'Test User 2';
   ```
4. Run tests:
   ```javascript
   await runAllSocialTests();
   ```
5. Review results in console

**Estimated Time:** 5-10 minutes

---

### **Method 3: Browser Test Runner (Easiest)**

1. Open `test-social-backend.html` in browser
2. Make sure you're signed in to the app (in another tab)
3. Enter test user details in the form:
   - Test Friend User ID
   - Test Friend Email
   - Test Friend Name
4. Click "Run All Tests"
5. View results in the console output panel

**Estimated Time:** 5 minutes

---

## 📊 Understanding Test Results

### **Automated Tests Output**

```
✅ PASS: Send Friend Request
✅ PASS: Get Sent Friend Requests
✅ PASS: Cancel Friend Request
...
❌ FAIL: Accept Friend Request - Error: Request not found
```

**Summary:**
```
📊 TEST SUMMARY
==================================================
✅ Passed: 12
❌ Failed: 3
📈 Total: 15
🎯 Success Rate: 80.0%
```

---

### **What to Do If Tests Fail**

1. **Check Firebase Console:**
   - Verify security rules are deployed
   - Check Firestore data structure
   - Look for error logs

2. **Check Browser Console:**
   - Look for JavaScript errors
   - Check network requests (Network tab)
   - Verify Firebase initialization

3. **Verify Test Configuration:**
   - Correct test user ID
   - Valid email addresses
   - User is logged in

4. **Report Bugs:**
   - Use the bug reporting template in `Phase2-Functional-Testing.md`
   - Include error messages
   - Provide steps to reproduce

---

## ⚠️ Important Notes

### **Test Data**
- Automated tests create **real data** in Firestore
- Use a test Firebase project if possible
- Clean up test data after testing

### **Rate Limits**
- Firebase has rate limits for reads/writes
- If tests fail due to rate limits, wait a few minutes and retry

### **Security Rules**
- Make sure security rules are deployed before testing
- Run: `./scripts/deploy-firestore-rules.sh`
- Verify in Firebase Console

### **Network Connection**
- Tests require internet connection
- Firestore operations are asynchronous
- Some tests have built-in delays (1 second)

---

## 🐛 Troubleshooting

### **"User not logged in" Error**
**Solution:** Sign in to the app before running tests

### **"Missing or insufficient permissions" Error**
**Solution:** Deploy security rules: `./scripts/deploy-firestore-rules.sh`

### **"Request not found" Error**
**Solution:** Check that test user ID is correct and user exists

### **Tests timeout or hang**
**Solution:** Check network connection and Firebase Console for errors

### **"Too many requests" Error**
**Solution:** Wait a few minutes for rate limits to reset

---

## ✅ Testing Checklist

Before marking Phase 2 as complete:

- [ ] Manual testing completed (all test suites)
- [ ] Automated tests run successfully (>90% pass rate)
- [ ] Security testing verified (unauthorized access blocked)
- [ ] Mobile testing completed (Pixel 9A or emulator)
- [ ] Critical bugs fixed
- [ ] Test results documented
- [ ] Known issues documented

---

## 📚 Additional Resources

- **Functional Testing Guide:** `docs/Phase2-Functional-Testing.md`
- **Backend Implementation:** `docs/PHASE-2.4-2.5-IMPLEMENTATION.md`
- **Security Rules:** `docs/FIRESTORE-SECURITY-RULES.md`
- **Data Model:** `docs/FIRESTORE-DATA-MODEL.md`

---

**Happy Testing!** 🧪

If you encounter any issues, check the troubleshooting section or review the Firebase Console for error logs.

