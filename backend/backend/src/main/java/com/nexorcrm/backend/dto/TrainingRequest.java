package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class TrainingRequest {

    @NotNull
    private Long trainingTypeId;

    @NotNull
    private Long trainerId;

    private List<Long> employeeIds;
    private BigDecimal cost;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private String status; // Active / Inactive

    public Long getTrainingTypeId() { return trainingTypeId; }
    public void setTrainingTypeId(Long trainingTypeId) { this.trainingTypeId = trainingTypeId; }

    public Long getTrainerId() { return trainerId; }
    public void setTrainerId(Long trainerId) { this.trainerId = trainerId; }

    public List<Long> getEmployeeIds() { return employeeIds; }
    public void setEmployeeIds(List<Long> employeeIds) { this.employeeIds = employeeIds; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
