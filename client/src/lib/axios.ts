import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");
    const isLoginCall = originalRequest.url?.includes("/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall && !isLoginCall) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — user needs to log in again
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
