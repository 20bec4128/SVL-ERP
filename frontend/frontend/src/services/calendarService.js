import apiClient from "./apiClient";

const calendarService = {
  getCalendar() {
    return apiClient.get("/calendar");
  },
};

export default calendarService;
