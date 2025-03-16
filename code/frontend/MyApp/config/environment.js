// Environment configuration 

// Get API URL from environment variables or use fallback for development
export const BACKEND_URL = process.env.EXPO_PUBLIC_URL;


// For easy URL composition
export const getApiUrl = (endpoint) => `${API_URL}${endpoint}`;
export const getAuthUrl = (endpoint) => `${AUTH_URL}${endpoint}`;
