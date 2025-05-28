import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with custom config
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
    withCredentials: true, // Important for handling cookies in authentication
});

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            window.location.href = '/signin';
        } else if (error.response?.status === 403) {
            alert('You are not authorized to access this page');
        } else if (error.response?.status === 400) {
            alert('Bad Request');
        } else if (error.response?.status === 500) {
            const errorData = error.response?.data as { errorMessage?: string } | undefined;
            const errorMessage = errorData?.errorMessage || 'Unknown error';
            const errorParts = errorMessage.split(':');
            const finalMessage = errorParts[errorParts.length - 1].trim();
            alert(finalMessage);
        }

        return Promise.reject(error);
    }
);

export default api; 