// Environment configuration 

// Get API URL from environment variables or use fallback for development
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://18e6-218-185-248-66.ngrok-free.app/api";
export const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || "https://18e6-218-185-248-66.ngrok-free.app/auth";

// For easy URL composition
export const getApiUrl = (endpoint) => `${API_URL}${endpoint}`;
export const getAuthUrl = (endpoint) => `${AUTH_URL}${endpoint}`;
