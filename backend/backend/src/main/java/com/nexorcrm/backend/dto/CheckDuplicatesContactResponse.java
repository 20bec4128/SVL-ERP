package com.nexorcrm.backend.dto;

public class CheckDuplicatesContactResponse {

    private String mobile;
    private String email;
    private Long matchedLeadId;
    private String matchedLeadRef;
    private String matchedLeadName;

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getMatchedLeadId() { return matchedLeadId; }
    public void setMatchedLeadId(Long matchedLeadId) { this.matchedLeadId = matchedLeadId; }
    public String getMatchedLeadRef() { return matchedLeadRef; }
    public void setMatchedLeadRef(String matchedLeadRef) { this.matchedLeadRef = matchedLeadRef; }
    public String getMatchedLeadName() { return matchedLeadName; }
    public void setMatchedLeadName(String matchedLeadName) { this.matchedLeadName = matchedLeadName; }
}
