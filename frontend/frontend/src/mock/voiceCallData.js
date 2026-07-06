export const voiceCallData = {
  header: {
    title: "Voice Call",
    breadcrumbs: [
      { href: "admin-dashboard.php", iconClass: "ti ti-smart-home" },
      { label: "Application" },
      { label: "Voice Call" },
    ],
  },
  call: {
    userName: "Anthony Lewis",
    statusText: "Online",
    duration: "00:24",
    avatar: "assets/img/users/user-32.jpg",
    miniAvatar: "assets/img/users/user-05.jpg",
  },
  footerButtons: [
    { id: "video", buttonClass: "btn btn-light", iconClass: "ti ti-video fs-20" },
    { id: "phone", buttonClass: "btn btn-danger", iconClass: "ti ti-phone fs-20" },
    { id: "mic", buttonClass: "btn btn-light", iconClass: "ti ti-microphone fs-20" },
  ],
};
