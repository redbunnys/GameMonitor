import axios, { type AxiosInstance, type AxiosResponse, AxiosError } from 'axios'
import type { 
  ApiResponse, 
  ServerWithStatus, 
  LoginCredentials, 
  LoginResponse,
  Server,
  CreateServerRequest,
  UpdateServerRequest
} from '../types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && originalRequest) {
          // Clear stored token
          this.clearStoredToken()
          
          // Redirect to login if not already on login page
          if (!window.location.pathname.includes('/admin/login')) {
            window.location.href = '/admin/login'
          }
        }

        // Handle network errors
        if (!error.response) {
          return Promise.reject(new Error('Network error: Please check your connection'))
        }

        // Handle other HTTP errors
        const errorMessage = (error.response.data as any)?.error || 
                           (error.response.data as any)?.message || 
                           `HTTP ${error.response.status}: ${error.response.statusText}`
        
        return Promise.reject(new Error(errorMessage))
      }
    )
  }

  private getStoredToken(): string | null {
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        return parsed.state?.token || null
      }
    } catch (error) {
      console.error('Error reading token from storage:', error)
    }
    return null
  }

  private clearStoredToken(): void {
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        if (parsed.state) {
          parsed.state.token = null
          parsed.state.isAuthenticated = false
          parsed.state.username = null
          localStorage.setItem('auth-storage', JSON.stringify(parsed))
        }
      }
    } catch (error) {
      console.error('Error clearing token from storage:', error)
    }
  }

  // Public API methods
  async getServers(): Promise<ServerWithStatus[]> {
    try {
      const response = await this.client.get<ApiResponse<ServerWithStatus[]>>('/servers')
      return response.data.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch servers')
    }
  }

  async getServerById(id: number): Promise<ServerWithStatus> {
    try {
      const response = await this.client.get<ApiResponse<ServerWithStatus>>(`/servers/${id}`)
      return response.data.data
    } catch (error) {
      throw this.handleError(error, `Failed to fetch server ${id}`)
    }
  }

  // Auth API methods
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
      return response.data.data
    } catch (error) {
      throw this.handleError(error, 'Login failed')
    }
  }

  // Admin API methods
  async getAdminServers(): Promise<Server[]> {
    try {
      const response = await this.client.get<ApiResponse<Server[]>>('/admin/servers')
      return response.data.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch admin servers')
    }
  }

  async createServer(serverData: CreateServerRequest): Promise<Server> {
    try {
      const response = await this.client.post<ApiResponse<Server>>('/admin/servers', serverData)
      return response.data.data
    } catch (error) {
      throw this.handleError(error, 'Failed to create server')
    }
  }

  async updateServer(id: number, serverData: UpdateServerRequest): Promise<Server> {
    try {
      const response = await this.client.put<ApiResponse<Server>>(`/admin/servers/${id}`, serverData)
      return response.data.data
    } catch (error) {
      throw this.handleError(error, `Failed to update server ${id}`)
    }
  }

  async deleteServer(id: number): Promise<void> {
    try {
      await this.client.delete(`/admin/servers/${id}`)
    } catch (error) {
      throw this.handleError(error, `Failed to delete server ${id}`)
    }
  }

  private handleError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error
    }
    return new Error(defaultMessage)
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()
export default apiClient