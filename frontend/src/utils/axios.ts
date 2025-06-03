import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the token if it exists
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle global errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized - Redirect to login or refresh token");
    }
    return Promise.reject(error);
  }
);

// API wrapper with shorthand methods
const api = {
  get: <T = any>(url: string, config = {}) => instance.get<T>(url, config),
  post: <T = any>(url: string, data = {}, config = {}) => instance.post<T>(url, data, config),
  put: <T = any>(url: string, data = {}, config = {}) => instance.put<T>(url, data, config),
  delete: <T = any>(url: string, config = {}) => instance.delete<T>(url, config),
  patch: <T = any>(url: string, data = {}, config = {}) => instance.patch<T>(url, data, config),
};

export default api;
