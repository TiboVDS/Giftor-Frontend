import axios from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const session = useAuthStore.getState().session;
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.message);
    } else {
      console.error('Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Health check function for testing
export const testHealth = async () => {
  console.log('=== Starting Health Check ===');
  console.log('Base URL:', process.env.EXPO_PUBLIC_API_URL);

  try {
    const startTime = Date.now();
    console.log('Making GET request to /api/health...');

    const response = await apiClient.get('/api/health');

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('✅ Health check SUCCESS');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Response time:', responseTime, 'ms');
    console.log('=== Health Check Complete ===');

    return {
      success: true,
      data: response.data,
      responseTime,
    };
  } catch (error) {
    console.log('❌ Health check FAILED');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');

    if (axios.isAxiosError(error)) {
      console.error('Axios error details:');
      console.error('- Response status:', error.response?.status);
      console.error('- Response data:', error.response?.data);
      console.error('- Request URL:', error.config?.url);
      console.error('- Base URL:', error.config?.baseURL);
    }

    console.log('=== Health Check Complete (with errors) ===');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
