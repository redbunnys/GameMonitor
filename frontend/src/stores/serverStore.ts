import { create } from 'zustand'
import type { ServerWithStatus } from '../types'
import { apiClient } from '../services/api'

interface ServerStore {
  servers: ServerWithStatus[]
  loading: boolean
  error: string | null
  
  // Actions
  setServers: (servers: ServerWithStatus[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchServers: () => Promise<void>
  refreshServerStatus: () => Promise<void>
  getServerById: (id: number) => ServerWithStatus | undefined
  clearError: () => void
}

export const useServerStore = create<ServerStore>((set, get) => ({
  servers: [],
  loading: false,
  error: null,

  // Actions
  setServers: (servers) => set({ servers }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  fetchServers: async () => {
    set({ loading: true, error: null })
    try {
      const servers = await apiClient.getServers()
      set({ servers, loading: false })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch servers' 
      })
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