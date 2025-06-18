import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
