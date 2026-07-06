import api from "../utils/api";
import { dashboardData } from "../mock/dashboardData";
import { employeeDashboardData } from "../mock/employeeDashboardData";
import { resolveMediaUrl } from "../utils/mediaUrl";

function normalizeDashboardResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    header: payload.header || dashboardData.header,
    welcome: payload.welcome
      ? {
          ...payload.welcome,
          avatar: resolveMediaUrl(payload.welcome.avatar),
        }
      : dashboardData.welcome,
    topStats: Array.isArray(payload.topStats) && payload.topStats.length > 0
      ? payload.topStats
      : dashboardData.topStats,
    recentActivities: Array.isArray(payload.recentActivities) ? payload.recentActivities : [],
    attendanceOverview: payload.attendanceOverview || null,
    clockInOutList: Array.isArray(payload.clockInOutList) ? payload.clockInOutList : [],
    lateList: Array.isArray(payload.lateList) ? payload.lateList : [],
    employees: Array.isArray(payload.employees)
      ? payload.employees.map((item) => ({
          ...item,
          avatar: resolveMediaUrl(item.avatar),
        }))
      : dashboardData.employees || [],
    birthdays: Array.isArray(payload.birthdays)
      ? payload.birthdays.map((group) => ({
          ...group,
          items: Array.isArray(group.items)
            ? group.items.map((item) => ({
                ...item,
                avatar: resolveMediaUrl(item.avatar),
              }))
            : [],
        }))
      : dashboardData.birthdays || [],
  };
}

function normalizeEmployeeDashboardResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    header: payload.header || employeeDashboardData.header,
    profile: payload.profile || employeeDashboardData.profile,
    attendanceSummary: payload.attendanceSummary || employeeDashboardData.attendanceSummary,
    todayAttendance: payload.todayAttendance || null,
    leaveSummary: payload.leaveSummary || employeeDashboardData.leaveSummary,
    performanceSummary: payload.performanceSummary || employeeDashboardData.performanceSummary,
    nextHoliday: payload.nextHoliday || employeeDashboardData.nextHoliday,
    leavePolicySummary: payload.leavePolicySummary || employeeDashboardData.leavePolicySummary,
    quickStats: Array.isArray(payload.quickStats) && payload.quickStats.length > 0
      ? payload.quickStats
      : employeeDashboardData.quickStats,
    recentLeaves: Array.isArray(payload.recentLeaves) ? payload.recentLeaves : [],
    recentActivities: Array.isArray(payload.recentActivities) ? payload.recentActivities : [],
    statusMessage: payload.statusMessage || employeeDashboardData.statusMessage,
  };
}

const dashboardService = {
  async getDashboard() {
    try {
      const response = await api.get("/api/admin/dashboard");
      const normalized = normalizeDashboardResponse(response?.data);
      return normalized || dashboardData;
    } catch (error) {
      return {
        ...dashboardData,
        recentActivities: [],
      };
    }
  },
  async getEmployeeDashboard() {
    try {
      const response = await api.get("/api/employee/dashboard");
      const normalized = normalizeEmployeeDashboardResponse(response?.data);
      return normalized || employeeDashboardData;
    } catch (error) {
      return employeeDashboardData;
    }
  },
};

export default dashboardService;
