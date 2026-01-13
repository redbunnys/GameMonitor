import { create } from 'zustand'
import type { ServerWithStatus } from '../types'
import { apiClient } from '../services/api'

interface ServerStore {
  servers: ServerWithStatus[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  retryCount: number
  isRetrying: boolean
  
  // Actions
  setServers: (servers: ServerWithStatus[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastUpdated: (date: Date) => void
  setRetryCount: (count: number) => void
  setIsRetrying: (retrying: boolean) => void
  fetchServers: () => Promise<void>
  fetchServersWithRetry: (maxRetries?: number) => Promise<void>
  refreshServerStatus: () => Promise<void>
  getServerById: (id: number) => ServerWithStatus | undefined
  clearError: () => void
}

// 请求去重：防止同时发起多个相同请求
let currentFetchPromise: Promise<ServerWithStatus[]> | null = null

export const useServerStore = create<ServerStore>((set, get) => ({
  servers: [],
  loading: false,
  error: null,
  lastUpdated: null,
  retryCount: 0,
  isRetrying: false,

  // Actions
  setServers: (servers) => set({ servers }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setLastUpdated: (date) => set({ lastUpdated: date }),
  
  setRetryCount: (count) => set({ retryCount: count }),
  
  setIsRetrying: (retrying) => set({ isRetrying: retrying }),
  
  clearError: () => set({ error: null, retryCount: 0 }),

  fetchServers: async () => {
    // 如果已有请求在进行中，等待其完成
    if (currentFetchPromise) {
      try {
        const servers = await currentFetchPromise
        set({ 
          servers, 
          loading: false, 
          lastUpdated: new Date(),
          retryCount: 0,
          isRetrying: false,
          error: null
        })
        return
      } catch (error) {
        // 如果当前请求失败，继续执行新请求
      }
    }

    set({ loading: true, error: null })
    
    // 创建新的请求Promise
    currentFetchPromise = apiClient.getServers()
    
    try {
      const servers = await currentFetchPromise
      set({ 
        servers, 
        loading: false, 
        lastUpdated: new Date(),
        retryCount: 0,
        isRetrying: false
      })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch servers',
        isRetrying: false
      })
      throw error
    } finally {
      currentFetchPromise = null
    }
  },

  fetchServersWithRetry: async (maxRetries = 3) => {
    const { retryCount, isRetrying } = get()
    
    // 防止重复重试
    if (isRetrying) {
      return
    }
    
    if (retryCount >= maxRetries) {
      set({ 
        error: `Failed to fetch servers after ${maxRetries} attempts. Please check your network connection.`,
        isRetrying: false
      })
      return
    }

    set({ isRetrying: true })
    
    try {
      const servers = await apiClient.getServers()
      set({ 
        servers, 
        loading: false, 
        lastUpdated: new Date(),
        retryCount: 0,
        isRetrying: false,
        error: null
      })
    } catch (error) {
      const newRetryCount = retryCount + 1
      set({ retryCount: newRetryCount })
      
      if (newRetryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, newRetryCount - 1) * 1000
        console.log(`Retrying in ${delay}ms (attempt ${newRetryCount}/${maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // 递归重试，但要检查状态
        const currentState = get()
        if (currentState.isRetrying && currentState.retryCount === newRetryCount) {
          await get().fetchServersWithRetry(maxRetries)
        }
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch servers',
          isRetrying: false
        })
      }
    }
  },

  refreshServerStatus: async () => {
    const { fetchServers } = get()
    await fetchServers()
  },

  getServerById: (id) => {
    const { servers } = get()
    return servers.find(server => server.id === id)
  }
}))