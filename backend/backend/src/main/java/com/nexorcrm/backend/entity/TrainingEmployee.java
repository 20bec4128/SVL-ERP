package com.nexorcrm.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "training_employees", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"training_id", "employee_id"})
})
public class TrainingEmployee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    public Long getId() { return id; }
    public Training getTraining() { return training; }
    public void setTraining(Training training) { this.training = training; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
}
