/**
 * Round-robin helper utilities for lead assignment
 */

/**
 * Get the next allocator in round-robin sequence
 * @param {Array} allocators - List of allocators with id and name
 * @param {Number|String} currentOwnerId - Current owner ID
 * @returns {Object} Next allocator in sequence
 */
export function getNextAllocatorInRotation(allocators = [], currentOwnerId = null) {
  if (!Array.isArray(allocators) || allocators.length === 0) {
    return null;
  }

  let currentIndex = -1;

  if (currentOwnerId) {
    currentIndex = allocators.findIndex(
      (a) => String(a.id) === String(currentOwnerId)
    );
  }

  const nextIndex = (currentIndex + 1) % allocators.length;
  return allocators[nextIndex] || null;
}

/**
 * Format round-robin assignment info for display
 * @param {Object} currentOwner - Current owner data
 * @param {Object} nextOwner - Next owner data
 * @returns {String} Formatted assignment info
 */
export function formatAssignmentInfo(currentOwner, nextOwner) {
  const current = currentOwner?.name || "Unassigned";
  const next = nextOwner?.name || "Unknown";
  return `${current} → ${next}`;
}

/**
 * Calculate optimal assignment based on workload and rotation
 * @param {Array} allocators - Allocators with workload data
 * @param {Number|String} currentOwnerId - Current owner ID
 * @param {Boolean} useWorkloadBalancing - Use workload or strict rotation
 * @returns {Object} Recommended allocator
 */
export function getOptimalAssignee(allocators = [], currentOwnerId = null, useWorkloadBalancing = false) {
  if (!Array.isArray(allocators) || allocators.length === 0) {
    return null;
  }

  if (useWorkloadBalancing) {
    // Sort by least workload, then apply rotation
    const sorted = [...allocators].sort((a, b) => {
      const workloadA = parseInt(a.workloadCount || 0);
      const workloadB = parseInt(b.workloadCount || 0);
      return workloadA - workloadB;
    });
    return sorted[0] || null;
  }

  // Strict rotation
  return getNextAllocatorInRotation(allocators, currentOwnerId);
}

/**
 * Track assignment history
 * @param {String} leadId - Lead ID
 * @param {String} newOwnerId - New owner ID
 * @param {String} newOwnerName - New owner name
 * @returns {Object} Assignment record
 */
export function createAssignmentRecord(leadId, newOwnerId, newOwnerName) {
  return {
    leadId,
    newOwnerId,
    newOwnerName,
    timestamp: new Date().toISOString(),
    method: "round-robin"
  };
}
