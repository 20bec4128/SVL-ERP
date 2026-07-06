import { callHistoryData } from "../mock/callHistoryData";
import { chatData } from "../mock/chatData";
import { citiesData } from "../mock/citiesData";
import { companiesData } from "../mock/companiesData";
import { dashboardData } from "../mock/dashboardData";
import { employeeDashboardData } from "../mock/employeeDashboardData";
import { dealsGridData } from "../mock/dealsGridData";

const resolved = (data) =>
  Promise.resolve(
    typeof structuredClone === "function"
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data)),
  );

const crmService = {
  getCallHistory() {
    return resolved(callHistoryData);
  },
  getCandidatesGrid() {
    return resolved(dashboardData);
  },
  getCategories() {
    return resolved(citiesData);
  },
  getCities() {
    return resolved(citiesData);
  },
  getClientsGrid() {
    return resolved(dashboardData);
  },
  getCompaniesGrid() {
    return resolved(companiesData);
  },
  getCompanies() {
    return resolved(companiesData);
  },
  getContactsGrid() {
    return resolved(dashboardData);
  },
  getDealsDashboard() {
    return resolved(dashboardData);
  },
  getLeadsDashboard() {
    return resolved(employeeDashboardData);
  },
  getDealsGrid() {
    return resolved(dealsGridData);
  },
  getChat() {
    return resolved(chatData);
  },
};

export default crmService;
