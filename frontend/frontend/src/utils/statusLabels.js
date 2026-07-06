function normalizeStatusKey(status) {
  const key = String(status || "").trim().toLowerCase();
  if (key === "new") return "new lead";
  if (key === "requirement collected" || key === "requirements collected") return "requirement";
  if (key === "design & production" || key === "design and production") return "design + production";
  if (key === "stock requested") return "stock request";
  return key;
}

function formatToken(token) {
  if (!token) return token;
  if (/^[^a-zA-Z]*$/.test(token)) return token;
  if (/^[A-Z0-9+/_-]+$/.test(token) && token === token.toUpperCase()) {
    return token;
  }
  if (/^[a-z]{1,4}$/.test(token)) {
    return token.toUpperCase();
  }
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

const STATUS_LABEL_OVERRIDES = {
  requirement: "Requirements Collected",
  "not attempted": "Not Attempted",
  "new lead": "New Lead",
  "new": "New Lead",
};

export function formatStatusLabel(status) {
  const raw = String(status || "").trim();
  if (!raw) return "";
  const override = STATUS_LABEL_OVERRIDES[normalizeStatusKey(raw)];
  if (override) return override;
  return raw
    .split(/(\s+|\+)/)
    .map((part) => (part === "+" || /^\s+$/.test(part) ? part : formatToken(part)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function uniqueStatusOptions(statuses) {
  const seen = new Set();
  const output = [];
  for (const status of Array.isArray(statuses) ? statuses : []) {
    const raw = String(status || "").trim();
    if (!raw) continue;
    const key = normalizeStatusKey(raw);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(raw);
  }
  return output;
}

export function normalizeStatusLabelKey(status) {
  return normalizeStatusKey(status);
}

export function getStatusStyle(status) {
  const s = String(status || "").toLowerCase().trim();

  // Color Mapping
  const colors = {
    newLead: "#2563EB",
    attempted: "#F97316",
    interested: "#22C55E",
    notAttempted: "#8B5CF6",
    rejected: "#EF4444",
    requirementsCollected: "#06B6D4",
    budget: "#F59E0B",
    boq: "#EC4899",
    allocate: "#14B8A6",
    design: "#DB2777",
    production: "#3B82F6",
    designProduction: "#7C3AED",
    productionResume: "#6366F1",
    purchase: "#EA580C",
    stockRequest: "#FB7185",
    stockRequested: "#F97316",
    stockUpdated: "#10B981",
    accounts: "#A855F7",
    accountsReview: "#8B5CF6",
    approval: "#0EA5E9",
    payment: "#16A34A",
    deal: "#84CC16",
    delivery: "#22C55E",
    duplicate: "#F43F5E",
  };

  let hex = "#64748B"; // default gray

  if (s.includes("new")) hex = colors.newLead;
  else if (s.includes("not attempted")) hex = colors.notAttempted;
  else if (s.includes("attempted")) hex = colors.attempted;
  else if (s.includes("interested")) hex = colors.interested;
  else if (s.includes("requirements")) hex = colors.requirementsCollected;
  else if (s.includes("budget")) hex = colors.budget;
  else if (s.includes("boq")) hex = colors.boq;
  else if (s.includes("allocate")) hex = colors.allocate;
  else if (s.includes("design") && s.includes("production")) hex = colors.designProduction;
  else if (s.includes("design")) hex = colors.design;
  else if (s.includes("production resume")) hex = colors.productionResume;
  else if (s.includes("production")) hex = colors.production;
  else if (s.includes("purchase")) hex = colors.purchase;
  else if (s.includes("stock requested")) hex = colors.stockRequested;
  else if (s.includes("stock request")) hex = colors.stockRequest;
  else if (s.includes("stock updated")) hex = colors.stockUpdated;
  else if (s.includes("accounts review")) hex = colors.accountsReview;
  else if (s.includes("accounts")) hex = colors.accounts;
  else if (s.includes("approval")) hex = colors.approval;
  else if (s.includes("payment")) hex = colors.payment;
  else if (s.includes("deal")) hex = colors.deal;
  else if (s.includes("delivery")) hex = colors.delivery;
  else if (s.includes("duplicate")) hex = colors.duplicate;
  else if (s.includes("reject")) hex = colors.rejected;

  const getReadableTextColor = (colorHex) => {
    const r = parseInt(colorHex.substring(1, 3), 16);
    const g = parseInt(colorHex.substring(3, 5), 16);
    const b = parseInt(colorHex.substring(5, 7), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.62 ? "#0f172a" : "#ffffff";
  };

  const textColor = getReadableTextColor(hex);

  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return {
    backgroundColor: hex,
    color: textColor,
    border: `1px solid rgba(${r}, ${g}, ${b}, 0.9)`,
    boxShadow: `0 1px 2px rgba(${r}, ${g}, ${b}, 0.18)`,
  };
}
