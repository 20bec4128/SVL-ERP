package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class EmployeeShiftRequest {

    @NotNull
    private Long employeeId;

    @NotNull
    private Long shiftId;

    private Long locationId;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }
}
