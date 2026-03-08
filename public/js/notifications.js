/**
 * Notification System (Phase 1.6.8)
 * Toast notifications for segment completion, junction arrival, and warnings
 */

class NotificationSystem {
  constructor() {
    this.container = document.getElementById('notificationContainer');
    this.notifications = new Map();
    this.nextId = 1;
  }

  /**
   * Show a notification
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type (success, warning, info)
   * @param {string} options.icon - Emoji icon
   * @param {number} options.duration - Duration in ms (default: 5000, 0 = no auto-dismiss)
   */
  show({ title, message, type = 'info', icon = 'ℹ️', duration = 5000 }) {
    const id = this.nextId++;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.dataset.id = id;
    
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        ${message ? `<div class="notification-message">${message}</div>` : ''}
      </div>
      <button class="notification-close" aria-label="Close">×</button>
    `;
    
    // Add close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.dismiss(id));
    
    // Add to container
    this.container.appendChild(notification);
    this.notifications.set(id, notification);
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    
    console.log(`📢 Notification: ${title}${message ? ' - ' + message : ''}`);
    
    return id;
  }

  /**
   * Dismiss a notification
   */
  dismiss(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    // Fade out animation
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      notification.remove();
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    this.notifications.forEach((_, id) => this.dismiss(id));
  }

  /**
   * Show segment completed notification
   */
  segmentCompleted(segmentName, distance, time) {
    return this.show({
      title: '🎉 Segment Completed!',
      message: `${segmentName} • ${distance} • ${time}`,
      type: 'success',
      icon: '✅',
      duration: 6000
    });
  }

  /**
   * Show junction reached notification
   */
  junctionReached(junctionName, availableRoutes) {
    const routeText = availableRoutes > 1 
      ? `${availableRoutes} routes available` 
      : 'Continue ahead';
    
    return this.show({
      title: `📍 Reached ${junctionName}`,
      message: routeText,
      type: 'info',
      icon: '🔀',
      duration: 5000
    });
  }

  /**
   * Show approaching junction warning
   */
  approachingJunction(junctionName, distance) {
    return this.show({
      title: `⚠️ Approaching ${junctionName}`,
      message: `${distance} ahead`,
      type: 'warning',
      icon: '📍',
      duration: 4000
    });
  }

  /**
   * Show segment started notification
   */
  segmentStarted(segmentName, distance, time) {
    return this.show({
      title: '🚀 Segment Started',
      message: `${segmentName} • ${distance} • ${time}`,
      type: 'info',
      icon: '🏁',
      duration: 4000
    });
  }

  /**
   * Show custom notification
   */
  custom(title, message, options = {}) {
    return this.show({
      title,
      message,
      ...options
    });
  }
}

// Export singleton instance
const notifications = new NotificationSystem();
export default notifications;

