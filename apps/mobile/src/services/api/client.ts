import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG } from '../../config/api'
import { secureStorage } from '../../utils/storage'
import { STORAGE_KEYS } from '../../config/constants'

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private failedQueue: {
    resolve: (value: unknown) => void
    reject: (error: unknown) => void
  }[] = []

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: AxiosError) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return this.client(originalRequest)
            }).catch((err) => {
              return Promise.reject(err)
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refreshToken,
              })
              
              const { accessToken } = response.data
              await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
              
              // Process failed queue
              this.processQueue(null, accessToken)
              
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
              }
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and process queue with error
            this.processQueue(refreshError, null)
            await this.clearAuthTokens()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private processQueue(error: unknown, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })
    
    this.failedQueue = []
  }

  private async clearAuthTokens() {
    try {
      await Promise.all([
        secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        secureStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ])
    } catch (error) {
      console.error('Error clearing auth tokens:', error)
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config)
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config)
  }

  async upload<T>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }

  // Method to manually set authorization header
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // Method to remove authorization header
  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization']
  }

  // Get the base URL
  getBaseURL(): string {
    return this.client.defaults.baseURL || ''
  }
}

export const apiClient = new ApiClient()