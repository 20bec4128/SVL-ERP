package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class TertiarySourceResponse {
    private Long id;
    private String tertiaryId;
    private String tertiarySource;
    private LocalDateTime createdDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTertiaryId() { return tertiaryId; }
    public void setTertiaryId(String tertiaryId) { this.tertiaryId = tertiaryId; }

    public String getTertiarySource() { return tertiarySource; }
    public void setTertiarySource(String tertiarySource) { this.tertiarySource = tertiarySource; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
