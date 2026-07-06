package com.nexorcrm.backend.dto;

import java.util.List;

public class AttendanceOverviewResponse {
    private int totalCount;
    private double presentPercentage;
    private double latePercentage;
    private double permissionPercentage;
    private double absentPercentage;
    private List<AbsenteeDto> absentees;

    // Getters and Setters
    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public double getPresentPercentage() {
        return presentPercentage;
    }

    public void setPresentPercentage(double presentPercentage) {
        this.presentPercentage = presentPercentage;
    }

    public double getLatePercentage() {
        return latePercentage;
    }

    public void setLatePercentage(double latePercentage) {
        this.latePercentage = latePercentage;
    }

    public double getPermissionPercentage() {
        return permissionPercentage;
    }

    public void setPermissionPercentage(double permissionPercentage) {
        this.permissionPercentage = permissionPercentage;
    }

    public double getAbsentPercentage() {
        return absentPercentage;
    }

    public void setAbsentPercentage(double absentPercentage) {
        this.absentPercentage = absentPercentage;
    }

    public List<AbsenteeDto> getAbsentees() {
        return absentees;
    }

    public void setAbsentees(List<AbsenteeDto> absentees) {
        this.absentees = absentees;
    }

    public static class AbsenteeDto {
        private String name;
        private String avatar;

        public AbsenteeDto(String name, String avatar) {
            this.name = name;
            this.avatar = avatar;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getAvatar() {
            return avatar;
        }

        public void setAvatar(String avatar) {
            this.avatar = avatar;
        }
    }
}
