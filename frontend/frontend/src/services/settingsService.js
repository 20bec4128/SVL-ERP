import apiClient from "./apiClient";

const settingsService = {
  getOtpSettings() {
    return apiClient.get("/settings/otp");
  },
  getGdprSettings() {
    return apiClient.get("/settings/gdpr");
  },
};

export default settingsService;
