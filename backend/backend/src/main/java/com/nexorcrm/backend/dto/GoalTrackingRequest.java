package com.nexorcrm.backend.dto;

import java.time.LocalDate;

public class GoalTrackingRequest {
    private String goalType;
    private String subject;
    private String targetAchievement;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private String status;
    private Integer progressPercent;

    public String getGoalType() { return goalType; }
    public void setGoalType(String goalType) { this.goalType = goalType; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getTargetAchievement() { return targetAchievement; }
    public void setTargetAchievement(String targetAchievement) { this.targetAchievement = targetAchievement; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }
}
