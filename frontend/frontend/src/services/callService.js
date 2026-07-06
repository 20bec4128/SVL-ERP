import apiClient from "./apiClient";

const callService = {
  getIncomingCall() {
    return apiClient.get("/calls/incoming");
  },
  getOutgoingCall() {
    return apiClient.get("/calls/outgoing");
  },
  getVoiceCall() {
    return apiClient.get("/calls/voice");
  },
};

export default callService;
