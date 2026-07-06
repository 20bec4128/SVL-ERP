package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;

public class AttendanceBreakRequest {

    @NotNull
    private String breakType; // BREAK or LUNCH

    private String notes;

    public String getBreakType() { return breakType; }
    public void setBreakType(String breakType) { this.breakType = breakType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
