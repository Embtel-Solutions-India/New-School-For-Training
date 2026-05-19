import API from "./api";

export const paymentApi = {
  getSettings: () => API.get("/payments/settings"),
  updateSettings: (payload) => API.patch("/payments/settings", payload),
  getFinancialDashboard: () => API.get("/payments/financial-dashboard"),
  updateCoursePricing: (courseId, pricing) =>
    API.patch(`/payments/courses/${courseId}/pricing`, { pricing }),
};

export default paymentApi;
