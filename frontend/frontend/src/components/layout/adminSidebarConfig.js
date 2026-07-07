export const adminSidebarSections = [
  {
    key: "dashboard",
    title: "Dashboard",
    items: [
      {
        label: "Admin Dashboard",
        href: "/admin-dashboard",
        icon: "ti ti-layout-dashboard",
        accessAny: ["admin-dashboard"],
        rolesAny: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        label: "Employee Dashboard",
        href: "/employee-dashboard",
        icon: "ti ti-user-circle",
        accessAny: ["employee-dashboard"],
        rolesAny: ["EMPLOYEE", "TEAM_LEAD", "MANAGER","SUPER_ADMIN"],
      },
      // {
      //   label: "Sales Dashboard",
      //   href: "/dashboard",
      //   icon: "ti ti-chart-donut-3",
      //   accessAny: ["sales-dashboard"],
      //   rolesAny: [],
      // },
    ],
  },
  {
    key: "crm-sales",
    title: "CRM & Sales",
    items: [
      {
        label: "Leads",
        href: "/leads",
        icon: "ti ti-user-check",
        accessAny: ["leads"],
      },

      {
        label: "Requirements",
        href: "/requirements",
        icon: "ti ti-clipboard-list",
        accessAny: ["requirements"],
      },
     
      {
        label: "Quotation",
        icon: "ti ti-file-invoice",
        accessAny: ["quotation"],
        children: [
          {
            label: "Quotation List",
            href: "/quotation-list",
            accessAny: ["quotation"],
          },
          {
            label: "Create Quotation",
            href: "/quotation",
            accessAny: ["quotation"],
          },
          
          {
            label: "Quotation Template",
            href: "/quotation-template",
            accessAny: ["quotation"],
          },
        ],
      },
      
      {
        label: "Lead Source",
        icon: "ti ti-route",
        accessAny: [
          "lead-source",
          "lead-status",
          "primary-source",
          "secondary-source",
        ],
        children: [
          { label: "Lead Status", href: "/lead-status", accessAny: ["lead-source", "lead-status"] },
          { label: "Primary Source", href: "/primary-source", accessAny: ["lead-source", "primary-source"] },
          { label: "Secondary Source", href: "/secondary-source", accessAny: ["lead-source", "secondary-source"] },
        ],
      },
       {
        label: "Customers",
        href: "/customer",
        icon: "ti ti-users-group",
        accessAny: ["customer"],
      },
    ],
  },
  // {
  //   key: "project-management",
  //   title: "Project Management",
  //   items: [
  //     {
  //       label: "Projects",
  //       icon: "ti ti-briefcase-2",
  //       accessAny: ["projects", "projects-list", "project-status", "project-type"],
  //       children: [
  //         { label: "Projects List", href: "/projects-grid", accessAny: ["projects", "projects-list"] },
  //         { label: "Project Status", href: "/project-status", accessAny: ["projects", "project-status"] },
  //         { label: "Project Type", href: "/project-type", accessAny: ["projects", "project-type"] },
  //       ],
  //     },
  //     {
  //       label: "Tasks",
  //       href: "/tasks",
  //       icon: "ti ti-checklist",
  //       accessAny: ["projects", "tasks"],
  //     },
  //     {
  //       label: "Task Board",
  //       href: "/task-board",
  //       icon: "ti ti-layout-kanban",
  //       accessAny: ["projects", "task-board"],
  //     },
  //   ],
  // },
  {
    key: "operations",
    title: "Operations",
    items: [
      {
        label: "Design",
        href: "/design",
        icon: "ti ti-pencil-star",
        accessAny: ["design"],
      },
      {
        label: "Production",
        href: "/production",
        icon: "ti ti-building-factory-2",
        accessAny: ["production"],
      },
      {
        label: "Delivery",
        href: "/delivery",
        icon: "ti ti-truck",
        accessAny: ["delivery"],
      },
      {
        label: "Services",
        icon: "ti ti-tool",
        accessAny: ["services", "service-categories", "service-types", "price-list", "product-field-config"],
        children: [
                    { label: "Price List", href: "/services/price-list", accessAny: ["services", "price-list"] },
          { label: "Service Categories", href: "/services/service-categories", accessAny: ["services", "service-categories"] },
          { label: "Service Types", href: "/services/service-types", accessAny: ["services", "service-types"] },
          { label: "Product Fields", href: "/services/product-field-config", accessAny: ["services", "product-field-config"] },
        ],
      },
    ],
  },
  {
    key: "inventory-procurement",
    title: "Inventory & Procurement",
    items: [
      {
        label: "Stocks",
        icon: "ti ti-stack-2",
        accessAny: ["stocks", "stocks-dashboard", "stocks-item", "stocks-categories"],
        children: [
          { label: "Items", href: "/stocks/item", accessAny: ["stocks", "stocks-item"] },
          { label: "Categories", href: "/stocks/categories", accessAny: ["stocks", "stocks-categories"] },
        ],
      },
      {
        label: "Vendor Management",
        icon: "ti ti-building-store",
        accessAny: ["vendor-management", "vendors", "vendor-orders", "brands", "vendor-types"],
        children: [
          { label: "Vendors", href: "/stocks/vendors", accessAny: ["vendor-management", "vendors"] },
          { label: "Vendor Orders", href: "/stocks/vendor-orders", accessAny: ["vendor-management", "vendor-orders"] },
          { label: "Brands", href: "/stocks/brands", accessAny: ["vendor-management", "brands"] },
          { label: "Vendor Types", href: "/stocks/vendor-types", accessAny: ["vendor-management", "vendor-types"] },
        ],
      },
      {
        label: "Stock Requests",
        href: "/stock-requests",
        icon: "ti ti-arrows-transfer-up-down",
        accessAny: ["accounts", "stock-requests"],
      },
    ],
  },
  {
    key: "human-resources",
    title: "Human Resources",
    items: [
      {
        label: "Employee Management",
        icon: "ti ti-users",
        accessAny: ["employees", "employees-list", "organization", "head-offices", "branches", "departments", "designations"],
        children: [
          { label: "Employees", href: "/employees", accessAny: ["employees", "employees-list"] },
          { label: "Head Offices", href: "/head-offices", accessAny: ["organization", "head-offices"] },
          { label: "Branches", href: "/branches", accessAny: ["organization", "branches"] },
          { label: "Departments", href: "/departments", accessAny: ["organization", "departments"] },
          { label: "Designations", href: "/designations", accessAny: ["organization", "designations"] },
        ],
      },
      {
        label: "Attendance & Leave",
        icon: "ti ti-clock-hour-4",
        accessAny: [
          "attendance",
          "leaves",
          "leaves-employee",
          "leave-settings",
          "attendance-admin",
          "attendance-employee",
          "timesheets",
          "schedule-timing",
          "shift-assignments",
        ],
        children: [
          { label: "Attendance Admin", href: "/attendance-admin", accessAny: ["attendance", "attendance-admin"] },
          { label: "Attendance Employee", href: "/attendance-employee", accessAny: ["attendance", "attendance-employee"] },
          { label: "Leaves", href: "/leaves", accessAny: ["attendance", "leaves"] },
          { label: "Leave Policy", href: "/leave-settings", accessAny: ["attendance", "leave-settings"] },
          // { label: "Leave Type", href: "/leave-type", accessAny: ["attendance", "leave-settings"] },
          { label: "Timesheets", href: "/timesheets", accessAny: ["attendance", "timesheets"] },

          { label: "Shift & Schedule", href: "/schedule-timing", accessAny: ["attendance", "schedule-timing"] },
          { label: "Shift Assignment", href: "/shift-assignments", accessAny: ["shift-assignments"] },
        ],
      },
      {
        label: "Performance ",
        icon: "ti ti-target-arrow",
        accessAny: ["performance", "performance-indicator", "performance-appraisal", "goal-tracking", "goal-type"],
        children: [
          { label: "Performance Indicators", href: "/performance-indicator", accessAny: ["performance", "performance-indicator"] },
          { label: "Performance Appraisal", href: "/performance-appraisal", accessAny: ["performance", "performance-appraisal"] },
          { label: "Goals", href: "/goal-tracking", accessAny: ["performance", "goal-tracking"] },
          { label: "Goal Types", href: "/goal-type", accessAny: ["performance", "goal-type"] },
        ],
      },
      {
        label: "Employee Lifecycle",
        icon: "ti ti-arrows-shuffle",
        accessAny: ["promotion", "resignation", "termination"],
        children: [
          { label: "Promotion", href: "/promotion", accessAny: ["promotion"] },
          { label: "Resignation", href: "/resignation", accessAny: ["resignation"] },
          { label: "Termination", href: "/termination", accessAny: ["termination"] },
        ],
      },
      {
        label: "HR Configuration",
        icon: "ti ti-adjustments-horizontal",
        accessAny: ["holidays", "employees", "email-settings", "email-template"],
        children: [
          { label: "Holidays", href: "/holidays", accessAny: ["holidays"] },
          { label: "Mail Settings", href: "/email-settings", accessAny: ["employees", "email-settings"] },
          { label: "Email Templates", href: "/email-template", accessAny: ["employees", "email-template"] },
        ],
      },
      {
        label: "Payroll",
        icon: "ti ti-wallet",
        accessAny: ["payroll", "employee-salary", "payslip", "payroll-items", "sales", "provident-fund"],
        children: [
          { label: "Employee Salary", href: "/employee-salary", accessAny: ["payroll", "employee-salary"] },
          { label: "Payslip", href: "/payslip", accessAny: ["payroll", "payslip"] },
          { label: "Payslip Template", href: "/payslip-template", accessAny: ["payroll", "payslip-template"] },
          { label: "Payroll Items", href: "/payroll", accessAny: ["payroll", "payroll-items"] },
          { label: "Provident Fund", href: "/provident-fund", accessAny: ["sales", "provident-fund"] },
        ],
      },
    ],
  },
  {
    key: "finance-accounts",
    title: "Finance & Accounts",
    items: [ 
      {
        label: "Sales & Billing",
        icon: "ti ti-receipt-2",
        accessAny: ["sales", "estimates", "sales-invoices", "invoices", "payments", "expenses"],
        children: [
          { label: "Estimates", href: "/estimates", accessAny: ["sales", "estimates"] },
          { label: "Invoices", href: "/invoices", accessAny: ["sales", "sales-invoices", "invoices"] },
          { label: "Sales Orders", href: "/sales-orders", accessAny: ["sales"] },
          { label: "Payments", href: "/payments", accessAny: ["sales", "payments"] },
          { label: "Expenses", href: "/expenses", accessAny: ["sales", "expenses"] },
        ],
      },
      {
        label: "Accounting",
        icon: "ti ti-cash-banknote",
        accessAny: ["accounting", "categories", "budgets", "budget-expenses", "budget-revenues"],
        children: [
          { label: "Categories", href: "/categories", accessAny: ["accounting", "categories"] },
          { label: "Budgets", href: "/budgets", accessAny: ["accounting", "budgets"] },
          { label: "Budget Expenses", href: "/budget-expenses", accessAny: ["accounting", "budget-expenses"] },
          { label: "Budget Revenues", href: "/budget-revenues", accessAny: ["accounting", "budget-revenues"] },
        ],
      },
      
      {
        label: "Accounts Control",
        icon: "ti ti-shield-dollar",
        accessAny: ["accounts", "payment-verifications", "payment-verifications-page", "budget-verifications", "budget-verifications-page"],
        children: [
          { label: "Payment Verification", href: "/payment-verifications", accessAny: ["payment-verifications", "payment-verifications-page"] },
          { label: "Budget Verification", href: "/budget-verifications", accessAny: ["budget-verifications", "budget-verifications-page"] },
        ],
      },
      {
        label: "Taxation",
        icon: "ti ti-file-percent",
        accessAny: ["sales", "taxes"],
        children: [
          { label: "Taxes", href: "/taxes", accessAny: ["sales", "taxes"] },
        ],
      },
    ],
  },
  {
    key: "reports-analytics",
    title: "Reports & Analytics",
    items: [
      {
        label: "Reports",
        icon: "ti ti-chart-bar",
        accessAny: [
          "reports",
          "expenses-report",
          "invoice-report",
          "payment-report",
          "employee-report",
          "project-report",
          "leave-report",
          "task-report",
          "daily-report",
          "user-report",
        ],
        children: [
          {
            label: "Expense Report",
            href: "/expenses-report",
            accessAny: ["reports", "expenses-report"],
          },
          {
            label: "Invoice Report",
            href: "/invoice-report",
            accessAny: ["reports", "invoice-report"],
          },
          {
            label: "Payment Report",
            href: "/payment-report",
            accessAny: ["reports", "payment-report"],
          },
          {
            label: "Employee Report",
            href: "/employee-report",
            accessAny: ["reports", "employee-report"],
          },
          {
            label: "Project Report",
            href: "/project-report",
            accessAny: ["reports", "project-report"],
          },
          {
            label: "Leave Report",
            href: "/leave-report",
            accessAny: ["reports", "leave-report"],
          },
          {
            label: "Task Report",
            href: "/task-report",
            accessAny: ["reports", "task-report"],
          },
          {
            label: "Daily Report",
            href: "/daily-report",
            accessAny: ["reports", "daily-report"],
          },
          {
            label: "User Report",
            href: "/user-report",
            accessAny: ["reports", "user-report"],
          },
        ],
      },
    ],
  },
  {
    key: "administration",
    title: "Administration",
    rolesAny: ["ADMIN", "SUPER_ADMIN"],
    items: [
      {
        label: "Administration",
        icon: "ti ti-settings-2",
        accessAny: [
          "settings-useradmin",
          "settings-page-access",
          "settings-group-access",
          "settings-usergroups",
          "settings-flow",
          "settings-user-departments",
          "settings-user-designations",
          "settings-logs",
          "settings-registration",
          "settings-session",
          "settings-user",
          "settings-security",
          "settings-security-settings",
          "settings-workflow-teams",
        ],
        children: [
          { label: "User Admin", href: "/useradmin", accessAny: ["settings-useradmin"] },
          { label: "User Groups", href: "/usergroups", accessAny: ["settings-group-access", "settings-usergroups"] },
          { label: "Page Access", href: "/page-access", accessAny: ["settings-page-access"] },
          { label: "Flow", href: "/flow", accessAny: ["settings-flow"] },
          { label: "User Departments", href: "/settings/user-departments", accessAny: ["settings-user-departments"] },
          { label: "User Designations", href: "/settings/user-designations", accessAny: ["settings-user-designations"] },
          { label: "Logs", href: "/logs", accessAny: ["settings-logs"] },

          { label: "Workflow Teams", href: "/settings/workflow-teams", accessAny: ["settings-workflow-teams"] },
          { label: "Registration", href: "/registration", accessAny: ["settings-registration"] },
          { label: "Session", href: "/session-settings", accessAny: ["settings-session"] },
          { label: "User Settings", href: "/user-settings", accessAny: ["settings-user"] },
          { label: "Security", href: "/security", accessAny: ["settings-security"] },
          { label: "Security Settings", href: "/security-settings", accessAny: ["settings-security-settings"] },
        ],
      },
    ],
  },
  // {
  //   key: "super-admin",
  //   title: "Super Admin",
  //   rolesAny: ["SUPER_ADMIN"],
  //   items: [
  //     { label: "Companies", href: "/companies", icon: "ti ti-building-community" },
  //     { label: "Subscriptions", href: "/subscription", icon: "ti ti-credit-card" },
  //     { label: "Packages", href: "/packages", icon: "ti ti-package-import" },
  //     { label: "Domain", href: "/domain", icon: "ti ti-world" },
  //     { label: "Purchase Transactions", href: "/purchase-transaction", icon: "ti ti-shopping-cart" },
  //   ],
  // },
];
