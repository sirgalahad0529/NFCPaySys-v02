/**
 * API Settings Module
 * Handles storage and retrieval of API configuration
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for API URL
const API_URL_KEY = 'api_url';

// Default API URL (fallback if none is stored)
const DEFAULT_API_URL = 'http://10.0.2.2:5000/api';

/**
 * Save API URL to persistent storage
 * @param {string} url - API URL to save
 * @returns {Promise<void>}
 */
export const saveApiUrl = async (url) => {
  try {
    await AsyncStorage.setItem(API_URL_KEY, url);
    console.log('API URL saved:', url);
  } catch (error) {
    console.error('Failed to save API URL:', error);
    throw error;
  }
};

/**
 * Get API URL from persistent storage
 * @returns {Promise<string>} API URL
 */
export const getApiUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(API_URL_KEY);
    if (url) {
      return url;
    }
    
    console.log('No saved API URL found, using default:', DEFAULT_API_URL);
    return DEFAULT_API_URL;
  } catch (error) {
    console.error('Failed to get API URL:', error);
    return DEFAULT_API_URL;
  }
};

/**
 * Check if API URL is reachable
 * @param {string} url - API URL to check
 * @returns {Promise<boolean>} Whether API is reachable
 */
export const checkApiUrl = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API URL check failed:', error);
    return false;
  }
};

/**
 * Initialize API settings
 * Ensures there's a valid API URL saved
 * @returns {Promise<string>} Current API URL
 */
export const initApiSettings = async () => {
  try {
    const url = await getApiUrl();
    return url;
  } catch (error) {
    console.error('Failed to initialize API settings:', error);
    return DEFAULT_API_URL;
  }
};

export default {
  saveApiUrl,
  getApiUrl,
  checkApiUrl,
  initApiSettings,
};