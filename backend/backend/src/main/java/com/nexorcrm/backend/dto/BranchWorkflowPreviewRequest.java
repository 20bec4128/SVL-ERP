package com.nexorcrm.backend.dto;

public class BranchWorkflowPreviewRequest {

    private Long branchId;
    private Long leadDesignationId;
    private Long designDesignationId;
    private Long productionDesignationId;

    // Getters and Setters

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public Long getLeadDesignationId() {
        return leadDesignationId;
    }

    public void setLeadDesignationId(Long leadDesignationId) {
        this.leadDesignationId = leadDesignationId;
    }

    public Long getDesignDesignationId() {
        return designDesignationId;
    }

    public void setDesignDesignationId(Long designDesignationId) {
        this.designDesignationId = designDesignationId;
    }

    public Long getProductionDesignationId() {
        return productionDesignationId;
    }

    public void setProductionDesignationId(Long productionDesignationId) {
        this.productionDesignationId = productionDesignationId;
    }
}
