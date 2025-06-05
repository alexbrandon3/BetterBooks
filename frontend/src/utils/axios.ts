const axios = require("axios");

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the token if it exists
instance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle global errors
instance.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized - Redirect to login or refresh token");
    }
    return Promise.reject(error);
  }
);

// API wrapper with shorthand methods
const api = {
  get: (url: string, config = {}) => instance.get(url, config),
  post: (url: string, data = {}, config = {}) => instance.post(url, data, config),
  put: (url: string, data = {}, config = {}) => instance.put(url, data, config),
  delete: (url: string, config = {}) => instance.delete(url, config),
  patch: (url: string, data = {}, config = {}) => instance.patch(url, data, config),
};

export default api;
export { instance };
