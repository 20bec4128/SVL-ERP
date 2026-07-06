package com.nexorcrm.backend.util;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Filters deal-flow statuses based on the deal's requirement type.
 * Statuses listed in the mapping are only visible when the deal's requirement type
 * is one of the mapped values. All other statuses pass through unfiltered.
 */
public final class StatusRequirementTypeFilter {

    private StatusRequirementTypeFilter() {}

    /**
     * Maps requirement-type-sensitive status names (case-insensitive key)
     * to the set of requirement types for which they should be visible.
     * 
     * Design + Production:
     *   - Shows only "Design" status to user (they manually move to Design)
     *   - After design upload, system auto-transitions to "Production"
     *   - "Production" is NOT selectable by user for this type
     */
    private static final Map<String, Set<String>> MAPPING = Map.of(
        "design",                Set.of("Design"),
        "production",            Set.of("Production"),
        "design + production",   Set.of("Design + Production")
    );

    /**
     * Returns a filtered list keeping only statuses that are applicable
     * for the given requirement type. Statuses with no mapping entry are always kept.
     */
    public static List<String> filter(List<String> statuses, String requirementType) {
        if (requirementType == null || requirementType.isBlank() || statuses == null) {
            return statuses == null ? List.of() : statuses;
        }
        String rt = requirementType.trim();
        return statuses.stream().filter(status -> {
            Set<String> allowed = MAPPING.get(status.trim().toLowerCase());
            // No mapping → visible for every requirement type
            if (allowed == null) return true;
            return allowed.contains(rt);
        }).toList();
    }
}
