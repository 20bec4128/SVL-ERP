package com.nexorcrm.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_groups")
public class UserGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "is_system_group", nullable = false)
    private boolean systemGroup = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_scope", nullable = false, length = 20)
    private UserGroupMemberScope memberScope = UserGroupMemberScope.NONE;

    @Column(name = "institution_name", length = 160)
    private String institutionName;

    @Column(name = "department_name", length = 160)
    private String departmentName;

    @Column(name = "team_names_csv", length = 2000)
    private String teamNamesCsv;

    @Column(name = "page_keys_csv", columnDefinition = "TEXT")
    private String pageKeysCsv;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isSystemGroup() {
        return systemGroup;
    }

    public void setSystemGroup(boolean systemGroup) {
        this.systemGroup = systemGroup;
    }

    public UserGroupMemberScope getMemberScope() {
        return memberScope;
    }

    public void setMemberScope(UserGroupMemberScope memberScope) {
        this.memberScope = memberScope;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getTeamNamesCsv() {
        return teamNamesCsv;
    }

    public void setTeamNamesCsv(String teamNamesCsv) {
        this.teamNamesCsv = teamNamesCsv;
    }

    public String getPageKeysCsv() {
        return pageKeysCsv;
    }

    public void setPageKeysCsv(String pageKeysCsv) {
        this.pageKeysCsv = pageKeysCsv;
    }
}
