/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore } from '@/stores/authStore';
import { AuthTokens } from '@/types/auth';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';


// Define the ApiResponse type
interface ApiResponse<T> {
    data?: T;
    error?: string;
    status?: number;
}

// Define error response shape (adjust based on your backend)
interface ApiErrorResponse {
    message?: string;
}

// Utility function to handle errors
const handleApiError = (error: AxiosError<ApiErrorResponse>): ApiResponse<never> => {
    if (error.response) {
        const { status, data } = error.response;
        const errorMessage = data?.message || `Request failed with status ${status}`;
        return { error: errorMessage, status };
    } else if (error.request) {
        return { error: 'No response from server. Please check your network connection.' };
    } else {
        return { error: error.message || 'An unexpected error occurred.' };
    }
};

//const API_BASE_URL = 'https://server.qubdrive.com/api';
const API_BASE_URL = 'http://localhost:5001/api';
// API client class
class ApiClient {
    private axiosInstance: AxiosInstance;


    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor for token handling
        this.axiosInstance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
                // Skip authentication for login, registration, and password reset endpoints
                const skipAuthPaths = [
                    '/auth/login',
                    '/registration/',
                    '/auth/password-reset/',
                    '/auth/refresh'
                ];

                const isAuthSkipPath = skipAuthPaths.some(path => config.url?.includes(path));

                if (isAuthSkipPath) {
                    return config;
                }

                const { accessToken, isTokenExpired } = useAuthStore.getState();

                console.log(" 000000000 GGGGGGGGGGGGGGGGGGG 0000000000000 ")
                console.log(isTokenExpired())
                console.log(accessToken)
                console.log(" 000000000 GGGGGGGGGGGGGGGGGGG 0000000000000 ")

                if (accessToken && !isTokenExpired()) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${accessToken}`;
                } else if (accessToken && isTokenExpired()) {
                    // Token is expired, redirect to login
                    useAuthStore.getState().reset();
                    throw new Error('Token expired, please log in again');
                }
                // For protected routes without a token, let the backend handle the 401

                return config;
            },
            (error) => Promise.reject(error),
        );
        // Response interceptor for handling 401 errors
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Skip redirect for login-related endpoints - let the component handle the error
                    const skipRedirectPaths = [
                        '/auth/login',
                        '/registration/',
                        '/auth/password-reset/',
                    ];

                    const isSkipRedirectPath = skipRedirectPaths.some(path =>
                        error.config?.url?.includes(path)
                    );

                    if (!isSkipRedirectPath) {
                        useAuthStore.getState().reset();
                        window.location.href = '/sign-in';
                    }
                }
                return Promise.reject(error);
            },
        );
    }


    // Update tokens in auth store
    updateTokens(tokens: AuthTokens, _remember: boolean = false): void {
        const { setAccessToken } = useAuthStore.getState();
        setAccessToken(tokens.accessToken);
    }

    // Check if token is expired
    isTokenExpired(): boolean {
        return useAuthStore.getState().isTokenExpired();
    }

    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.get<T>(url, config);
            return { data: response.data, status: response.status };
        } catch (error) {
            return handleApiError(error as AxiosError<ApiErrorResponse>);
        }
    }


    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.post<T>(url, data, config);

            return { data: response.data, status: response.status };
        } catch (error) {

            // console.log(" +++++++++++++++++++++ ")
            // console.log(error)
            // console.log(" +++++++++++++++++++++ ")

            return handleApiError(error as AxiosError<ApiErrorResponse>);
        }
    }


    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.put<T>(url, data, config);
            return { data: response.data, status: response.status };
        } catch (error) {
            return handleApiError(error as AxiosError<ApiErrorResponse>);
        }
    }


    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.patch<T>(url, data, config);
            return { data: response.data, status: response.status };
        } catch (error) {
            return handleApiError(error as AxiosError<ApiErrorResponse>);
        }
    }


    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.delete<T>(url, config);
            return { data: response.data, status: response.status };
        } catch (error) {
            return handleApiError(error as AxiosError<ApiErrorResponse>);
        }
    }

    async upload<T = any>(
        url: string,
        formData: FormData,
        onProgress?: (progress: number) => void,
    ): Promise<ApiResponse<T>> {
        try {

            const response = await this.axiosInstance.post<T>(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(progress);
                    }
                },
            });
            return { data: response.data, status: response.status };
        } catch (error) {
            return handleApiError(error as AxiosError<ApiErrorResponse>);
        }
    }
}

// Create and export the API client instance
export const apiClient = new ApiClient();