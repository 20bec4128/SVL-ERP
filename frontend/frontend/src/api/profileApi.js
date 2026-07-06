import api from "../utils/api";

export async function getMyProfile() {
  const response = await api.get("/api/auth/me");
  return response?.data || null;
}

export async function updateMyProfile(payload) {
  const response = await api.put("/api/auth/profile", payload);
  return response?.data || null;
}

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/auth/profile/photo", formData);
  return response?.data || null;
}

export async function changePassword(oldPassword, newPassword) {
  const response = await api.post("/api/auth/change-password", {
    oldPassword,
    newPassword,
  });
  return response?.data || null;
}
