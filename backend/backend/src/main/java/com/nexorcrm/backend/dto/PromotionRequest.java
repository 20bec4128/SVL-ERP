package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class PromotionRequest {

    @NotNull
    private Long employeeId;

    private String employeeName;

    private String department;
    private String designationFrom;
    private String designationTo;

    @NotNull
    private LocalDate promotionDate;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDesignationFrom() { return designationFrom; }
    public void setDesignationFrom(String designationFrom) { this.designationFrom = designationFrom; }

    public String getDesignationTo() { return designationTo; }
    public void setDesignationTo(String designationTo) { this.designationTo = designationTo; }

    public LocalDate getPromotionDate() { return promotionDate; }
    public void setPromotionDate(LocalDate promotionDate) { this.promotionDate = promotionDate; }
}
