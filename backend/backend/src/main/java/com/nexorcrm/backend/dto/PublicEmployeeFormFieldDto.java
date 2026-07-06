package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.EmployeePublicFieldInputType;
import com.nexorcrm.backend.entity.VerificationStatus;

public class PublicEmployeeFormFieldDto {
    private String fieldKey;
    private String label;
    private EmployeePublicFieldInputType inputType;
    private Boolean editable;
    private String currentValue;
    private VerificationStatus status;
    private String remarks;

    public String getFieldKey() {
        return fieldKey;
    }

    public void setFieldKey(String fieldKey) {
        this.fieldKey = fieldKey;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public EmployeePublicFieldInputType getInputType() {
        return inputType;
    }

    public void setInputType(EmployeePublicFieldInputType inputType) {
        this.inputType = inputType;
    }

    public Boolean getEditable() {
        return editable;
    }

    public void setEditable(Boolean editable) {
        this.editable = editable;
    }

    public String getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(String currentValue) {
        this.currentValue = currentValue;
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
