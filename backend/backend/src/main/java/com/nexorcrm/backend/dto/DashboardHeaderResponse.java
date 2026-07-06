package com.nexorcrm.backend.dto;

import java.util.List;

public class DashboardHeaderResponse {
    private String title;
    private List<DashboardBreadcrumbResponse> breadcrumbs;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<DashboardBreadcrumbResponse> getBreadcrumbs() {
        return breadcrumbs;
    }

    public void setBreadcrumbs(List<DashboardBreadcrumbResponse> breadcrumbs) {
        this.breadcrumbs = breadcrumbs;
    }
}
