import apiClient from "./apiClient";

const budgetService = {
  getBudgetExpenses() {
    return apiClient.get("/budgets/expenses");
  },
  getBudgetRevenues() {
    return apiClient.get("/budgets/revenues");
  },
  getBudgets() {
    return apiClient.get("/budgets");
  },
};

export default budgetService;
