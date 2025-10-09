import axios from "axios";
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Get API_URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:9000/api';

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor to add auth token to requests
axiosClient.interceptors.request.use(async (config) => {
    console.log('Adding auth token to request...', config);
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error retrieving auth token:', error);
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error);
    throw error;
  }
);

export default axiosClient;