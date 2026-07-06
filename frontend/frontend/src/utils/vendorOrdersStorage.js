const STORAGE_KEY = "svl.vendorOrders";

export const readVendorOrders = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeVendorOrders = (orders) => {
  if (typeof window === "undefined") return;
  const safeOrders = Array.isArray(orders) ? orders : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeOrders));
};

export const addVendorOrder = (order) => {
  const existing = readVendorOrders();
  const next = [order, ...existing];
  writeVendorOrders(next);
  return next;
};

export const updateVendorOrder = (orderId, updater) => {
  const existing = readVendorOrders();
  const next = existing.map((order) => {
    if (String(order.id) !== String(orderId)) return order;
    const updates = typeof updater === "function" ? updater(order) : updater;
    return { ...order, ...updates };
  });
  writeVendorOrders(next);
  return next;
};
