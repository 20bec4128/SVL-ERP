package com.nexorcrm.backend.dto;

import java.util.List;

public class BulkLeadResponse {

    private int created;
    private List<String> errors;

    public BulkLeadResponse(int created, List<String> errors) {
        this.created = created;
        this.errors = errors;
    }

    public int getCreated() { return created; }
    public void setCreated(int created) { this.created = created; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
