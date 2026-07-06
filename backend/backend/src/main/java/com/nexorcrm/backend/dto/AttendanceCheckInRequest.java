package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;

public class AttendanceCheckInRequest {

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    private Double accuracy;

    private String notes;

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
