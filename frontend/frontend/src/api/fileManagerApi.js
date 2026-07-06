import api from "../utils/api";

export async function getFiles(parentId, search) {
  let url = "/api/v1/files";
  const params = [];
  if (parentId) params.push(`parentId=${parentId}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (params.length > 0) {
    url += "?" + params.join("&");
  }
  const response = await api.get(url);
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createFileRecord(payload) {
  const response = await api.post("/api/v1/files", payload);
  return response?.data || null;
}

export async function deleteFileRecord(id) {
  const response = await api.delete(`/api/v1/files/${id}`);
  return response?.data || null;
}

export async function uploadFileRecord(file, parentId) {
  const formData = new FormData();
  formData.append("file", file);
  if (parentId) {
    formData.append("parentId", parentId);
  }
  const response = await api.post("/api/v1/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response?.data || null;
}
