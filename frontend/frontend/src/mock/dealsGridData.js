export const dealsGridData = {
  header: {
    title: "Deals",
    breadcrumbs: [
      { href: "admin-dashboard.php", iconClass: "ti ti-smart-home", label: "Home" },
      { label: "CRM" },
      { label: "Deals Grid" },
    ],
  },
  columns: [
    {
      id: 1,
      title: "New",
      total: "03 Deals - $16,90,000",
      colorClass: "border-purple",
      deals: [
        { id: 11, initials: "WR", name: "Website Redesign", amount: "$4,50,000", email: "web@example.com", phone: "(163) 2459 315", location: "Newyork, United States", owner: "Sharon Roy", ownerAvatar: "assets/img/profiles/avatar-20.jpg", progress: "85%", date: "10 Jan 2024" },
        { id: 12, initials: "CB", name: "Cloud Backup", amount: "$5,00,000", email: "cloud@example.com", phone: "(146) 1249 296", location: "Exeter, United States", owner: "Darlee Robertson", ownerAvatar: "assets/img/profiles/avatar-20.jpg", progress: "15%", date: "12 Jan 2024" },
      ],
    },
  ],
};
