import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

let getAccessToken = () => null;
let onSessionRefresh = () => {};
let onSessionExpired = () => {};
let refreshPromise = null;

export const configureAuthInterceptors = (handlers) => {
  getAccessToken = handlers.getAccessToken;
  onSessionRefresh = handlers.onSessionRefresh;
  onSessionExpired = handlers.onSessionExpired;
};

API.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    console.debug("[auth] API request", {
      method: config.method,
      url: config.url,
      hasAccessToken: Boolean(token),
    });
  }

  return config;
});

const isAuthEndpoint = (url = "") =>
  ["/auth/login", "/auth/signup", "/auth/logout", "/auth/refresh"].some((path) =>
    url.includes(path)
  );

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = API.post("/auth/refresh", undefined, {
      skipAuthRefresh: true,
    })
      .then(({ data }) => {
        onSessionRefresh(data.user, data.accessToken);
        if (import.meta.env.DEV) {
          console.debug("[auth] Refresh succeeded", {
            userId: data.user?._id,
            role: data.user?.role,
            accountStatus: data.user?.accountStatus,
          });
        }
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    if (
      error.response.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.skipAuthRefresh &&
      !isAuthEndpoint(originalRequest?.url)
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return API(originalRequest);
      } catch (refreshError) {
        console.warn("[auth] Refresh failed after protected API 401:", {
          status: refreshError.response?.status,
          data: refreshError.response?.data,
        });

        onSessionExpired();

        return Promise.reject(refreshError);
      }
    }

    if (import.meta.env.DEV && error.response?.status === 401) {
      console.warn("[auth] 401 response without refresh attempt:", {
        url: originalRequest?.url,
        status: error.response.status,
        data: error.response.data,
      });
    }

    return Promise.reject(error);
  }
);

export default API;
