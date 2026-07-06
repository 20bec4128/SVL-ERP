export const outgoingCallData = {
  header: {
    title: "Outgoing Call",
    breadcrumbs: [
      { href: "admin-dashboard.php", iconClass: "ti ti-smart-home" },
      { label: "Application" },
      { label: "Outgoing Call" },
    ],
  },
  caller: {
    name: "Anthony Lewis",
    statusText: "Calling...",
    avatar: "assets/img/users/user-32.jpg",
  },
  actionButtons: [
    { id: "video", buttonClass: "btn btn-light", iconClass: "ti ti-video fs-20" },
    { id: "mic", buttonClass: "btn btn-light", iconClass: "ti ti-microphone fs-20" },
    { id: "hangup", buttonClass: "btn btn-danger", iconClass: "ti ti-phone-off fs-20" },
    { id: "add-user", buttonClass: "btn btn-light", iconClass: "ti ti-user-plus fs-20" },
    { id: "volume", buttonClass: "btn btn-light", iconClass: "ti ti-volume fs-20" },
  ],
};
