import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token (will be implemented in Story 1.2)
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Add JWT token from auth store
    // const token = useAuthStore.getState().token;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
  try {
    const startTime = Date.now();
    const response = await apiClient.get('/api/health');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('Health check response:', response.data);
    console.log('Response time:', responseTime, 'ms');

    return {
      success: true,
      data: response.data,
      responseTime,
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
