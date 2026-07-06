export const calendarData = {
  header: {
    title: "Calendar",
    breadcrumbs: [
      { href: "admin-dashboard.php", iconClass: "ti ti-smart-home", label: "Home" },
      { label: "Application" },
      { label: "Calendar" },
    ],
  },
  externalEvents: [
    { id: 1, title: "Team Events", cardClass: "fc-event bg-transparent-success mb-1", iconClass: "ti ti-square-rounded text-success me-2", eventClassName: "bg-transparent-success" },
    { id: 2, title: "Work", cardClass: "fc-event bg-transparent-warning mb-1", iconClass: "ti ti-square-rounded text-warning me-2", eventClassName: "bg-transparent-warning" },
    { id: 3, title: "External", cardClass: "fc-event bg-transparent-danger mb-1", iconClass: "ti ti-square-rounded text-danger me-2", eventClassName: "bg-transparent-danger" },
    { id: 4, title: "Projects", cardClass: "fc-event bg-transparent-skyblue mb-1", iconClass: "ti ti-square-rounded text-skyblue me-2", eventClassName: "bg-transparent-skyblue" },
    { id: 5, title: "Applications", cardClass: "fc-event bg-transparent-purple mb-1", iconClass: "ti ti-square-rounded text-purple me-2", eventClassName: "bg-transparent-purple" },
    { id: 6, title: "Desgin", cardClass: "fc-event bg-transparent-info mb-0", iconClass: "ti ti-square-rounded text-info me-2", eventClassName: "bg-transparent-info" },
  ],
  upcomingEventCount: "15",
  upcomingEvents: [
    { id: 1, title: "Meeting with Team Dev", date: "15 Mar 2025", borderClass: "border-start border-purple border-3 mb-3" },
    { id: 2, title: "Design System With Client", date: "24 Mar 2025", borderClass: "border-start border-pink border-3 mb-3" },
    { id: 3, title: "UI/UX Team Call", date: "28 Mar 2025", borderClass: "border-start border-success border-3 mb-3" },
  ],
  upgrade: {
    title: "Enjoy Unlimited Access on a small price monthly.",
    buttonText: "Upgrade Now",
    rightBg: "assets/img/bg/email-bg-01.png",
    leftBg: "assets/img/bg/email-bg-02.png",
  },
};
