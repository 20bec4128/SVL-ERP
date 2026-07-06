import api from "../utils/api";

export async function getActiveGstMasters() {
  const response = await api.get("/api/gst-master/active");
  return response.data;
}

export async function getAllGstMasters() {
  const response = await api.get("/api/gst-master");
  return response.data;
}

export async function createGstMaster(payload) {
  const response = await api.post("/api/gst-master", payload);
  return response.data;
}

export async function updateGstMaster(id, payload) {
  const response = await api.put(`/api/gst-master/${id}`, payload);
  return response.data;
}

export async function deleteGstMaster(id) {
  const response = await api.delete(`/api/gst-master/${id}`);
  return response.data;
}
