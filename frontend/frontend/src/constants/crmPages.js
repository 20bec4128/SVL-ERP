import { PAGE_ACCESS_OPTIONS } from "./pageAccess";

export const CRM_PAGE_OPTIONS = PAGE_ACCESS_OPTIONS.filter(
  (item) => item.category === "CRM" || item.category === "Operations"
).map(({ key, label }) => ({ key, label }));
