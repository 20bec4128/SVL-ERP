export const dashboardData = {
  header: {
    title: "Admin Dashboard",
    breadcrumbs: [
      { href: "admin-dashboard.php", iconClass: "ti ti-smart-home", label: "Home" },
      { label: "Dashboard" },
      { label: "Admin Dashboard" },
    ],
  },
  welcome: {
    name: "Adrian",
    pendingApprovals: 21,
    leaveRequests: 14,
    avatar: "assets/img/profiles/avatar-31.jpg",
  },
  employees: [
    {
      employeeId: 1,
      employeeName: "Anthony Lewis",
      designation: "Finance",
      departmentName: "Finance",
      avatar: "assets/img/users/user-32.jpg",
    },
    {
      employeeId: 2,
      employeeName: "Brian Villalobos",
      designation: "PHP Developer",
      departmentName: "Development",
      avatar: "assets/img/users/user-09.jpg",
    },
    {
      employeeId: 3,
      employeeName: "Stephan Peralt",
      designation: "Executive",
      departmentName: "Marketing",
      avatar: "assets/img/users/user-01.jpg",
    },
    {
      employeeId: 4,
      employeeName: "Doglas Martini",
      designation: "Project Manager",
      departmentName: "Manager",
      avatar: "assets/img/users/user-24.jpg",
    },
    {
      employeeId: 5,
      employeeName: "Anthony Lewis",
      designation: "UI/UX Designer",
      departmentName: "UI/UX Design",
      avatar: "assets/img/users/user-12.jpg",
    },
  ],
  birthdays: [
    {
      label: "Today",
      items: [
        {
          employeeId: 10,
          employeeName: "Andrew Jermia",
          designation: "IOS Developer",
          avatar: "assets/img/users/user-38.jpg",
        },
      ],
    },
    {
      label: "Tomorrow",
      items: [
        {
          employeeId: 11,
          employeeName: "Mary Zeen",
          designation: "UI/UX Designer",
          avatar: "assets/img/users/user-10.jpg",
        },
        {
          employeeId: 12,
          employeeName: "Antony Lewis",
          designation: "Android Developer",
          avatar: "assets/img/users/user-09.jpg",
        },
      ],
    },
    {
      label: "25 Jan 2025",
      items: [
        {
          employeeId: 13,
          employeeName: "Doglas Martini",
          designation: ".Net Developer",
          avatar: "assets/img/users/user-12.jpg",
        },
      ],
    },
  ],
  topStats: [
    { id: 1, iconBg: "bg-primary", icon: "ti ti-calendar-share fs-16", title: "Attendance Overview", value: "120/154", trendClass: "text-success", trendIcon: "fa-solid fa-caret-up me-1", trend: "+2.1%", link: "attendance-employee.php", linkLabel: "View Details" },
    { id: 2, iconBg: "bg-secondary", icon: "ti ti-browser fs-16", title: "Total No of Project's", value: "90/125", trendClass: "text-danger", trendIcon: "fa-solid fa-caret-down me-1", trend: "-2.1%", link: "projects.php", linkLabel: "View All" },
    { id: 3, iconBg: "bg-info", icon: "ti ti-users-group fs-16", title: "Total No of Clients", value: "69/86", trendClass: "text-danger", trendIcon: "fa-solid fa-caret-down me-1", trend: "-11.2%", link: "clients.php", linkLabel: "View All" },
    { id: 4, iconBg: "bg-pink", icon: "ti ti-checklist fs-16", title: "Total No of Tasks", value: "225/28", trendClass: "text-success", trendIcon: "fa-solid fa-caret-down me-1", trend: "+11.2%", link: "tasks.php", linkLabel: "View All" },
    { id: 5, iconBg: "bg-purple", icon: "ti ti-moneybag fs-16", title: "Earnings", value: "$21445", trendClass: "text-success", trendIcon: "fa-solid fa-caret-up me-1", trend: "+10.2%", link: "expenses.php", linkLabel: "View All" },
    { id: 6, iconBg: "bg-danger", icon: "ti ti-browser fs-16", title: "Profit This Week", value: "$5,544", trendClass: "text-success", trendIcon: "fa-solid fa-caret-up me-1", trend: "+2.1%", link: "purchase-transaction.php", linkLabel: "View All" },
    { id: 7, iconBg: "bg-success", icon: "ti ti-users-group fs-16", title: "Job Applicants", value: "98", trendClass: "text-success", trendIcon: "fa-solid fa-caret-up me-1", trend: "+2.1%", link: "job-list.php", linkLabel: "View All" },
    { id: 8, iconBg: "bg-dark", icon: "ti ti-user-star fs-16", title: "New Hire", value: "45/48", trendClass: "text-danger", trendIcon: "fa-solid fa-caret-down me-1", trend: "-11.2%", link: "candidates.php", linkLabel: "View All" },
  ],
};
