export const PAGE_ACCESS_OPTIONS = [
  {
    key: "dashboard",
    label: "Dashboard",
    category: "Dashboard",
    children: [
      { key: "admin-dashboard", label: "Admin Dashboard" },
      { key: "employee-dashboard", label: "Employee Dashboard" },
    ],
  },
  { key: "leads", label: "Leads", category: "CRM & Sales" },

  { key: "requirements", label: "Requirements", category: "CRM & Sales" },
  { key: "quotation", label: "Quotation", category: "CRM & Sales" },
  {
    key: "lead-source",
    label: "Lead Source",
    category: "CRM & Sales",
    children: [
      { key: "lead-status", label: "Lead Status" },
      { key: "primary-source", label: "Primary Source" },
      { key: "secondary-source", label: "Secondary Source" },
    ],
  },
  { key: "customer", label: "Customers", category: "CRM & Sales" },
  { key: "design", label: "Design", category: "Operations" },
  { key: "production", label: "Production", category: "Operations" },
  { key: "delivery", label: "Delivery", category: "Operations" },
  {
    key: "services",
    label: "Services",
    category: "Operations",
    children: [
      { key: "service-categories", label: "Service Categories" },
      { key: "service-types", label: "Service Types" },
      { key: "price-list", label: "Price List" },
      { key: "product-field-config", label: "Product Field Config" },
    ],
  },
  {
    key: "stocks",
    label: "Stocks",
    category: "Inventory & Procurement",
    children: [
      { key: "stocks-item", label: "Items" },
      { key: "stocks-categories", label: "Categories" },
    ],
  },
  {
    key: "vendor-management",
    label: "Vendor Management",
    category: "Inventory & Procurement",
    children: [
      { key: "vendors", label: "Vendors" },
      { key: "vendor-orders", label: "Vendor Orders" },
      { key: "brands", label: "Brands" },
      { key: "vendor-types", label: "Vendor Types" },
    ],
  },
  { key: "stock-requests", label: "Stock Requests", category: "Inventory & Procurement" },
  {
    key: "employees",
    label: "Employees",
    category: "Human Resources",
    children: [
      { key: "employees-list", label: "Employees" },
      { key: "email-settings", label: "Mail Settings" },
      { key: "email-template", label: "Email Templates" },
    ],
  },
  {
    key: "organization",
    label: "Organization",
    category: "Human Resources",
    children: [
      { key: "head-offices", label: "Head Offices" },
      { key: "branches", label: "Branches" },
      { key: "departments", label: "Departments" },
      { key: "designations", label: "Designations" },
    ],
  },
  {
    key: "attendance",
    label: "Attendance",
    category: "Human Resources",
    children: [
      { key: "leaves", label: "Leaves (Admin)" },
      { key: "leaves-employee", label: "Leave (Employee)" },
      { key: "leave-settings", label: "Leave Policy" },
      { key: "attendance-admin", label: "Attendance (Admin)" },
      { key: "attendance-employee", label: "Attendance (Employee)" },
      { key: "timesheets", label: "Timesheets" },
      { key: "schedule-timing", label: "Shift & Schedule" },
      { key: "shift-assignments", label: "Shift Assignment" },
    ],
  },
  {
    key: "performance",
    label: "Performance",
    category: "Human Resources",
    children: [
      { key: "performance-indicator", label: "Performance Indicator" },
      { key: "performance-appraisal", label: "Performance Appraisal" },
      { key: "goal-tracking", label: "Goal List" },
      { key: "goal-type", label: "Goal Type" },
    ],
  },
  { key: "promotion", label: "Promotion", category: "Human Resources" },
  { key: "resignation", label: "Resignation", category: "Human Resources" },
  { key: "termination", label: "Termination", category: "Human Resources" },
  { key: "holidays", label: "Holidays", category: "Human Resources" },
  {
    key: "payroll",
    label: "Payroll",
    category: "Human Resources",
    children: [
      { key: "employee-salary", label: "Employee Salary" },
      { key: "payslip", label: "Payslip" },
      { key: "payslip-template", label: "Payslip Template" },
      { key: "payroll-items", label: "Payroll Items" },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    category: "Finance & Accounts",
    children: [
      { key: "estimates", label: "Estimates" },
      { key: "sales-invoices", label: "Invoices" },
      { key: "payments", label: "Payments" },
      { key: "expenses", label: "Expenses" },
      { key: "provident-fund", label: "Provident Fund" },
      { key: "taxes", label: "Taxes" },
    ],
  },
  {
    key: "accounting",
    label: "Accounting",
    category: "Finance & Accounts",
    children: [
      { key: "categories", label: "Categories" },
      { key: "budgets", label: "Budgets" },
      { key: "budget-expenses", label: "Budget Expenses" },
      { key: "budget-revenues", label: "Budget Revenues" },
    ],
  },
  {
    key: "accounts",
    label: "Accounts",
    category: "Finance & Accounts",
    children: [
      { key: "payment-verifications", label: "Payment Verification" },
      { key: "budget-verifications", label: "Budget Verification" },
    ],
  },
  { key: "invoices", label: "Invoices", category: "Finance & Accounts" },
  {
    key: "reports",
    label: "Reports",
    category: "Reports & Analytics",
    children: [
      { key: "expenses-report", label: "Expense Report" },
      { key: "invoice-report", label: "Invoice Report" },
      { key: "payment-report", label: "Payment Report" },
      { key: "employee-report", label: "Employee Report" },
      { key: "project-report", label: "Project Report" },
      { key: "leave-report", label: "Leave Report" },
      { key: "task-report", label: "Task Report" },
      { key: "daily-report", label: "Daily Report" },
      { key: "user-report", label: "User Report" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    category: "Administration",
    children: [
      { key: "settings-useradmin", label: "User Admin" },
      { key: "settings-usergroups", label: "User Groups" },
      { key: "settings-group-access", label: "Group Access" },
      { key: "settings-page-access", label: "Page Access" },
      { key: "settings-registration", label: "Registration" },
      { key: "settings-session", label: "Session" },
      { key: "settings-user", label: "User Settings" },
      { key: "settings-security", label: "Security" },
      { key: "settings-security-settings", label: "Security Settings" },
      { key: "settings-flow", label: "Flow" },
      { key: "settings-logs", label: "Logs" },
      { key: "settings-user-departments", label: "User Departments" },
      { key: "settings-user-designations", label: "User Designations" },
      { key: "settings-workflow-teams", label: "Workflow Teams" },
    ],
  },
];

const ROUTE_ACCESS_RULES = [
  { pageKeys: ["admin-dashboard"], prefixes: ["/admin-dashboard"] },
  { pageKeys: ["employee-dashboard"], prefixes: ["/employee-dashboard"] },
  { pageKeys: ["sales-dashboard"], prefixes: ["/dashboard"] },
  { pageKeys: ["settings-useradmin"], prefixes: ["/useradmin/create", "/useradmin", "/user-edit"] },
  { pageKeys: ["settings-page-access"], prefixes: ["/page-access"] },
  { pageKeys: ["settings-group-access"], prefixes: ["/group-access"] },
  { pageKeys: ["settings-usergroups"], prefixes: ["/usergroups"] },
  { pageKeys: ["settings-department-permissions"], prefixes: ["/department-permissions"] },
  { pageKeys: ["settings-designation-permissions"], prefixes: ["/designation-permissions"] },
  { pageKeys: ["settings-registration"], prefixes: ["/registration"] },
  { pageKeys: ["settings-session"], prefixes: ["/session-settings"] },
  { pageKeys: ["settings-user"], prefixes: ["/user-settings"] },
  { pageKeys: ["settings-security"], prefixes: ["/security"] },
  { pageKeys: ["settings-security-settings"], prefixes: ["/security-settings"] },
  { pageKeys: ["settings-flow"], prefixes: ["/flow"] },
  { pageKeys: ["settings-logs"], prefixes: ["/logs"] },
  { pageKeys: ["settings-user-departments"], prefixes: ["/settings/user-departments"] },
  { pageKeys: ["settings-user-designations"], prefixes: ["/settings/user-designations"] },
  { pageKeys: ["settings-workflow-teams"], prefixes: ["/settings/workflow-teams"] },
  { pageKeys: ["vendor-management", "vendors", "brands", "vendor-types"], prefixes: ["/stocks/vendors", "/stocks/brands", "/stocks/vendor-types"] },
  { pageKeys: ["vendor-management", "vendor-orders"], prefixes: ["/stocks/vendor-orders"] },
  { pageKeys: ["lead-source", "lead-status", "primary-source", "secondary-source"], prefixes: ["/lead-status", "/primary-source", "/secondary-source"] },
  { pageKeys: ["projects", "projects-list"], prefixes: ["/projects", "/projects-grid"] },
  { pageKeys: ["projects", "project-status"], prefixes: ["/project-status"] },
  { pageKeys: ["projects", "project-type"], prefixes: ["/project-type"] },
  { pageKeys: ["projects", "tasks"], prefixes: ["/tasks"] },
  { pageKeys: ["projects", "task-board"], prefixes: ["/task-board"] },
  { pageKeys: ["budget-verifications", "budget-verifications-page"], prefixes: ["/budget-verifications"] },
  { pageKeys: ["accounts", "payment-verifications", "payment-verifications-page"], prefixes: ["/payment-verifications"] },
  { pageKeys: ["invoices", "sales", "sales-invoices", "invoice-report"], prefixes: ["/invoices", "/invoice-page", "/invoice-details", "/invoice-list", "/invoice-report"] },
  { pageKeys: ["sales", "estimates"], prefixes: ["/estimates"] },
  { pageKeys: ["sales", "payments"], prefixes: ["/payments"] },
  { pageKeys: ["sales", "expenses"], prefixes: ["/expenses"] },
  { pageKeys: ["sales", "provident-fund"], prefixes: ["/provident-fund"] },
  { pageKeys: ["sales", "taxes"], prefixes: ["/taxes"] },
  { pageKeys: ["accounting", "categories"], prefixes: ["/categories"] },
  { pageKeys: ["accounting", "budgets"], prefixes: ["/budgets"] },
  { pageKeys: ["accounting", "budget-expenses"], prefixes: ["/budget-expenses"] },
  { pageKeys: ["accounting", "budget-revenues"], prefixes: ["/budget-revenues"] },
  { pageKeys: ["payroll", "employee-salary"], prefixes: ["/employee-salary"] },
  { pageKeys: ["payroll", "payslip"], prefixes: ["/payslip", "/payslip-report"] },
  { pageKeys: ["payroll", "payslip-template"], prefixes: ["/payslip-template"] },
  { pageKeys: ["payroll", "payroll-items"], prefixes: ["/payroll"] },
  { pageKeys: ["accounts", "stock-requests"], prefixes: ["/stock-requests"] },
  { pageKeys: ["stocks", "stocks-dashboard"], prefixes: ["/stocks"] },
  { pageKeys: ["stocks", "stocks-item"], prefixes: ["/stocks/item"] },
  { pageKeys: ["stocks", "stocks-categories"], prefixes: ["/stocks/categories"] },
  { pageKeys: ["quotation"], prefixes: ["/quotation"] },
  { pageKeys: ["quotation"], prefixes: ["/quotation-list"] },
  { pageKeys: ["clients"], prefixes: ["/clients", "/clients-grid"] },
  { pageKeys: ["companies"], prefixes: ["/companies", "/companies-grid"] },
  { pageKeys: ["contacts"], prefixes: ["/contacts", "/contacts-grid"] },
  { pageKeys: ["production"], prefixes: ["/production", "/production-detail"] },
  { pageKeys: ["design"], prefixes: ["/design", "/design-detail", "/design-work"] },
  { pageKeys: ["delivery"], prefixes: ["/delivery"] },

  { pageKeys: ["customer"], prefixes: ["/customer"] },
  { pageKeys: ["leads"], prefixes: ["/leads", "/leads-dashboard"] },
  { pageKeys: ["requirements"], prefixes: ["/requirements"] },
  { pageKeys: ["employees", "employees-list"], prefixes: ["/employees"] },
  { pageKeys: ["organization", "head-offices"], prefixes: ["/head-offices"] },
  { pageKeys: ["organization", "branches"], prefixes: ["/branches"] },
  { pageKeys: ["organization", "departments"], prefixes: ["/departments"] },
  { pageKeys: ["organization", "designations"], prefixes: ["/designations"] },
  { pageKeys: ["employees", "email-settings"], prefixes: ["/email-settings"] },
  { pageKeys: ["employees", "email-template"], prefixes: ["/email-template"] },
  { pageKeys: ["holidays"], prefixes: ["/holidays"] },
  { pageKeys: ["attendance", "attendance-admin"], prefixes: ["/attendance-admin"] },
  { pageKeys: ["attendance", "attendance-employee"], prefixes: ["/attendance-employee"] },
  { pageKeys: ["attendance", "leaves"], prefixes: ["/leaves"] },
  { pageKeys: ["attendance", "leaves-employee"], prefixes: ["/leaves-employee"] },
  { pageKeys: ["attendance", "leave-settings"], prefixes: ["/leave-settings"] },
  { pageKeys: ["attendance", "timesheets"], prefixes: ["/timesheets"] },
  { pageKeys: ["attendance", "schedule-timing"], prefixes: ["/schedule-timing"] },
  { pageKeys: ["attendance", "shift-assignments"], prefixes: ["/shift-assignments"] },
  { pageKeys: ["performance", "performance-indicator"], prefixes: ["/performance-indicator"] },
  { pageKeys: ["performance", "performance-appraisal"], prefixes: ["/performance-appraisal"] },
  { pageKeys: ["performance", "goal-tracking"], prefixes: ["/goal-tracking"] },
  { pageKeys: ["performance", "goal-type"], prefixes: ["/goal-type"] },
  { pageKeys: ["promotion"], prefixes: ["/promotion"] },
  { pageKeys: ["resignation"], prefixes: ["/resignation"] },
  { pageKeys: ["termination"], prefixes: ["/termination"] },
  { pageKeys: ["recruitment", "recruitment-jobs"], prefixes: ["/job-grid", "/job-list"] },
  { pageKeys: ["recruitment", "recruitment-candidates"], prefixes: ["/candidates", "/candidates-grid"] },
  { pageKeys: ["recruitment", "recruitment-referrals"], prefixes: ["/referrals"] },
  { pageKeys: ["reports", "expenses-report"], prefixes: ["/expenses-report"] },
  { pageKeys: ["reports", "payment-report"], prefixes: ["/payment-report"] },
  { pageKeys: ["reports", "employee-report"], prefixes: ["/employee-report"] },
  { pageKeys: ["reports", "task-report"], prefixes: ["/task-report"] },
  { pageKeys: ["reports", "user-report"], prefixes: ["/user-report"] },
  { pageKeys: ["reports", "daily-report"], prefixes: ["/daily-report"] },
  { pageKeys: ["reports", "leave-report"], prefixes: ["/leave-report"] },
  { pageKeys: ["reports", "project-report"], prefixes: ["/project-report"] },
  { pageKeys: ["services", "service-categories"], prefixes: ["/services/service-categories"] },
  { pageKeys: ["services", "service-types"], prefixes: ["/services/service-types"] },
  { pageKeys: ["services", "price-list"], prefixes: ["/services/price-list"] },
  { pageKeys: ["services", "product-field-config"], prefixes: ["/services/product-field-config"] },
];

const ALWAYS_ALLOWED_PREFIXES = [
  "/login",
  "/unauthorized",
];

const ADMIN_ONLY_PREFIXES = [
  "/useradmin",
  "/user-edit",
  "/page-access",
  "/group-access",
  "/usergroups",
  "/department-permissions",
  "/designation-permissions",
  "/security",
  "/security-settings",
  "/session-settings",
  "/user-settings",
  "/flow",
  "/logs",
  "/settings/user-departments",
  "/settings/user-designations",
  "/settings/workflow-teams",
];

function normalizePath(path) {
  const raw = String(path || "").trim();
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function normalizePageKeys(pageKeys) {
  return Array.isArray(pageKeys)
    ? pageKeys.map((key) => String(key || "").trim().toLowerCase()).filter(Boolean)
    : [];
}

const PAGE_KEY_EQUIVALENTS = {
  "payment-verifications": ["payment-verifications", "payment-verifications-page"],
  "payment-verifications-page": ["payment-verifications-page", "payment-verifications"],
  "budget-verifications": ["budget-verifications", "budget-verifications-page"],
  "budget-verifications-page": ["budget-verifications-page", "budget-verifications"],
  "shift-assignments": ["shift-assignments", "shift-assignment"],
  "shift-assignment": ["shift-assignment", "shift-assignments"],
};

export function getEquivalentPageKeys(pageKey) {
  const normalized = String(pageKey || "").trim().toLowerCase();
  if (!normalized) return [];
  return PAGE_KEY_EQUIVALENTS[normalized] || [normalized];
}

export function hasEquivalentPageKey(pageKeys, pageKey) {
  const normalizedKeys =
    pageKeys instanceof Set
      ? pageKeys
      : new Set(normalizePageKeys(pageKeys));
  return getEquivalentPageKeys(pageKey).some((key) => normalizedKeys.has(key));
}

export function isAlwaysAllowedPath(path) {
  const normalized = normalizePath(path);
  if (normalized === "/") return true;
  return ALWAYS_ALLOWED_PREFIXES.some((prefix) =>
    normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export function isAdminOnlyPath(path) {
  const normalized = normalizePath(path);
  return ADMIN_ONLY_PREFIXES.some((prefix) =>
    normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export function getRequiredPageKeysForPath(path) {
  const normalized = normalizePath(path);
  const match = ROUTE_ACCESS_RULES.find((rule) =>
    rule.prefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
  );
  return match ? match.pageKeys : [];
}

export function canAccessPathWithPageKeys(path, pageKeys, role) {
  const normalizedRole = String(role || "").trim().toUpperCase();
  const canUsePermissionControlledAdminRoutes =
    normalizedRole === "ADMIN" ||
    normalizedRole === "SUPER_ADMIN" ||
    normalizedRole === "MANAGER" ||
    normalizedRole === "TEAM_LEAD" ||
    normalizedRole === "EMPLOYEE";
  if (isAdminOnlyPath(path) && !canUsePermissionControlledAdminRoutes) return false;
  if (isAlwaysAllowedPath(path)) return true;

  const normalizedKeys = normalizePageKeys(pageKeys);
  const requiredKeys = getRequiredPageKeysForPath(path);
  if (!requiredKeys.length) return true;

  return requiredKeys.some((key) => hasEquivalentPageKey(new Set(normalizedKeys), key));
}

export function getDefaultLandingPath(role, pageKeys) {
  const normalizedRole = String(role || "").trim().toUpperCase();
  if (normalizedRole === "CUSTOMER") {
    return "/portal/invoice";
  }

  const seen = new Set();
  for (const rule of ROUTE_ACCESS_RULES) {
    const path = normalizePath(rule?.prefixes?.[0]);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    if (canAccessPathWithPageKeys(path, pageKeys, normalizedRole)) {
      return path;
    }
  }

  return "/unauthorized";
}
