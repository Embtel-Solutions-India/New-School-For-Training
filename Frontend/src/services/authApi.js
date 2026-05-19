import API from "./api";

export const requestPasswordReset = (email) =>
  API.post("/auth/forgot-password", { email });

export const resetPassword = ({ token, password }) =>
  API.post("/auth/reset-password", { token, password });

export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);

export const googleAuthUrl = () =>
  `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google`;
