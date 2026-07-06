/**
 * Status Validation Utility
 * Validates status transitions based on flow rules and lead data
 */

/**
 * Validates if a status transition is allowed based on flow rules
 * @param {string} targetStatus - The status to transition to
 * @param {Array} flowRules - Flow rules from backend
 * @param {Object} leadData - Current lead/deal data
 * @param {Object} amounts - {total, paid, remaining}
 * @returns {Object} {isValid: boolean, message: string}
 */
export function validateStatusTransition(targetStatus, flowRules, leadData, amounts = {}) {
  if (!targetStatus) {
    return { isValid: false, message: "Please select a status" };
  }

  const normalizedStatus = String(targetStatus || "").trim().toLowerCase();

  // Find the rule for the target status
  const targetRule = Array.isArray(flowRules)
    ? flowRules.find(
        (r) =>
          String(r?.status || "").trim().toLowerCase() === normalizedStatus
      )
    : null;

  // Check validation requirements from flow rules
  if (targetRule) {
    // Validate payment requirement
    if (targetRule.requirePayment100Percent === true) {
      const total = Number(amounts.total) || Number(leadData?.totalAmount) || 0;
      const paid = Number(amounts.paid) || Number(leadData?.paidAmount) || 0;

      if (total === 0) {
        return {
          isValid: false,
          message: `Please set the total amount before changing status to ${targetStatus}`,
        };
      }

      if (paid < total) {
        return {
          isValid: false,
          message: `Payment pending. Please complete 100% payment before changing status to ${targetStatus}. (Paid: $${paid}, Total: $${total})`,
        };
      }
    }

    // Validate design upload requirement
    if (targetRule.requireDesignUpload === true) {
      const hasDesign =
        leadData?.designStartAt ||
        leadData?.designEndAt ||
        leadData?.designFinalFileName ||
        leadData?.designFinalFilePath;

      if (!hasDesign) {
        return {
          isValid: false,
          message: `Please complete design before changing status to ${targetStatus}`,
        };
      }
    }

    // Validate required fields
    if (Array.isArray(targetRule.requireFields)) {
      for (const field of targetRule.requireFields) {
        if (!leadData?.[field]) {
          return {
            isValid: false,
            message: `Please fill in ${field} before changing status to ${targetStatus}`,
          };
        }
      }
    }

    // Check custom validation message
    if (
      targetRule.validationMessage &&
      targetRule.validationCheck === false
    ) {
      return {
        isValid: false,
        message: targetRule.validationMessage,
      };
    }
  }

  // If no specific rule validation fails, allow the transition
  return { isValid: true, message: "" };
}

/**
 * Get validation message for a status transition
 * Useful for displaying requirements before user selects a status
 */
export function getStatusValidationRequirements(targetStatus, flowRules) {
  const normalizedStatus = String(targetStatus || "").trim().toLowerCase();

  const targetRule = Array.isArray(flowRules)
    ? flowRules.find(
        (r) =>
          String(r?.status || "").trim().toLowerCase() === normalizedStatus
      )
    : null;

  if (!targetRule) return [];

  const requirements = [];

  if (targetRule.requirePayment100Percent === true) {
    requirements.push("Payment must be 100% complete");
  }

  if (targetRule.requireDesignUpload === true) {
    requirements.push("Design must be completed");
  }

  if (Array.isArray(targetRule.requireFields) && targetRule.requireFields.length > 0) {
    requirements.push(`Required fields: ${targetRule.requireFields.join(", ")}`);
  }

  return requirements;
}
