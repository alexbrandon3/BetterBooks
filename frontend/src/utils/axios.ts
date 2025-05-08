// src/utils/axios.ts
import axios from "axios";

const instance = axios.create({
  baseURL: "",
  timeout: 10000, // ✅ 10-second timeout to prevent hanging
});

instance.interceptors.request.use(
  (config) => {
    // Automatically prepend /api if missing
    if (config.url && !config.url.startsWith("/api")) {
      config.url = `/api${config.url}`;
    }
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `❌ Response Error [${error.response.status}]:`,
        error.response.data.message
      );
    } else if (error.request) {
      console.error("❌ No Response from Server:", error.message);
    } else {
      console.error("❌ Unexpected Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
