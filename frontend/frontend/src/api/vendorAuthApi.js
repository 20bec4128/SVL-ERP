import vendorApi, { setVendorAccessToken } from "../utils/vendorApi";

export async function loginVendor(identifier, password) {
  const response = await vendorApi.post("/api/vendor-auth/login", {
    identifier,
    password,
  });
  const payload = response?.data || null;
  if (payload?.accessToken) {
    setVendorAccessToken(payload.accessToken);
  }
  return payload;
}

export async function refreshVendorSession() {
  const response = await vendorApi.post("/api/vendor-auth/refresh", {});
  const payload = response?.data || null;
  if (payload?.accessToken) {
    setVendorAccessToken(payload.accessToken);
  }
  return payload;
}

export async function logoutVendor() {
  try {
    await vendorApi.post("/api/vendor-auth/logout", {});
  } finally {
    setVendorAccessToken(null);
  }
}
