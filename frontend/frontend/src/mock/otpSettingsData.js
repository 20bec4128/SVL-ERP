export const otpSettingsData = {
  header: {
    title: "Settings",
    breadcrumbs: [
      { href: "dashboard.php", iconClass: "ti ti-smart-home" },
      { label: "Administration" },
      { label: "Settings" },
    ],
  },
  topTabs: [
    { label: "General Settings", href: "profile-settings.php", iconClass: "ti ti-settings me-2" },
    { label: "Website Settings", href: "bussiness-settings.php", iconClass: "ti ti-world-cog me-2" },
    { label: "App Settings", href: "salary-settings.php", iconClass: "ti ti-device-ipad-horizontal-cog me-2" },
    { label: "System Settings", href: "email-settings.php", iconClass: "ti ti-server-cog me-2", active: true },
    { label: "Financial Settings", href: "payment-gateways.php", iconClass: "ti ti-settings-dollar me-2" },
    { label: "Other Settings", href: "custom-css.php", iconClass: "ti ti-settings-2 me-2" },
  ],
  sideLinks: [
    { label: "Email Settings", href: "email-settings.php" },
    { label: "Email Templates", href: "email-template.php" },
    { label: "SMS Settings", href: "sms-settings.php" },
    { label: "SMS Templates", href: "sms-template.php" },
    { label: "OTP", href: "otp-settings.php", active: true },
    { label: "GDPR Cookies", href: "gdpr.php" },
    { label: "Maintenance Mode", href: "maintenance-mode.php" },
  ],
  form: {
    title: "OTP",
    fields: [
      { id: "otpType", label: "OTP Type", options: ["Select", "SMS", "Email"] },
      { id: "otpDigitLimit", label: "OTP Digit Limit", options: ["Select", "4", "6"] },
      { id: "otpExpireTime", label: "OTP Expire Time", options: ["Select", "5 Mins", "10 Mins"] },
    ],
  },
};
