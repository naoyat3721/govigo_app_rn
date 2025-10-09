import * as SecureStore from 'expo-secure-store';
import authApi from '../api/authApi';

// Store authentication token
const storeToken = async (token) => {
  try {
    await SecureStore.setItemAsync('auth_token', token);
  } catch (error) {
    console.error('Error storing auth token', error);
    throw error;
  }
};

// Get authentication token
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch (error) {
    console.error('Error getting auth token', error);
    return null;
  }
};

// Remove authentication token (logout)
export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync('auth_token');
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
    console.log('API response:', response.data.token);
    if (response && response.success) {
      await storeToken(response.data.token);
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
      throw new Error('Not authenticated');
    }
    
    const userInfo = await authApi.getUserInfo();
    if (!userInfo || !userInfo.success) {
      throw new Error('Failed to fetch user info');
    }
    return userInfo.data.profile;
  } catch (error) {
    console.error('Get user info error:', error);
    throw error;
  }
}

// Auto Login function
export async function autoLogin() {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }
    
    const response = await authApi.autoLogin();
    if (response && response.success) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Auto login error:', error);
    return null;
  }
}

// Logout function
export async function logout() {
  return await removeToken();
}