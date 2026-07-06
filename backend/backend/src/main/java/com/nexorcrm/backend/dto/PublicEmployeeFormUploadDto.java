package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.EmployeeDocumentType;
import com.nexorcrm.backend.entity.VerificationStatus;

public class PublicEmployeeFormUploadDto {
    private EmployeeDocumentType docType;
    private String label;
    private VerificationStatus status;
    private String remarks;

    public EmployeeDocumentType getDocType() {
        return docType;
    }

    public void setDocType(EmployeeDocumentType docType) {
        this.docType = docType;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public VerificationStatus getStatus() {
        return status;
    }

    public void setStatus(VerificationStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
