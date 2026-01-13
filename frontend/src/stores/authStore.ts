import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginCredentials } from '../types'
import { apiClient } from '../services/api'

interface AuthStore {
  isAuthenticated: boolean
  token: string | null
  username: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  checkAuthStatus: () => boolean
  setToken: (token: string | null) => void
  setUsername: (username: string | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      username: null,

      // Actions
      login: async (credentials) => {
        try {
          const response = await apiClient.login(credentials)
          const { token } = response
          
          set({ 
            isAuthenticated: true, 
            token, 
            username: credentials.username 
          })
          
          return true
        } catch (error) {
          console.error('Login failed:', error)
          set({ 
            isAuthenticated: false, 
            token: null, 
            username: null 
          })
          return false
        }
      },

      logout: () => {
        set({ 
          isAuthenticated: false, 
          token: null, 
          username: null 
        })
      },

      checkAuthStatus: () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false })
          return false
        }

        try {
          // Parse JWT token to check expiration
          const payload = JSON.parse(atob(token.split('.')[1]))
          const isExpired = payload.exp * 1000 < Date.now()
          
          if (isExpired) {
            set({ 
              isAuthenticated: false, 
              token: null, 
              username: null 
            })
            return false
          }

          set({ isAuthenticated: true })
          return true
        } catch (error) {
          set({ 
            isAuthenticated: false, 
            token: null, 
            username: null 
          })
          return false
        }
      },

      setToken: (token) => {
        set({ 
          token, 
          isAuthenticated: !!token 
        })
      },

      setUsername: (username) => {
        set({ username })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        username: state.username 
      })
    }
  )
)