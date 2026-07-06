import api from "../utils/api";

export async function getCustomerChatMessages() {
  const response = await api.get("/api/customer/chat/messages");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function sendCustomerChatMessage(message) {
  const response = await api.post("/api/customer/chat/messages", {
    threadType: "CUSTOMER",
    message,
  });
  return response?.data || null;
}

export async function sendCustomerChatAttachment({ message, file }) {
  const formData = new FormData();
  if (message) {
    formData.append("message", message);
  }
  if (file) {
    formData.append("file", file);
  }
  const response = await api.post("/api/customer/chat/messages/file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response?.data || null;
}

export async function downloadCustomerChatAttachment(messageId) {
  const response = await api.get(`/api/customer/chat/messages/${messageId}/file`, {
    responseType: "blob",
  });
  return response?.data || null;
}

export async function getCustomerChatNotifications(since) {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const response = await api.get(`/api/customer/chat/notifications${query}`);
  return Array.isArray(response?.data) ? response.data : [];
}
