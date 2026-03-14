/**
 * Automated Tests for Phase 2.4 & 2.5 Backend Methods
 * 
 * These tests verify the social system backend functionality:
 * - Friends system (send, accept, decline, remove)
 * - Notifications (create, read, mark as read, delete)
 * - Trip sharing (share, invite, accept, leave)
 * 
 * Usage:
 * 1. Open browser console on the app
 * 2. Make sure you're logged in
 * 3. Run: await runAllSocialTests()
 * 
 * Note: These tests create real data in Firestore.
 * Use a test Firebase project or clean up after testing.
 */

// Test configuration
const TEST_CONFIG = {
  // Set this to a real test user ID (another account you control)
  TEST_FRIEND_USER_ID: 'REPLACE_WITH_TEST_USER_ID',
  TEST_FRIEND_EMAIL: 'test2@example.com',
  TEST_FRIEND_NAME: 'Test User 2',
  
  // Test data
  TEST_TRIP_ID: 'test-trip-' + Date.now(),
  TEST_TRIP_NAME: 'Test Trip for Sharing',
  TEST_ROUTE_ID: 'vaishno-devi',
  
  // Delays for async operations
  ASYNC_DELAY: 1000, // 1 second
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

// Helper: Assert function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Helper: Log test result
function logTest(testName, passed, error = null) {
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error?.message || 'Unknown error' });
    console.error(`❌ FAIL: ${testName}`, error);
  }
}

// Helper: Wait for async operations
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TEST SUITE 1: FRIENDS SYSTEM
// ============================================

async function testSendFriendRequest() {
  const testName = 'Send Friend Request';
  try {
    const result = await window.firestoreSync.sendFriendRequest(
      TEST_CONFIG.TEST_FRIEND_USER_ID,
      TEST_CONFIG.TEST_FRIEND_EMAIL,
      TEST_CONFIG.TEST_FRIEND_NAME,
      'Test friend request message'
    );
    
    assert(result.success, 'Friend request should succeed');
    assert(result.requestId, 'Should return request ID');
    
    // Store for later tests
    window.TEST_REQUEST_ID = result.requestId;
    
    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testGetSentFriendRequests() {
  const testName = 'Get Sent Friend Requests';
  try {
    const requests = await window.firestoreSync.getSentFriendRequests();
    
    assert(Array.isArray(requests), 'Should return an array');
    assert(requests.length > 0, 'Should have at least one sent request');
    
    const testRequest = requests.find(r => r.id === window.TEST_REQUEST_ID);
    assert(testRequest, 'Should find the test request');
    assert(testRequest.status === 'pending', 'Request should be pending');
    
    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testCancelFriendRequest() {
  const testName = 'Cancel Friend Request';
  try {
    // Send a new request to cancel
    const sendResult = await window.firestoreSync.sendFriendRequest(
      TEST_CONFIG.TEST_FRIEND_USER_ID,
      TEST_CONFIG.TEST_FRIEND_EMAIL,
      TEST_CONFIG.TEST_FRIEND_NAME
    );
    
    await wait(TEST_CONFIG.ASYNC_DELAY);
    
    const result = await window.firestoreSync.cancelFriendRequest(sendResult.requestId);
    
    assert(result.success, 'Cancel should succeed');
    
    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testGetFriends() {
  const testName = 'Get Friends List';
  try {
    const friends = await window.firestoreSync.getFriends();
    
    assert(Array.isArray(friends), 'Should return an array');
    // Note: May be empty if no friends yet
    
    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

// ============================================
// TEST SUITE 2: NOTIFICATIONS SYSTEM
// ============================================

async function testCreateNotification() {
  const testName = 'Create Notification';
  try {
    const result = await window.firestoreSync.createNotification(
      'test',
      'Test Notification',
      'This is a test notification',
      'normal',
      { testData: 'test value' }
    );
    
    assert(result.success, 'Notification creation should succeed');
    assert(result.notificationId, 'Should return notification ID');
    
    // Store for later tests
    window.TEST_NOTIFICATION_ID = result.notificationId;
    
    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testGetNotifications() {
  const testName = 'Get Notifications';
  try {
    const notifications = await window.firestoreSync.getNotifications();

    assert(Array.isArray(notifications), 'Should return an array');
    assert(notifications.length > 0, 'Should have at least one notification');

    const testNotif = notifications.find(n => n.id === window.TEST_NOTIFICATION_ID);
    assert(testNotif, 'Should find the test notification');
    assert(testNotif.read === false, 'Notification should be unread');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testMarkNotificationAsRead() {
  const testName = 'Mark Notification as Read';
  try {
    const result = await window.firestoreSync.markNotificationAsRead(window.TEST_NOTIFICATION_ID);

    assert(result.success, 'Mark as read should succeed');

    await wait(TEST_CONFIG.ASYNC_DELAY);

    // Verify it's marked as read
    const notifications = await window.firestoreSync.getNotifications();
    const testNotif = notifications.find(n => n.id === window.TEST_NOTIFICATION_ID);
    assert(testNotif.read === true, 'Notification should be marked as read');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testMarkAllNotificationsAsRead() {
  const testName = 'Mark All Notifications as Read';
  try {
    // Create a few more notifications
    await window.firestoreSync.createNotification('test', 'Test 1', 'Message 1');
    await window.firestoreSync.createNotification('test', 'Test 2', 'Message 2');

    await wait(TEST_CONFIG.ASYNC_DELAY);

    const result = await window.firestoreSync.markAllNotificationsAsRead();

    assert(result.success, 'Mark all as read should succeed');

    await wait(TEST_CONFIG.ASYNC_DELAY);

    // Verify all are marked as read
    const notifications = await window.firestoreSync.getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    assert(unreadCount === 0, 'All notifications should be marked as read');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testGetUnreadNotificationCount() {
  const testName = 'Get Unread Notification Count';
  try {
    // Create a new unread notification
    await window.firestoreSync.createNotification('test', 'Unread Test', 'Unread message');

    await wait(TEST_CONFIG.ASYNC_DELAY);

    const count = await window.firestoreSync.getUnreadNotificationCount();

    assert(typeof count === 'number', 'Should return a number');
    assert(count > 0, 'Should have at least one unread notification');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testDeleteNotification() {
  const testName = 'Delete Notification';
  try {
    const result = await window.firestoreSync.deleteNotification(window.TEST_NOTIFICATION_ID);

    assert(result.success, 'Delete should succeed');

    await wait(TEST_CONFIG.ASYNC_DELAY);

    // Verify it's deleted
    const notifications = await window.firestoreSync.getNotifications();
    const testNotif = notifications.find(n => n.id === window.TEST_NOTIFICATION_ID);
    assert(!testNotif, 'Notification should be deleted');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

// ============================================
// TEST SUITE 3: TRIP SHARING SYSTEM
// ============================================

async function testShareTrip() {
  const testName = 'Share Trip';
  try {
    // First, create a test trip in Firestore
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;

    await db.collection('users').doc(user.uid).collection('trips').doc(TEST_CONFIG.TEST_TRIP_ID).set({
      tripId: TEST_CONFIG.TEST_TRIP_ID,
      tripName: TEST_CONFIG.TEST_TRIP_NAME,
      routeId: TEST_CONFIG.TEST_ROUTE_ID,
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await wait(TEST_CONFIG.ASYNC_DELAY);

    // Now share the trip
    const result = await window.firestoreSync.shareTrip(
      TEST_CONFIG.TEST_TRIP_ID,
      TEST_CONFIG.TEST_TRIP_NAME,
      TEST_CONFIG.TEST_ROUTE_ID,
      'friends'
    );

    assert(result.success, 'Share trip should succeed');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testAddTripParticipant() {
  const testName = 'Add Trip Participant';
  try {
    const result = await window.firestoreSync.addTripParticipant(
      TEST_CONFIG.TEST_TRIP_ID,
      TEST_CONFIG.TEST_FRIEND_USER_ID,
      TEST_CONFIG.TEST_FRIEND_EMAIL,
      TEST_CONFIG.TEST_FRIEND_NAME,
      'participant'
    );

    assert(result.success, 'Add participant should succeed');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testGetTripParticipants() {
  const testName = 'Get Trip Participants';
  try {
    const participants = await window.firestoreSync.getTripParticipants(TEST_CONFIG.TEST_TRIP_ID);

    assert(Array.isArray(participants), 'Should return an array');
    assert(participants.length > 0, 'Should have at least one participant');

    const testParticipant = participants.find(p => p.userId === TEST_CONFIG.TEST_FRIEND_USER_ID);
    assert(testParticipant, 'Should find the test participant');
    assert(testParticipant.role === 'participant', 'Participant should have correct role');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testRemoveTripParticipant() {
  const testName = 'Remove Trip Participant';
  try {
    const result = await window.firestoreSync.removeTripParticipant(
      TEST_CONFIG.TEST_TRIP_ID,
      TEST_CONFIG.TEST_FRIEND_USER_ID
    );

    assert(result.success, 'Remove participant should succeed');

    await wait(TEST_CONFIG.ASYNC_DELAY);

    // Verify participant is removed
    const participants = await window.firestoreSync.getTripParticipants(TEST_CONFIG.TEST_TRIP_ID);
    const testParticipant = participants.find(p => p.userId === TEST_CONFIG.TEST_FRIEND_USER_ID);
    assert(!testParticipant, 'Participant should be removed');

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

async function testGetSharedTrips() {
  const testName = 'Get Shared Trips';
  try {
    const trips = await window.firestoreSync.getSharedTrips();

    assert(Array.isArray(trips), 'Should return an array');
    // Note: May be empty if no shared trips

    logTest(testName, true);
  } catch (error) {
    logTest(testName, false, error);
  }
}

// ============================================
// TEST RUNNER
// ============================================

async function runAllSocialTests() {
  console.log('🧪 Starting Phase 2 Backend Tests...\n');
  console.log('⚠️  Note: These tests create real data in Firestore.');
  console.log('⚠️  Make sure TEST_FRIEND_USER_ID is set correctly.\n');

  // Reset results
  testResults.passed = 0;
  testResults.failed = 0;
  testResults.errors = [];

  // Check if user is logged in
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('❌ ERROR: You must be logged in to run tests');
    return;
  }

  console.log(`✅ Logged in as: ${user.email}\n`);

  // Validate configuration
  if (TEST_CONFIG.TEST_FRIEND_USER_ID === 'REPLACE_WITH_TEST_USER_ID') {
    console.error('❌ ERROR: Please set TEST_FRIEND_USER_ID in TEST_CONFIG');
    return;
  }

  console.log('📋 Running Test Suite 1: Friends System\n');
  await testSendFriendRequest();
  await testGetSentFriendRequests();
  await testCancelFriendRequest();
  await testGetFriends();

  console.log('\n📋 Running Test Suite 2: Notifications System\n');
  await testCreateNotification();
  await testGetNotifications();
  await testMarkNotificationAsRead();
  await testMarkAllNotificationsAsRead();
  await testGetUnreadNotificationCount();
  await testDeleteNotification();

  console.log('\n📋 Running Test Suite 3: Trip Sharing System\n');
  await testShareTrip();
  await testAddTripParticipant();
  await testGetTripParticipants();
  await testRemoveTripParticipant();
  await testGetSharedTrips();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.test}: ${err.error}`);
    });
  }

  console.log('\n✅ Testing complete!');

  return testResults;
}

// Export for use in browser console
window.runAllSocialTests = runAllSocialTests;
window.TEST_CONFIG = TEST_CONFIG;

console.log('✅ Social backend tests loaded!');
console.log('📝 To run tests:');
console.log('   1. Set TEST_CONFIG.TEST_FRIEND_USER_ID to a real test user ID');
console.log('   2. Run: await runAllSocialTests()');


