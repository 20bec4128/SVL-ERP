package com.nexorcrm.backend.dto;

import java.util.List;

public class PriceListSummaryResponse {
    private List<PriceListCountResponse> typeCounts;
    private List<PriceListCountResponse> subtypeCounts;

    public PriceListSummaryResponse() {}

    public PriceListSummaryResponse(List<PriceListCountResponse> typeCounts, List<PriceListCountResponse> subtypeCounts) {
        this.typeCounts = typeCounts;
        this.subtypeCounts = subtypeCounts;
    }

    public List<PriceListCountResponse> getTypeCounts() {
        return typeCounts;
    }

    public void setTypeCounts(List<PriceListCountResponse> typeCounts) {
        this.typeCounts = typeCounts;
    }

    public List<PriceListCountResponse> getSubtypeCounts() {
        return subtypeCounts;
    }

    public void setSubtypeCounts(List<PriceListCountResponse> subtypeCounts) {
        this.subtypeCounts = subtypeCounts;
    }
}
