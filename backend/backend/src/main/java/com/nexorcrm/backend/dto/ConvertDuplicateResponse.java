package com.nexorcrm.backend.dto;

public class ConvertDuplicateResponse {

    private boolean converted;
    private boolean stillDuplicate;
    private String matchedLeadRef;
    private String matchedLeadName;
    private Long leadId;

    public boolean isConverted() { return converted; }
    public void setConverted(boolean converted) { this.converted = converted; }
    public boolean isStillDuplicate() { return stillDuplicate; }
    public void setStillDuplicate(boolean stillDuplicate) { this.stillDuplicate = stillDuplicate; }
    public String getMatchedLeadRef() { return matchedLeadRef; }
    public void setMatchedLeadRef(String matchedLeadRef) { this.matchedLeadRef = matchedLeadRef; }
    public String getMatchedLeadName() { return matchedLeadName; }
    public void setMatchedLeadName(String matchedLeadName) { this.matchedLeadName = matchedLeadName; }
    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }
}
