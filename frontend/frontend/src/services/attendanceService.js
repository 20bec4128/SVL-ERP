import apiClient from "./apiClient";

const attendanceService = {
  getAttendanceAdmin() {
    return apiClient.get("/attendance/admin");
  },
  getAttendanceEmployee() {
    return apiClient.get("/attendance/employee");
  },
  getAttendanceReport() {
    return apiClient.get("/attendance/report");
  },
};

export default attendanceService;
