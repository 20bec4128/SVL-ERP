package com.nexorcrm.backend.dto;

import java.util.List;

public class DashboardBirthdayGroupResponse {
    private String label;
    private List<DashboardBirthdayItemResponse> items;

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public List<DashboardBirthdayItemResponse> getItems() {
        return items;
    }

    public void setItems(List<DashboardBirthdayItemResponse> items) {
        this.items = items;
    }
}
