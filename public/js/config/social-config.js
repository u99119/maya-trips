/**
 * Social System Configuration
 * 
 * This file contains all configuration constants for the social features:
 * - Friends system
 * - Notifications
 * - Trip sharing
 * - Collaboration
 * 
 * All limits are configurable here for easy updates in the future.
 */

export const SOCIAL_CONFIG = {
  // ========================================
  // FRIENDS SYSTEM
  // ========================================
  
  /**
   * Maximum number of friends per user
   * Prevents abuse and keeps the system manageable
   */
  MAX_FRIENDS: 100,
  
  /**
   * Maximum pending friend requests (sent + received)
   * Prevents spam and abuse
   */
  MAX_PENDING_REQUESTS: 20,
  
  /**
   * Friend request expiry in days
   * Requests older than this are automatically deleted
   */
  REQUEST_EXPIRY_DAYS: 10,
  
  // ========================================
  // NOTIFICATIONS SYSTEM
  // ========================================
  
  /**
   * Maximum notifications to keep per user
   * Older notifications are automatically deleted
   */
  MAX_NOTIFICATIONS_PER_USER: 50,
  
  /**
   * Notification retention period in days
   * Notifications older than this are automatically deleted
   */
  NOTIFICATION_RETENTION_DAYS: 30,
  
  /**
   * How often to run notification cleanup (in hours)
   * Cleanup runs automatically in the background
   */
  NOTIFICATION_CLEANUP_INTERVAL_HOURS: 1,
  
  /**
   * Auto-dismiss toast notifications after X seconds
   */
  TOAST_AUTO_DISMISS_SECONDS: 5,
  
  // ========================================
  // TRIP SHARING
  // ========================================
  
  /**
   * Maximum participants per trip (including owner)
   * Prevents performance issues with too many collaborators
   */
  MAX_TRIP_PARTICIPANTS: 20,
  
  /**
   * Maximum pending invites per trip
   * Prevents spam
   */
  MAX_TRIP_INVITES: 10,
  
  /**
   * Trip invite expiry in days
   * Invites older than this are automatically expired
   */
  INVITE_EXPIRY_DAYS: 7,
  
  // ========================================
  // FUTURE: PHOTOS & NOTES (Phase 3)
  // ========================================
  
  /**
   * Maximum photos per trip
   * Can be increased in the future
   */
  MAX_PHOTOS_PER_TRIP: 500,
  
  /**
   * Maximum notes per trip
   * Can be increased in the future
   */
  MAX_NOTES_PER_TRIP: 200,
  
  /**
   * Maximum photo file size in MB
   * Photos larger than this will be compressed
   */
  MAX_PHOTO_SIZE_MB: 5,
  
  /**
   * Photo thumbnail width in pixels
   */
  PHOTO_THUMBNAIL_WIDTH: 300,
  
  /**
   * Photo max width in pixels (for compression)
   */
  PHOTO_MAX_WIDTH: 1920,
};

/**
 * Notification Types
 * All possible notification types in the system
 */
export const NOTIFICATION_TYPES = {
  // Friend-related
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  FRIEND_DECLINED: 'friend_declined',
  
  // Trip-related
  TRIP_INVITE: 'trip_invite',
  TRIP_INVITE_ACCEPTED: 'trip_invite_accepted',
  TRIP_INVITE_DECLINED: 'trip_invite_declined',
  TRIP_SHARED: 'trip_shared',
  TRIP_SHARE_DECLINED: 'trip_share_declined',  // Participant declined invitation
  PARTICIPANT_LEFT: 'participant_left',        // Participant left shared trip
  
  // Collaboration (Phase 3)
  PHOTO_ADDED: 'photo_added',
  NOTE_ADDED: 'note_added',
  TRIP_UPDATED: 'trip_updated',
  MILESTONE_COMPLETED: 'milestone_completed',
  
  // System
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
};

/**
 * Notification Priority Levels
 */
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

/**
 * Friend Request Status
 */
export const FRIEND_REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

/**
 * Trip Participant Roles
 *
 * OWNER: Created the trip, full control, can share/manage
 * ACTIVE: Participant who shares their location (sees other dots)
 * SILENT: Participant who doesn't share location (doesn't see other dots), can mark milestones
 * VIEWER: Not traveling, watches from home (sees others' dots, cannot mark milestones)
 */
export const TRIP_ROLES = {
  OWNER: 'owner',
  ACTIVE: 'active',      // Shares location, sees others, can mark milestones
  SILENT: 'silent',      // No location sharing, doesn't see others, can mark milestones
  VIEWER: 'viewer',      // Not traveling, sees others (if they share), cannot mark milestones
  // Legacy - keep for backward compatibility
  PARTICIPANT: 'active', // Maps to ACTIVE
};

/**
 * Trip Visibility Settings
 */
export const TRIP_VISIBILITY = {
  PRIVATE: 'private',
  FRIENDS: 'friends',
  PUBLIC: 'public',
};

/**
 * Location Update Configuration
 */
export const LOCATION_CONFIG = {
  UPDATE_INTERVAL_MOVING: 5 * 60 * 1000,  // 5 minutes when moving
  UPDATE_INTERVAL_IDLE: 10 * 60 * 1000,   // 10 minutes when idle
  PROXIMITY_THRESHOLD: 500,               // 500 meters for milestone alerts
  MOVEMENT_THRESHOLD: 5,                  // 5 km/h to consider "moving"
  MAX_PARTICIPANTS_DISPLAYED: 8,          // Max dots on map
};

