export const callHistoryData = {
  header: {
    title: "Call History",
    breadcrumbs: [
      { href: "admin-dashboard.php", iconClass: "ti ti-smart-home", label: "Home" },
      { label: "Application" },
      { label: "Call History" },
    ],
  },
  tableRows: [
    { id: 1, avatar: "assets/img/users/user-32.jpg", name: "Anthony Lewis", email: "anthony@example.com", phone: "(123) 4567 890", callType: "Incoming", callIcon: "ti ti-phone-incoming text-success me-2", duration: "00.25", dateTime: "14 Jan 2024, 04:27 AM" },
    { id: 2, avatar: "assets/img/users/user-09.jpg", name: "Brian Villalobos", email: "brian@example.com", phone: "(179) 7382 829", callType: "Outgoing", callIcon: "ti ti-phone-outgoing text-success me-2", duration: "00.10", dateTime: "21 Jan 2024, 03:19 AM" },
    { id: 3, avatar: "assets/img/users/user-01.jpg", name: "Harvey Smith", email: "harvey@example.com", phone: "(184) 2719 738", callType: "Incoming", callIcon: "ti ti-video text-success me-2", duration: "00.40", dateTime: "20 Feb 2024, 12:15 PM" },
    { id: 4, avatar: "assets/img/users/user-33.jpg", name: "Douglas Martini", email: "douglas@example.com", phone: "(183) 9302 890", callType: "Missed Call", callIcon: "ti ti-phone-x text-danger me-2", duration: "00.00", dateTime: "15 Mar 2024, 12:11 AM" },
  ],
};
