import axios from 'axios';

// Base URL for the NestJS backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for auth token injection if needed
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('devbattle_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Standard response interface matching the NestJS TransformInterceptor
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  timestamp: string;
}

// Helper to extract data from the standard response
export const extractData = <T>(response: { data: ApiResponse<T> }): T => {
  return response.data.data;
};
