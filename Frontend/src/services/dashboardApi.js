import API from "./api";

export const dashboardApi = {
  getSummary: () => API.get("/dashboard/summary"),
  getPermissions: () => API.get("/dashboard/permissions"),
};

export default dashboardApi;
