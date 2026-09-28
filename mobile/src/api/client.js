import axios from 'axios';
import { Platform } from 'react-native';

// In React Native:
// Android Emulator uses 10.0.2.2 to access host machine
// Web or local testing uses localhost
// Physical devices can use the local machine's IP address
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => authToken;

// Interceptor for logging & handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network request failed';
    console.warn(`[API ERROR] ${error.config?.url}:`, errorMsg);
    return Promise.reject(error);
  }
);

export default api;
