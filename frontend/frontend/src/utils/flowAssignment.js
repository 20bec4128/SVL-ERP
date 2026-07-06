import { getAssignableAllocators } from "../api/leadsApi";
import { getAssignableUsersForGroup } from "../api/userGroupApi";

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export function getFlowGroupId(flowRules, status) {
  if (!Array.isArray(flowRules)) return null;
  const targetRule = flowRules.find(
    (rule) => normalizeStatus(rule?.status) === normalizeStatus(status),
  );
  return targetRule?.handledByGroupId ?? null;
}

export async function pickFlowAssignee({
  leadId,
  flowRules,
  status,
  currentAssigneeId = null,
}) {
  const groupId = getFlowGroupId(flowRules, status);
  if (!leadId || groupId == null) {
    return { groupId, assigneeId: null, allocators: [] };
  }

  const allocators = await getAssignableAllocators(leadId, { groupId });
  if (!Array.isArray(allocators) || allocators.length === 0) {
    return { groupId, assigneeId: null, allocators: [] };
  }

  const currentIndex =
    currentAssigneeId == null
      ? -1
      : allocators.findIndex((allocator) => String(allocator?.id) === String(currentAssigneeId));
  const nextAllocator = allocators[(currentIndex + 1) % allocators.length];

  return {
    groupId,
    assigneeId: nextAllocator?.id ?? null,
    allocators,
  };
}

export async function pickGroupAssignee({
  groupId,
  currentAssigneeId = null,
}) {
  if (groupId == null) {
    return { groupId, assigneeId: null, members: [] };
  }

  const members = await getAssignableUsersForGroup({ groupId });
  if (!Array.isArray(members) || members.length === 0) {
    return { groupId, assigneeId: null, members: [] };
  }

  const currentIndex =
    currentAssigneeId == null
      ? -1
      : members.findIndex((member) => String(member?.id) === String(currentAssigneeId));
  const nextMember = members[(currentIndex + 1) % members.length];

  return {
    groupId,
    assigneeId: nextMember?.id ?? null,
    members,
  };
}
