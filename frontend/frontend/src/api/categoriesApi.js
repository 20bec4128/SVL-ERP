import api from "../utils/api";

export const getCategories = () =>
  api.get("/api/categories").then((r) => r.data);

export const createCategory = (data) =>
  api.post("/api/categories", {
    name: data.name,
    subName: data.subName,
  }).then((r) => r.data);

export const updateCategory = (id, data) =>
  api.put(`/api/categories/${id}`, {
    name: data.name,
    subName: data.subName,
  }).then((r) => r.data);

export const deleteCategory = (id) =>
  api.delete(`/api/categories/${id}`);
