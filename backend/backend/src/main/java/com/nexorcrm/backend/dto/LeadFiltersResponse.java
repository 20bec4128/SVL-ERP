package com.nexorcrm.backend.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LeadFiltersResponse {
    private List<String> projects = new ArrayList<>();
    private List<String> primarySources = new ArrayList<>();
    private List<String> leadStatuses = new ArrayList<>();
    private Map<String, Long> leadStatusCounts = new LinkedHashMap<>();
    private List<String> svStatuses = new ArrayList<>();
    private List<String> owners = new ArrayList<>();

    public List<String> getProjects() {
        return projects;
    }

    public void setProjects(List<String> projects) {
        this.projects = projects;
    }

    public List<String> getPrimarySources() {
        return primarySources;
    }

    public void setPrimarySources(List<String> primarySources) {
        this.primarySources = primarySources;
    }

    public List<String> getLeadStatuses() {
        return leadStatuses;
    }

    public void setLeadStatuses(List<String> leadStatuses) {
        this.leadStatuses = leadStatuses;
    }

    public Map<String, Long> getLeadStatusCounts() {
        return leadStatusCounts;
    }

    public void setLeadStatusCounts(Map<String, Long> leadStatusCounts) {
        this.leadStatusCounts = leadStatusCounts;
    }

    public List<String> getSvStatuses() {
        return svStatuses;
    }

    public void setSvStatuses(List<String> svStatuses) {
        this.svStatuses = svStatuses;
    }

    public List<String> getOwners() {
        return owners;
    }

    public void setOwners(List<String> owners) {
        this.owners = owners;
    }
}
