CREATE TABLE branch_workflow_configs (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    lead_designation_id BIGINT,
    lead_team_lead_user_id BIGINT,
    design_designation_id BIGINT,
    design_team_lead_user_id BIGINT,
    production_designation_id BIGINT,
    production_team_lead_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bwc_branch FOREIGN KEY (branch_id) REFERENCES branch_master(id) ON DELETE CASCADE,
    CONSTRAINT fk_bwc_lead_desig FOREIGN KEY (lead_designation_id) REFERENCES user_designations(id),
    CONSTRAINT fk_bwc_lead_user FOREIGN KEY (lead_team_lead_user_id) REFERENCES app_users(id),
    CONSTRAINT fk_bwc_design_desig FOREIGN KEY (design_designation_id) REFERENCES user_designations(id),
    CONSTRAINT fk_bwc_design_user FOREIGN KEY (design_team_lead_user_id) REFERENCES app_users(id),
    CONSTRAINT fk_bwc_production_desig FOREIGN KEY (production_designation_id) REFERENCES user_designations(id),
    CONSTRAINT fk_bwc_production_user FOREIGN KEY (production_team_lead_user_id) REFERENCES app_users(id),
    CONSTRAINT uq_bwc_branch UNIQUE (branch_id)
);

CREATE INDEX idx_bwc_branch ON branch_workflow_configs(branch_id);
CREATE INDEX idx_bwc_lead_desig ON branch_workflow_configs(lead_designation_id);
CREATE INDEX idx_bwc_lead_user ON branch_workflow_configs(lead_team_lead_user_id);
CREATE INDEX idx_bwc_design_desig ON branch_workflow_configs(design_designation_id);
CREATE INDEX idx_bwc_design_user ON branch_workflow_configs(design_team_lead_user_id);
CREATE INDEX idx_bwc_production_desig ON branch_workflow_configs(production_designation_id);
CREATE INDEX idx_bwc_production_user ON branch_workflow_configs(production_team_lead_user_id);
