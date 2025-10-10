import axios from "axios";
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Get API_URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:9000/api';
console.log('API_URL', API_URL);
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor to add auth token to requests
axiosClient.interceptors.request.use(async (config) => {
  try {
    // Construct full URL for logging
    const fullUrl = new URL(config.url || '', config.baseURL || API_URL);
    
    // Add query params to URL for logging
    if (config.params) {
      Object.keys(config.params).forEach(key => {
        fullUrl.searchParams.append(key, config.params[key]);
      });
    }
    
    // Create a visually distinct log for better visibility in console
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 API REQUEST: ${config.method?.toUpperCase()} ${fullUrl.toString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Auth token: Bearer [TOKEN]');
    } else {
      console.log('⚠️  No auth token found');
    }
    
    // Log request body if present
    if (config.data) {
      console.log('📦 Request body:');
      console.log(JSON.stringify(config.data, null, 2));
    }
    
    // Log request params separately for clarity
    if (config.params) {
      console.log('🔍 Request params:');
      console.log(JSON.stringify(config.params, null, 2));
    }
    
    console.log('Sending request...');
  } catch (error) {
    // Only log errors to console without throwing
    console.error('❌ Error in request interceptor:', error);
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    // Log successful responses
    const fullUrl = new URL(response.config.url || '', response.config.baseURL || API_URL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ API RESPONSE SUCCESS: ${response.config.method?.toUpperCase()} ${fullUrl.toString()}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  },
  (error) => {
    // Log detailed error information
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ API RESPONSE ERROR');
    
    const fullUrl = error?.config?.url 
      ? new URL(error.config.url, error.config.baseURL || API_URL).toString()
      : 'Unknown URL';

    console.error(`🔗 Request URL: ${fullUrl}`);
    console.error(`🔧 Request Method: ${error?.config?.method?.toUpperCase() || 'Unknown'}`);
    
    if (error?.config?.data) {
      try {
        console.error('📦 Request Data:');
        const parsedData = typeof error.config.data === 'string' 
          ? JSON.parse(error.config.data) 
          : error.config.data;
        console.error(JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.error('📦 Request Data (raw):', error.config.data);
      }
    }
    
    if (error.response) {
      // Server responded with an error status
      console.log('Response Data error:', error.response);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Reject with a structured error object
      return Promise.reject({
        success: false,
        status: error.response.status,
        message: error.response.data?.message || error.response.statusText || 'Server error',
        data: error.response.data,
        error: error.response.data?.error || null
      });
    } else if (error.request) {
      // Request was made but no response received (network error, timeout, etc.)
      console.error('⚠️ No response received from server');
      console.error('⚠️ Possible causes: Network error, timeout, or server is down');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return Promise.reject({
        success: false,
        status: null,
        message: 'Network error. Please check your connection and try again.',
        data: null,
        error: 'NETWORK_ERROR'
      });
    } else {
      // Something happened in setting up the request
      console.error(`⚠️ Error message: ${error.message}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return Promise.reject({
        success: false,
        status: null,
        message: error.message || 'An unexpected error occurred',
        data: null,
        error: 'REQUEST_SETUP_ERROR'
      });
    }
  }
);

export default axiosClient;