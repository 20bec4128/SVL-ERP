package com.nexorcrm.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_policy_employees", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"policy_id", "employee_id"})
})
public class LeavePolicyEmployee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "policy_id", nullable = false)
    private LeavePolicy policy;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    public Long getId() { return id; }

    public LeavePolicy getPolicy() { return policy; }
    public void setPolicy(LeavePolicy policy) { this.policy = policy; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
}
