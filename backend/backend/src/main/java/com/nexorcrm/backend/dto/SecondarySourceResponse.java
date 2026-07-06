package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class SecondarySourceResponse {
    private Long id;
    private String secondaryId;
    private String secondarySource;
    private Long primarySourceId;
    private String primarySource;
    private LocalDateTime createdDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSecondaryId() { return secondaryId; }
    public void setSecondaryId(String secondaryId) { this.secondaryId = secondaryId; }

    public String getSecondarySource() { return secondarySource; }
    public void setSecondarySource(String secondarySource) { this.secondarySource = secondarySource; }

    public Long getPrimarySourceId() { return primarySourceId; }
    public void setPrimarySourceId(Long primarySourceId) { this.primarySourceId = primarySourceId; }

    public String getPrimarySource() { return primarySource; }
    public void setPrimarySource(String primarySource) { this.primarySource = primarySource; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
