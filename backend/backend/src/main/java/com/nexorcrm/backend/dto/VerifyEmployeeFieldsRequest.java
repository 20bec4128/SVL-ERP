package com.nexorcrm.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class VerifyEmployeeFieldsRequest {
    private List<FieldDecisionDto> fieldDecisions = new ArrayList<>();
    private List<DocumentDecisionDto> documentDecisions = new ArrayList<>();

    public List<FieldDecisionDto> getFieldDecisions() {
        return fieldDecisions;
    }

    public void setFieldDecisions(List<FieldDecisionDto> fieldDecisions) {
        this.fieldDecisions = fieldDecisions;
    }

    public List<DocumentDecisionDto> getDocumentDecisions() {
        return documentDecisions;
    }

    public void setDocumentDecisions(List<DocumentDecisionDto> documentDecisions) {
        this.documentDecisions = documentDecisions;
    }
}

