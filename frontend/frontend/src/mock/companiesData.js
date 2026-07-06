export const companiesData = {
  header: {
    title: "Companies",
    breadcrumbs: [
      { href: "admin-dashboard.php", iconClass: "ti ti-smart-home", label: "Home" },
      { label: "Application" },
      { label: "Companies List" },
    ],
  },
  stats: [
    { id: 1, iconClass: "ti ti-building fs-16", iconWrap: "avatar avatar-lg bg-primary flex-shrink-0", label: "Total Companies", value: "950", chartId: "total-chart" },
    { id: 2, iconClass: "ti ti-building fs-16", iconWrap: "avatar avatar-lg bg-success flex-shrink-0", label: "Active Companies", value: "920", chartId: "active-chart" },
    { id: 3, iconClass: "ti ti-building fs-16", iconWrap: "avatar avatar-lg bg-danger flex-shrink-0", label: "Inactive Companies", value: "30", chartId: "inactive-chart" },
    { id: 4, iconClass: "ti ti-map-pin-check fs-16", iconWrap: "avatar avatar-lg bg-skyblue flex-shrink-0", label: "Company Location", value: "180", chartId: "location-chart" },
  ],
  rows: [
    { id: 1, logo: "assets/img/company/company-01.svg", companyName: "BrightWave Innovations", email: "brightwave@example.com", accountUrl: "bwi.example.com", plan: "Advanced (Monthly)", createdDate: "12 Sep 2024", status: "Active", statusClass: "badge badge-success d-inline-flex align-items-center badge-xs" },
    { id: 2, logo: "assets/img/company/company-02.svg", companyName: "Stellar Dynamics", email: "stellar@example.com", accountUrl: "stellar.example.com", plan: "Enterprise (Monthly)", createdDate: "18 Sep 2024", status: "Active", statusClass: "badge badge-success d-inline-flex align-items-center badge-xs" },
    { id: 3, logo: "assets/img/company/company-03.svg", companyName: "Skyline Ventures", email: "skyline@example.com", accountUrl: "skyline.example.com", plan: "Basic (Monthly)", createdDate: "22 Sep 2024", status: "Inactive", statusClass: "badge badge-danger d-inline-flex align-items-center badge-xs" },
    { id: 4, logo: "assets/img/company/company-04.svg", companyName: "Alpha Tech Systems", email: "alpha@example.com", accountUrl: "alpha.example.com", plan: "Advanced (Monthly)", createdDate: "28 Sep 2024", status: "Active", statusClass: "badge badge-success d-inline-flex align-items-center badge-xs" },
  ],
};
