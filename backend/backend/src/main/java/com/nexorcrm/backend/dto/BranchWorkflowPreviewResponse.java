package com.nexorcrm.backend.dto;

public class BranchWorkflowPreviewResponse {

    private boolean valid;
    private String generalMessage;

    private TeamLeadPreview leadTeamLead;
    private TeamLeadPreview designTeamLead;
    private TeamLeadPreview productionTeamLead;

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getGeneralMessage() {
        return generalMessage;
    }

    public void setGeneralMessage(String generalMessage) {
        this.generalMessage = generalMessage;
    }

    public TeamLeadPreview getLeadTeamLead() {
        return leadTeamLead;
    }

    public void setLeadTeamLead(TeamLeadPreview leadTeamLead) {
        this.leadTeamLead = leadTeamLead;
    }

    public TeamLeadPreview getDesignTeamLead() {
        return designTeamLead;
    }

    public void setDesignTeamLead(TeamLeadPreview designTeamLead) {
        this.designTeamLead = designTeamLead;
    }

    public TeamLeadPreview getProductionTeamLead() {
        return productionTeamLead;
    }

    public void setProductionTeamLead(TeamLeadPreview productionTeamLead) {
        this.productionTeamLead = productionTeamLead;
    }

    public static class TeamLeadPreview {
        private String designationName;
        private Long userId;
        private String userName;
        private String fullName;
        private String status; // RESOLVED, MULTIPLE, NOT_FOUND
        private String message;

        public String getDesignationName() {
            return designationName;
        }

        public void setDesignationName(String designationName) {
            this.designationName = designationName;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getUserName() {
            return userName;
        }

        public void setUserName(String userName) {
            this.userName = userName;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
