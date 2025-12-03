import { Buffer } from 'buffer'; // For base64 decoding
import * as SecureStore from 'expo-secure-store';
import authApi from '../api/authApi';

// Check if JWT token has expired
const isTokenExpired = (token) => {
  try {
    // Split the token into parts
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid token format');
      return true; // Consider invalid tokens as expired
    }
    
    // Decode the payload (second part) - using Buffer for base64 decoding
    const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const paddedBase64Payload = base64Payload.padEnd(base64Payload.length + (4 - (base64Payload.length % 4)) % 4, '=');
    const decodedPayload = Buffer.from(paddedBase64Payload, 'base64').toString('utf8');
    const payload = JSON.parse(decodedPayload);
    
    // Check if the payload has an expiration time
    if (!payload.exp) {
      console.warn('Token does not contain expiration information');
      return false; // Cannot determine expiration without exp claim
    }
    
    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Compare with token expiration time
    const isExpired = payload.exp < currentTime;
    
    if (isExpired) {
      console.log('Token expired at:', new Date(payload.exp * 1000).toLocaleString());
      console.log('Current time:', new Date().toLocaleString());
    }
    
    return isExpired;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider tokens that can't be parsed as expired
  }
};

// Store authentication token
const storeToken = async (token) => {
  try {
    await SecureStore.setItemAsync('auth_token', token);
  } catch (error) {
    console.error('Error storing auth token', error);
    throw error;
  }
};

// Store session info (session_id, session_name, cookie_domain)
const storeSessionInfo = async (sessionInfo) => {
  try {
    await SecureStore.setItemAsync('session_info', JSON.stringify(sessionInfo));
  } catch (error) {
    console.error('Error storing session info', error);
    throw error;
  }
};

// Get session info
export const getSessionInfo = async () => {
  try {
    const sessionInfoStr = await SecureStore.getItemAsync('session_info');
    if (!sessionInfoStr) {
      return null;
    }
    return JSON.parse(sessionInfoStr);
  } catch (error) {
    console.error('Error getting session info', error);
    return null;
  }
};

// Remove session info
const removeSessionInfo = async () => {
  try {
    await SecureStore.deleteItemAsync('session_info');
  } catch (error) {
    console.error('Error removing session info', error);
  }
};

// Get authentication token
export const getToken = async () => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      console.warn('No authentication token found');
      redirectToLogin();
      return null;
    }
    
    // You could add token expiration check here if your token includes expiration data
    // For example, if using JWT tokens:
    if (isTokenExpired(token)) {
      console.warn('Token has expired');
      await removeToken();
      redirectToLogin();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token', error);
    redirectToLogin();
    return null;
  }
};

// Helper function to redirect to login
const redirectToLogin = () => {
  // We need to use setTimeout to ensure this runs after the current execution context
  setTimeout(() => {
    try {
      // Using window.location ensures this works even outside the React component context
      const router = require('expo-router');
      router.router.replace('/screens/LoginScreen');
    } catch (error) {
      console.error('Failed to redirect to login:', error);
    }
  }, 0);
};

// Remove authentication token (logout)
export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync('auth_token');
    await removeSessionInfo(); // Also remove session info
    return true;
  } catch (error) {
    console.error('Error removing auth token', error);
    return false;
  }
};

// Login function
export async function login(email, password) {
  console.log('authService login called with:', email, password);
  try {
    const response = await authApi.login(email, password);
    console.log('API response:', response);
    if (response && response.success) {
      // Store token
      await storeToken(response.data.token);
      
      // Store session info if available
      if (response.data.session) {
        await storeSessionInfo(response.data.session);
        console.log('Session info stored:', response.data.session);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// Get user information
export async function getUserInfo() {
  try {
    const token = await getToken();
    if (!token) {
      // getToken already handles the redirect if token is null
      throw new Error('Not authenticated');
    }
    
    const userInfo = await authApi.getUserInfo();
    if (!userInfo || !userInfo.success) {
      // API returned a failure response, which may indicate an invalid token
      console.warn('Failed to fetch user info - token may be invalid');
      await removeToken(); // Remove potentially invalid token
      redirectToLogin();
      throw new Error('Failed to fetch user info');
    }
    return userInfo.data.profile;
  } catch (error) {
    console.error('Get user info error:', error);
    
    // Check if this is an authentication error
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Authentication error while fetching user info');
      await removeToken(); // Remove invalid token
      redirectToLogin();
    }
    
    throw error;
  }
}

// Auto Login function
export async function autoLogin() {
  try {
    const token = await getToken();
    if (!token) {
      // getToken already handles the redirect if token is null
      return null;
    }
    
    const response = await authApi.autoLogin();
    if (response && response.success) {
      return response.data;
    }
    
    // If auto login failed even with a token, it means the token is likely invalid
    console.warn('Auto login failed with existing token');
    await removeToken(); // Remove the invalid token
    redirectToLogin();
    return null;
  } catch (error) {
    console.error('Auto login error:', error);
    await removeToken(); // Remove potentially invalid token
    redirectToLogin();
    return null;
  }
}

// Logout function
export async function logout() {
  return await removeToken();
}