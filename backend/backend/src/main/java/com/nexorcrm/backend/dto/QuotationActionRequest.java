package com.nexorcrm.backend.dto;

public class QuotationActionRequest {
    private String notes;
    private Long actorId;
    private String actorName;
    private String actorRole;
    private String actorTeam;

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getActorTeam() { return actorTeam; }
    public void setActorTeam(String actorTeam) { this.actorTeam = actorTeam; }
}
