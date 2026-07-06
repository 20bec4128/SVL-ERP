package com.nexorcrm.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_tasks")
public class JobTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Job job;

    @Column(name = "department", length = 50, nullable = false)
    private String department; // DESIGN, PRINTING, FABRICATION, LOGISTICS, etc.

    @Column(name = "status", length = 50, nullable = false)
    private String status = "PENDING"; // PENDING, IN_PROGRESS, CUSTOMER_REVIEW, APPROVED

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber = 1;

    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "proof_file_path", length = 1000)
    private String proofFilePath;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "machine_used", length = 100)
    private String machineUsed;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "material_consumption", length = 500)
    private String materialConsumption;

    @Column(name = "wastage", length = 200)
    private String wastage;

    @Column(name = "remarks", columnDefinition = "text")
    private String remarks;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Integer versionNumber) { this.versionNumber = versionNumber; }
    public Long getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getProofFilePath() { return proofFilePath; }
    public void setProofFilePath(String proofFilePath) { this.proofFilePath = proofFilePath; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public String getMachineUsed() { return machineUsed; }
    public void setMachineUsed(String machineUsed) { this.machineUsed = machineUsed; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getMaterialConsumption() { return materialConsumption; }
    public void setMaterialConsumption(String materialConsumption) { this.materialConsumption = materialConsumption; }

    public String getWastage() { return wastage; }
    public void setWastage(String wastage) { this.wastage = wastage; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
