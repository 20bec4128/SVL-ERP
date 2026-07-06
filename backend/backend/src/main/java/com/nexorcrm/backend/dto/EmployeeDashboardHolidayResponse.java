package com.nexorcrm.backend.dto;

import java.time.LocalDate;

public class EmployeeDashboardHolidayResponse {
    private Long id;
    private String title;
    private LocalDate date;
    private String description;
    private Integer daysAway;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDaysAway() {
        return daysAway;
    }

    public void setDaysAway(Integer daysAway) {
        this.daysAway = daysAway;
    }
}
