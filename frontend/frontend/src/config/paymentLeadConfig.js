/**
 * Payment Lead Follow-up Configuration
 * Centralized settings for payment lead management
 */

export const PAYMENT_LEAD_CONFIG = {
  // Lead Status
  PAYMENT_STATUS: "Payment",
  CUSTOMER_PAYMENT_STATUS: "Payment",

  // Polling intervals (in milliseconds)
  PAYMENT_LEADS_POLL_INTERVAL: 10000, // Check for new payment leads every 10 seconds
  CHAT_MESSAGES_POLL_INTERVAL: 8000, // Check for new chat messages every 8 seconds

  // Notification settings
  SHOW_NOTIFICATION_ALERT: true,
  NOTIFICATION_AUTO_HIDE_DURATION: 5000, // Auto-hide successful notifications after 5 seconds
  ERROR_NOTIFICATION_DURATION: 4000,

  // Round-robin settings
  ROUND_ROBIN: {
    ENABLED: true,
    METHOD: "strict", // "strict" or "workload-balanced"
    AUTO_ASSIGN_ON_PAYMENT_STATUS: true, // Automatically assign when status changes
    TRACK_ASSIGNMENT_HISTORY: true,
  },

  // Customer status update
  UPDATE_CUSTOMER_STATUS_ON_PAYMENT: true,
  CUSTOMER_STATUS_VALUE: "Payment",

  // Pagination
  LEADS_PER_PAGE: 20,
  CHAT_PAGE_SIZE: 50,

  // UI Messages
  MESSAGES: {
    ROUND_ROBIN_SUCCESS: (ownerName) => `✓ Lead assigned to ${ownerName || "team member"} for payment follow-up`,
    NEW_LEAD_ALERT: (count) => `🔔 ${count} new payment lead(s) arrived!`,
    ASSIGNMENT_FAILED: "Failed to assign lead in payment group",
    ASSIGNMENT_ERROR: "Failed to process payment assignment",
    CHAT_SEND_ERROR: "Failed to send message",
    NO_PAYMENT_LEADS: "No payment leads found",
  },

  // Group configuration
  PAYMENT_GROUP_MAPPING: {
    // Map lead groups to payment handling groups
    // This should ideally come from backend configuration
    // Example: "sales-group-1": "payment-group-1"
  }
};

/**
 * Get payment group configuration
 * @param {String} leadGroupId - Lead's assigned group
 * @returns {String} Payment group ID (same as lead group by default)
 */
export function getPaymentGroup(leadGroupId) {
  const mapping = PAYMENT_LEAD_CONFIG.PAYMENT_GROUP_MAPPING;
  return mapping[leadGroupId] || leadGroupId;
}

/**
 * Check if round-robin is enabled
 * @returns {Boolean}
 */
export function isRoundRobinEnabled() {
  return PAYMENT_LEAD_CONFIG.ROUND_ROBIN.ENABLED;
}

/**
 * Get round-robin method
 * @returns {String} "strict" or "workload-balanced"
 */
export function getRoundRobinMethod() {
  return PAYMENT_LEAD_CONFIG.ROUND_ROBIN.METHOD;
}
