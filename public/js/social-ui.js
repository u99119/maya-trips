/**
 * Social UI Module (Phase 2.4 & 2.5)
 * Handles Friends, Notifications, and Trip Sharing UI
 */

import firestoreSync from './firestore-sync.js';
import { getCurrentUser } from './auth.js';
import { SOCIAL_CONFIG, NOTIFICATION_TYPES } from './config/social-config.js';

class SocialUI {
  constructor() {
    this.currentTripId = null;
    this.notificationCheckInterval = null;
    // Real-time listener unsubscribe functions
    this.unsubscribeFriendRequests = null;
    this.unsubscribeSentRequests = null;
    this.unsubscribeFriends = null;
    this.unsubscribeNotifications = null;
    this.unsubscribeAcceptedRequests = null;
    this.unsubscribeFriendRemoved = null;
  }

  /**
   * Initialize social UI
   */
  init() {
    this.setupEventListeners();
    this.startNotificationPolling();
  }

  /**
   * Set current trip ID (for sharing)
   */
  setCurrentTrip(tripId) {
    this.currentTripId = tripId;
    const btnShareTrip = document.getElementById('btnShareTrip');
    if (btnShareTrip) {
      btnShareTrip.style.display = tripId ? 'flex' : 'none';
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Notifications button
    const btnNotifications = document.getElementById('btnNotifications');
    if (btnNotifications) {
      btnNotifications.addEventListener('click', () => this.openNotificationsPanel());
    }

    // Friends button
    const btnFriends = document.getElementById('btnFriends');
    if (btnFriends) {
      btnFriends.addEventListener('click', () => this.openFriendsPanel());
    }

    // Share Trip button
    const btnShareTrip = document.getElementById('btnShareTrip');
    if (btnShareTrip) {
      btnShareTrip.addEventListener('click', () => this.openShareTripModal());
    }

    // Notifications panel
    this.setupNotificationsPanel();

    // Friends panel
    this.setupFriendsPanel();

    // Add Friend modal
    this.setupAddFriendModal();

    // Share Trip modal
    this.setupShareTripModal();
  }

  /**
   * Setup notifications panel
   */
  setupNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    const overlay = document.getElementById('notificationsPanelOverlay');
    const closeBtn = document.getElementById('notificationsPanelClose');
    const markAllReadBtn = document.getElementById('btnMarkAllRead');

    if (overlay) {
      overlay.addEventListener('click', () => this.closeNotificationsPanel());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeNotificationsPanel());
    }

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => this.markAllNotificationsAsRead());
    }
  }

  /**
   * Setup friends panel
   */
  setupFriendsPanel() {
    const panel = document.getElementById('friendsPanel');
    const overlay = document.getElementById('friendsPanelOverlay');
    const closeBtn = document.getElementById('friendsPanelClose');

    if (overlay) {
      overlay.addEventListener('click', () => this.closeFriendsPanel());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeFriendsPanel());
    }

    // Tab switching
    const tabs = document.querySelectorAll('.friends-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchFriendsTab(tabName);
      });
    });

    // Add Friend button
    const btnAddFriend = document.getElementById('btnAddFriend');
    if (btnAddFriend) {
      btnAddFriend.addEventListener('click', () => this.openAddFriendModal());
    }
  }

  /**
   * Setup Add Friend modal
   */
  setupAddFriendModal() {
    const modal = document.getElementById('addFriendModal');
    const overlay = document.getElementById('addFriendOverlay');
    const closeBtn = document.getElementById('addFriendClose');
    const cancelBtn = document.getElementById('btnCancelAddFriend');
    const sendBtn = document.getElementById('btnSendFriendRequest');
    const messageInput = document.getElementById('friendMessage');
    const messageCounter = document.getElementById('messageCounter');

    if (overlay) {
      overlay.addEventListener('click', () => this.closeAddFriendModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeAddFriendModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeAddFriendModal());
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendFriendRequest());
    }

    if (messageInput && messageCounter) {
      messageInput.addEventListener('input', () => {
        messageCounter.textContent = `${messageInput.value.length}/200`;
      });
    }
  }

  /**
   * Setup Share Trip modal
   */
  setupShareTripModal() {
    const modal = document.getElementById('shareTripModal');
    const overlay = document.getElementById('shareTripOverlay');
    const closeBtn = document.getElementById('shareTripClose');
    const cancelBtn = document.getElementById('btnCancelShareTrip');

    if (overlay) {
      overlay.addEventListener('click', () => this.closeShareTripModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeShareTripModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeShareTripModal());
    }
  }

  // ========================================
  // NOTIFICATIONS PANEL
  // ========================================

  /**
   * Open notifications panel
   */
  async openNotificationsPanel() {
    const user = getCurrentUser();
    if (!user) {
      alert('Please sign in to view notifications');
      return;
    }

    const panel = document.getElementById('notificationsPanel');
    if (panel) {
      panel.classList.add('active');
      await this.loadNotifications();
    }
  }

  /**
   * Close notifications panel
   */
  closeNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
      panel.classList.remove('active');
    }
  }

  /**
   * Load notifications
   */
  async loadNotifications() {
    const body = document.getElementById('notificationsPanelBody');
    const emptyState = document.getElementById('notificationsEmpty');

    if (!body) return;

    try {
      // First, clean up any orphaned friend request notifications
      await firestoreSync.cleanupOrphanedFriendRequestNotifications();

      // Then load the notifications
      const notifications = await firestoreSync.getNotifications();

      if (notifications.length === 0) {
        body.innerHTML = '';
        if (emptyState) {
          body.appendChild(emptyState);
          emptyState.style.display = 'flex';
        }
        return;
      }

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      body.innerHTML = notifications.map(notif => this.renderNotification(notif)).join('');

      // Add click handlers
      notifications.forEach(notif => {
        const elem = document.getElementById(`notif-${notif.id}`);
        if (elem) {
          elem.addEventListener('click', () => this.handleNotificationClick(notif));
        }
      });

      // Update badge
      this.updateNotificationBadge();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  /**
   * Render notification HTML
   */
  renderNotification(notif) {
    const unreadClass = notif.read ? '' : 'unread';
    const timeAgo = this.getTimeAgo(notif.createdAt);

    return `
      <div class="notification-item ${unreadClass}" id="notif-${notif.id}">
        <div class="notification-icon">${notif.icon || '🔔'}</div>
        <div class="notification-content">
          <h4 class="notification-title">${notif.title}</h4>
          <p class="notification-message">${notif.message}</p>
          <span class="notification-time">${timeAgo}</span>
          ${this.renderNotificationActions(notif)}
        </div>
        <button class="notification-delete" onclick="event.stopPropagation(); socialUI.deleteNotification('${notif.id}')" title="Delete notification">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Render notification actions
   */
  renderNotificationActions(notif) {
    if (notif.type === NOTIFICATION_TYPES.FRIEND_REQUEST) {
      return `
        <div class="notification-actions">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); socialUI.acceptFriendRequest('${notif.relatedRequestId}', '${notif.id}')">Accept</button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); socialUI.declineFriendRequest('${notif.relatedRequestId}', '${notif.id}')">Decline</button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); socialUI.dismissNotification('${notif.id}')">Dismiss</button>
        </div>
      `;
    }
    return '';
  }

  /**
   * Handle notification click
   */
  async handleNotificationClick(notif) {
    // Mark as read
    if (!notif.read) {
      await firestoreSync.markNotificationAsRead(notif.id);
      await this.loadNotifications();
    }

    // Handle action
    if (notif.actionUrl) {
      // Navigate to action URL (implement based on your routing)
      console.log('Navigate to:', notif.actionUrl);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    try {
      await firestoreSync.markAllNotificationsAsRead();
      await this.loadNotifications();
      this.showToast('✅', 'All notifications marked as read', '');
    } catch (error) {
      console.error('Error marking all as read:', error);
      this.showToast('❌', 'Error', 'Failed to mark notifications as read');
    }
  }

  /**
   * Dismiss a notification (delete it)
   */
  async dismissNotification(notificationId) {
    try {
      await firestoreSync.deleteNotification(notificationId);
      await this.loadNotifications();
      await this.updateNotificationBadge();
      this.showToast('✅', 'Notification dismissed', '');
    } catch (error) {
      console.error('Error dismissing notification:', error);
      this.showToast('❌', 'Error', 'Failed to dismiss notification');
    }
  }

  /**
   * Delete a notification (alias for dismissNotification)
   */
  async deleteNotification(notificationId) {
    await this.dismissNotification(notificationId);
  }

  /**
   * Update notification badge
   */
  async updateNotificationBadge() {
    try {
      const count = await firestoreSync.getUnreadNotificationsCount();
      const badge = document.getElementById('notificationBadge');

      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : count;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error updating notification badge:', error);
    }
  }

  /**
   * Start notification polling
   */
  startNotificationPolling() {
    // Update badge every 30 seconds
    this.notificationCheckInterval = setInterval(() => {
      const user = getCurrentUser();
      if (user) {
        this.updateNotificationBadge();
      }
    }, 30000);

    // Initial update
    const user = getCurrentUser();
    if (user) {
      this.updateNotificationBadge();
    }
  }

  // ========================================
  // FRIENDS PANEL
  // ========================================

  /**
   * Open friends panel
   */
  async openFriendsPanel() {
    const user = getCurrentUser();
    if (!user) {
      alert('Please sign in to view friends');
      return;
    }

    const panel = document.getElementById('friendsPanel');
    if (panel) {
      panel.classList.add('active');

      // Start real-time listeners for all tabs
      this.startFriendsListener();
      this.startFriendRequestsListener();
      this.startSentRequestsListener();
      this.startAcceptedRequestsListener();
      this.startFriendRemovedListener();

      console.log('🔔 Real-time listeners started for Friends panel');
    }
  }

  /**
   * Update all tab badge counts
   */
  async updateTabCounts() {
    try {
      // Update requests count
      const requests = await firestoreSync.getPendingFriendRequests();
      const requestsCount = document.getElementById('requestsCount');
      if (requestsCount) {
        requestsCount.textContent = requests.length;
      }

      // Update sent count
      const sentRequests = await firestoreSync.getSentFriendRequests();
      const sentCount = document.getElementById('sentCount');
      if (sentCount) {
        sentCount.textContent = sentRequests.length;
      }
    } catch (error) {
      console.error('Error updating tab counts:', error);
    }
  }

  /**
   * Start real-time listeners for friend requests
   */
  startFriendRequestsListener() {
    const user = getCurrentUser();
    if (!user) return;

    // Stop existing listener if any
    if (this.unsubscribeFriendRequests) {
      this.unsubscribeFriendRequests();
    }

    // Start listening to received friend requests
    this.unsubscribeFriendRequests = firestoreSync.listenToPendingFriendRequests((requests) => {
      console.log('🔔 Real-time update: Received friend requests changed', requests.length);

      // Update the UI
      const list = document.getElementById('requestsList');
      const emptyState = document.getElementById('requestsEmpty');
      const countBadge = document.getElementById('requestsCount');

      if (countBadge) {
        countBadge.textContent = requests.length;
      }

      if (!list) return;

      if (requests.length === 0) {
        list.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
      } else {
        if (emptyState) {
          emptyState.style.display = 'none';
        }
        list.innerHTML = requests.map(request => this.renderFriendRequest(request)).join('');
      }
    });
  }

  /**
   * Start real-time listeners for sent friend requests
   */
  startSentRequestsListener() {
    const user = getCurrentUser();
    if (!user) return;

    // Stop existing listener if any
    if (this.unsubscribeSentRequests) {
      this.unsubscribeSentRequests();
    }

    // Start listening to sent friend requests
    this.unsubscribeSentRequests = firestoreSync.listenToSentFriendRequests((requests) => {
      console.log('🔔 Real-time update: Sent friend requests changed', requests.length);

      // Update the UI
      const list = document.getElementById('sentList');
      const emptyState = document.getElementById('sentEmpty');
      const countBadge = document.getElementById('sentCount');

      if (countBadge) {
        countBadge.textContent = requests.length;
      }

      if (!list) return;

      if (requests.length === 0) {
        list.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
      } else {
        if (emptyState) {
          emptyState.style.display = 'none';
        }
        list.innerHTML = requests.map(request => this.renderSentRequest(request)).join('');
      }
    });
  }

  /**
   * Start real-time listeners for friends list
   */
  startFriendsListener() {
    const user = getCurrentUser();
    if (!user) return;

    // Stop existing listener if any
    if (this.unsubscribeFriends) {
      this.unsubscribeFriends();
    }

    // Start listening to friends list
    this.unsubscribeFriends = firestoreSync.listenToFriends((friends) => {
      console.log('🔔 Real-time update: Friends list changed', friends.length);

      // Update the UI
      const list = document.getElementById('friendsList');
      const emptyState = document.getElementById('friendsEmpty');

      if (!list) return;

      if (friends.length === 0) {
        list.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
      } else {
        if (emptyState) {
          emptyState.style.display = 'none';
        }
        list.innerHTML = friends.map(friend => this.renderFriend(friend)).join('');

        // Attach event listeners to remove buttons
        friends.forEach(friend => {
          const removeBtn = document.getElementById(`remove-${friend.id}`);
          if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.removeFriend(friend.friendId, friend.friendName);
            });
          }
        });
      }
    });
  }

  /**
   * Start real-time listener for accepted friend requests
   * This auto-creates friend documents when requests are accepted
   */
  startAcceptedRequestsListener() {
    const user = getCurrentUser();
    if (!user) return;

    // Stop existing listener if any
    if (this.unsubscribeAcceptedRequests) {
      this.unsubscribeAcceptedRequests();
    }

    // Start listening to accepted friend requests
    this.unsubscribeAcceptedRequests = firestoreSync.listenToAcceptedFriendRequests();
  }

  /**
   * Start real-time listener for friend_removed notifications
   * This auto-deletes friend documents when removed by the other user
   */
  startFriendRemovedListener() {
    const user = getCurrentUser();
    if (!user) return;

    // Stop existing listener if any
    if (this.unsubscribeFriendRemoved) {
      this.unsubscribeFriendRemoved();
    }

    // Start listening to friend_removed notifications
    this.unsubscribeFriendRemoved = firestoreSync.listenToFriendRemovedNotifications();
  }

  /**
   * Stop all real-time listeners
   */
  stopAllListeners() {
    if (this.unsubscribeFriendRequests) {
      this.unsubscribeFriendRequests();
      this.unsubscribeFriendRequests = null;
    }
    if (this.unsubscribeSentRequests) {
      this.unsubscribeSentRequests();
      this.unsubscribeSentRequests = null;
    }
    if (this.unsubscribeFriends) {
      this.unsubscribeFriends();
      this.unsubscribeFriends = null;
    }
    if (this.unsubscribeNotifications) {
      this.unsubscribeNotifications();
      this.unsubscribeNotifications = null;
    }
    if (this.unsubscribeAcceptedRequests) {
      this.unsubscribeAcceptedRequests();
      this.unsubscribeAcceptedRequests = null;
    }
    if (this.unsubscribeFriendRemoved) {
      this.unsubscribeFriendRemoved();
      this.unsubscribeFriendRemoved = null;
    }
    console.log('🔕 All real-time listeners stopped');
  }

  /**
   * Close friends panel
   */
  closeFriendsPanel() {
    const panel = document.getElementById('friendsPanel');
    if (panel) {
      panel.classList.remove('active');

      // Stop real-time listeners to save resources
      this.stopAllListeners();
    }
  }

  /**
   * Switch friends tab
   */
  switchFriendsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.friends-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.friends-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}TabContent`);
    });

    // Load data for the tab
    if (tabName === 'friends') {
      this.loadFriends();
    } else if (tabName === 'requests') {
      this.loadFriendRequests();
    } else if (tabName === 'sent') {
      this.loadSentRequests();
    }
  }

  /**
   * Load friends list
   */
  async loadFriends() {
    const list = document.getElementById('friendsList');
    const emptyState = document.getElementById('friendsEmpty');
    const countBadge = document.getElementById('friendsCount');

    if (!list) return;

    try {
      const friends = await firestoreSync.getFriends();

      if (countBadge) {
        countBadge.textContent = friends.length;
      }

      if (friends.length === 0) {
        list.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
        return;
      }

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      list.innerHTML = friends.map(friend => this.renderFriend(friend)).join('');

      // Add remove handlers
      friends.forEach(friend => {
        const removeBtn = document.getElementById(`remove-${friend.id}`);
        if (removeBtn) {
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFriend(friend.friendId, friend.friendName);
          });
        }
      });
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }

  /**
   * Render friend item
   */
  renderFriend(friend) {
    const initials = this.getInitials(friend.friendName);
    const avatar = friend.friendPhotoURL
      ? `<img src="${friend.friendPhotoURL}" alt="${friend.friendName}">`
      : initials;

    return `
      <div class="friend-item">
        <div class="friend-avatar">${avatar}</div>
        <div class="friend-info">
          <h4 class="friend-name">${friend.friendName}</h4>
          <p class="friend-email">${friend.friendEmail}</p>
          ${friend.sharedTripsCount > 0 ? `<p class="friend-meta">${friend.sharedTripsCount} shared trips</p>` : ''}
        </div>
        <div class="friend-actions">
          <button class="btn-icon-sm danger" id="remove-${friend.id}" title="Remove friend">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Load friend requests (received)
   */
  async loadFriendRequests() {
    const list = document.getElementById('requestsList');
    const emptyState = document.getElementById('requestsEmpty');
    const countBadge = document.getElementById('requestsCount');

    if (!list) return;

    try {
      const requests = await firestoreSync.getPendingFriendRequests();

      if (countBadge) {
        countBadge.textContent = requests.length;
      }

      if (requests.length === 0) {
        list.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
        return;
      }

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      list.innerHTML = requests.map(request => this.renderFriendRequest(request)).join('');
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  }

  /**
   * Render friend request
   */
  renderFriendRequest(request) {
    const initials = this.getInitials(request.fromUserName);
    const avatar = request.fromUserPhotoURL
      ? `<img src="${request.fromUserPhotoURL}" alt="${request.fromUserName}">`
      : initials;

    return `
      <div class="friend-item">
        <div class="friend-avatar">${avatar}</div>
        <div class="friend-info">
          <h4 class="friend-name">${request.fromUserName}</h4>
          <p class="friend-email">${request.fromUserEmail}</p>
          ${request.message ? `<p class="friend-meta">"${request.message}"</p>` : ''}
        </div>
        <div class="friend-actions">
          <button class="btn btn-primary btn-sm" onclick="socialUI.acceptFriendRequest('${request.id}')">Accept</button>
          <button class="btn btn-secondary btn-sm" onclick="socialUI.declineFriendRequest('${request.id}')">Decline</button>
        </div>
      </div>
    `;
  }

  /**
   * Load sent requests
   */
  async loadSentRequests() {
    const list = document.getElementById('sentList');
    const emptyState = document.getElementById('sentEmpty');
    const countBadge = document.getElementById('sentCount');

    if (!list) return;

    try {
      const requests = await firestoreSync.getSentFriendRequests();

      if (countBadge) {
        countBadge.textContent = requests.length;
      }

      if (requests.length === 0) {
        list.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
        return;
      }

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      list.innerHTML = requests.map(request => this.renderSentRequest(request)).join('');
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  }

  /**
   * Render sent request
   */
  renderSentRequest(request) {
    return `
      <div class="friend-item">
        <div class="friend-avatar">${this.getInitials(request.toUserEmail)}</div>
        <div class="friend-info">
          <h4 class="friend-name">${request.toUserEmail}</h4>
          <p class="friend-meta">Pending</p>
        </div>
        <div class="friend-actions">
          <button class="btn btn-secondary btn-sm" onclick="socialUI.cancelFriendRequest('${request.id}')">Cancel</button>
        </div>
      </div>
    `;
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId, notificationId = null) {
    try {
      const result = await firestoreSync.acceptFriendRequest(requestId);

      if (result.success) {
        this.showToast('✅', 'Friend Request Accepted', 'You are now friends!');

        // Dismiss the notification if provided
        if (notificationId) {
          await firestoreSync.deleteNotification(notificationId);
        }

        await this.loadFriendRequests();
        await this.loadFriends();
        await this.loadNotifications();
      } else {
        // Handle "request not found" gracefully
        if (result.error && result.error.includes('not found')) {
          this.showToast('⚠️', 'Request No Longer Available', 'This request may have been cancelled');

          // Dismiss the notification if provided
          if (notificationId) {
            await firestoreSync.deleteNotification(notificationId);
          }

          await this.loadFriendRequests();
          await this.loadNotifications();
        } else {
          this.showToast('❌', 'Error', result.error || 'Failed to accept friend request');
        }
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      this.showToast('❌', 'Error', 'Failed to accept friend request');
    }
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(requestId, notificationId = null) {
    try {
      const result = await firestoreSync.declineFriendRequest(requestId);

      if (result.success) {
        this.showToast('✅', 'Request Declined', '');

        // Dismiss the notification if provided
        if (notificationId) {
          await firestoreSync.deleteNotification(notificationId);
        }

        await this.loadFriendRequests();
        await this.loadNotifications();
      } else {
        // Handle "request not found" gracefully
        if (result.error && result.error.includes('not found')) {
          this.showToast('⚠️', 'Request No Longer Available', 'This request may have been cancelled');

          // Dismiss the notification if provided
          if (notificationId) {
            await firestoreSync.deleteNotification(notificationId);
          }

          await this.loadFriendRequests();
          await this.loadNotifications();
        } else {
          this.showToast('❌', 'Error', result.error || 'Failed to decline request');
        }
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      this.showToast('❌', 'Error', 'Failed to decline request');
    }
  }

  /**
   * Cancel sent friend request
   */
  async cancelFriendRequest(requestId) {
    try {
      const result = await firestoreSync.cancelFriendRequest(requestId);

      if (result.success) {
        this.showToast('✅', 'Request Cancelled', '');
        await this.loadSentRequests();
      } else {
        this.showToast('❌', 'Error', result.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      this.showToast('❌', 'Error', 'Failed to cancel request');
    }
  }

  /**
   * Remove friend
   */
  async removeFriend(friendId, friendName) {
    if (!confirm(`Remove ${friendName} from your friends?`)) {
      return;
    }

    try {
      const result = await firestoreSync.removeFriend(friendId);

      if (result.success) {
        this.showToast('✅', 'Friend Removed', '');
        await this.loadFriends();
      } else {
        this.showToast('❌', 'Error', result.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      this.showToast('❌', 'Error', 'Failed to remove friend');
    }
  }

  // ========================================
  // ADD FRIEND MODAL
  // ========================================

  /**
   * Open Add Friend modal
   */
  openAddFriendModal() {
    const modal = document.getElementById('addFriendModal');
    if (modal) {
      modal.style.display = 'flex';
      document.getElementById('friendEmail').value = '';
      document.getElementById('friendMessage').value = '';
      document.getElementById('messageCounter').textContent = '0/200';
      document.getElementById('addFriendError').style.display = 'none';
      document.getElementById('addFriendSuccess').style.display = 'none';
    }
  }

  /**
   * Close Add Friend modal
   */
  closeAddFriendModal() {
    const modal = document.getElementById('addFriendModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest() {
    const emailInput = document.getElementById('friendEmail');
    const messageInput = document.getElementById('friendMessage');
    const errorDiv = document.getElementById('addFriendError');
    const successDiv = document.getElementById('addFriendSuccess');

    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // Hide previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (!email) {
      errorDiv.textContent = 'Please enter an email address';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      const result = await firestoreSync.sendFriendRequest(email, message);

      if (result.success) {
        successDiv.textContent = 'Friend request sent!';
        successDiv.style.display = 'block';
        emailInput.value = '';
        messageInput.value = '';

        // Close modal after 1.5 seconds
        setTimeout(() => {
          this.closeAddFriendModal();
          this.loadSentRequests();
        }, 1500);
      } else {
        errorDiv.textContent = result.error || 'Failed to send friend request';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      errorDiv.textContent = 'Failed to send friend request';
      errorDiv.style.display = 'block';
    }
  }

  // ========================================
  // SHARE TRIP MODAL
  // ========================================

  /**
   * Open Share Trip modal
   */
  async openShareTripModal() {
    if (!this.currentTripId) {
      this.showToast('⚠️', 'No Trip Selected', 'Please select a trip first');
      return;
    }

    const modal = document.getElementById('shareTripModal');
    if (modal) {
      modal.style.display = 'flex';
      await this.loadShareTripData();
    }
  }

  /**
   * Close Share Trip modal
   */
  closeShareTripModal() {
    const modal = document.getElementById('shareTripModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Load share trip data
   */
  async loadShareTripData() {
    const friendsList = document.getElementById('friendsSelectList');
    const participantsList = document.getElementById('participantsList');
    const participantsSection = document.getElementById('participantsSection');
    const emptyState = document.getElementById('shareFriendsEmpty');

    try {
      // Load friends
      const friends = await firestoreSync.getFriends();

      // Load current participants
      const participants = await firestoreSync.getTripParticipants(this.currentTripId);

      // Show/hide participants section
      if (participants.length > 0 && participantsSection) {
        participantsSection.style.display = 'block';
        participantsList.innerHTML = participants.map(p => this.renderParticipant(p)).join('');
      } else if (participantsSection) {
        participantsSection.style.display = 'none';
      }

      // Filter out friends who are already participants
      const participantIds = participants.map(p => p.userId);
      const availableFriends = friends.filter(f => !participantIds.includes(f.friendId));

      if (availableFriends.length === 0) {
        friendsList.innerHTML = '';
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
        return;
      }

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      friendsList.innerHTML = availableFriends.map(friend => this.renderFriendSelectItem(friend)).join('');

      // Add click handlers
      availableFriends.forEach(friend => {
        const elem = document.getElementById(`share-friend-${friend.id}`);
        if (elem) {
          elem.addEventListener('click', () => this.shareWithFriend(friend));
        }
      });
    } catch (error) {
      console.error('Error loading share trip data:', error);
    }
  }

  /**
   * Render participant
   */
  renderParticipant(participant) {
    const initials = this.getInitials(participant.userName);
    const avatar = participant.userPhotoURL
      ? `<img src="${participant.userPhotoURL}" alt="${participant.userName}">`
      : initials;

    const user = getCurrentUser();
    const isOwner = user && participant.userId === user.uid;

    return `
      <div class="participant-item">
        <div class="participant-avatar">${avatar}</div>
        <div class="participant-info">
          <h4 class="participant-name">${participant.userName}${isOwner ? ' (You)' : ''}</h4>
          <p class="participant-role">${participant.role}</p>
        </div>
        ${!isOwner ? `
          <div class="participant-actions">
            <button class="btn-icon-sm danger" onclick="socialUI.removeParticipant('${participant.userId}')" title="Remove">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render friend select item
   */
  renderFriendSelectItem(friend) {
    const initials = this.getInitials(friend.friendName);
    const avatar = friend.friendPhotoURL
      ? `<img src="${friend.friendPhotoURL}" alt="${friend.friendName}">`
      : initials;

    return `
      <div class="friend-select-item" id="share-friend-${friend.id}">
        <div class="friend-avatar">${avatar}</div>
        <div class="friend-info">
          <h4 class="friend-name">${friend.friendName}</h4>
          <p class="friend-email">${friend.friendEmail}</p>
        </div>
      </div>
    `;
  }

  /**
   * Share trip with friend
   */
  async shareWithFriend(friend) {
    try {
      const result = await firestoreSync.shareTrip(
        this.currentTripId,
        friend.friendId,
        'participant'
      );

      if (result.success) {
        this.showToast('✅', 'Trip Shared', `Shared with ${friend.friendName}`);
        await this.loadShareTripData();
      } else {
        this.showToast('❌', 'Error', result.error || 'Failed to share trip');
      }
    } catch (error) {
      console.error('Error sharing trip:', error);
      this.showToast('❌', 'Error', 'Failed to share trip');
    }
  }

  /**
   * Remove participant from trip
   */
  async removeParticipant(userId) {
    if (!confirm('Remove this participant from the trip?')) {
      return;
    }

    try {
      const result = await firestoreSync.removeParticipant(this.currentTripId, userId);

      if (result.success) {
        this.showToast('✅', 'Participant Removed', '');
        await this.loadShareTripData();
      } else {
        this.showToast('❌', 'Error', result.error || 'Failed to remove participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      this.showToast('❌', 'Error', 'Failed to remove participant');
    }
  }

  // ========================================
  // TOAST NOTIFICATIONS
  // ========================================

  /**
   * Show toast notification
   */
  showToast(icon, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = toastId;
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <h4 class="toast-title">${title}</h4>
        ${message ? `<p class="toast-message">${message}</p>` : ''}
      </div>
      <button class="toast-close" onclick="socialUI.closeToast('${toastId}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      this.closeToast(toastId);
    }, duration);
  }

  /**
   * Close toast notification
   */
  closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.classList.add('removing');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get initials from name
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp) {
    if (!timestamp) return '';

    const now = Date.now();
    const then = timestamp.toMillis ? timestamp.toMillis() : timestamp;
    const diff = now - then;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  }
}

// Export singleton instance
const socialUI = new SocialUI();
export default socialUI;

