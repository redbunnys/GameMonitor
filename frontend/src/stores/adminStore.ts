import { create } from 'zustand'
import type { Server, CreateServerRequest, UpdateServerRequest } from '../types'
import { apiClient } from '../services/api'

interface AdminStore {
  servers: Server[]
  loading: boolean
  error: string | null
  
  // Actions
  setServers: (servers: Server[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addServer: (server: CreateServerRequest) => Promise<void>
  updateServer: (id: number, server: UpdateServerRequest) => Promise<void>
  deleteServer: (id: number) => Promise<void>
  fetchAdminServers: () => Promise<void>
  clearError: () => void
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  servers: [],
  loading: false,
  error: null,

  // Actions
  setServers: (servers) => set({ servers }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  fetchAdminServers: async () => {
    set({ loading: true, error: null })
    try {
      const servers = await apiClient.getAdminServers()
      set({ servers, loading: false })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch servers' 
      })
    }
  },

  addServer: async (serverData) => {
    set({ loading: true, error: null })
    try {
      const newServer = await apiClient.createServer(serverData)
      const { servers } = get()
      set({ 
        servers: [...servers, newServer], 
        loading: false 
      })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to add server' 
      })
      throw error
    }
  },

  updateServer: async (id, serverData) => {
    set({ loading: true, error: null })
    try {
      const updatedServer = await apiClient.updateServer(id, serverData)
      const { servers } = get()
      set({ 
        servers: servers.map(server => 
          server.id === id ? updatedServer : server
        ), 
        loading: false 
      })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to update server' 
      })
      throw error
    }
  },

  deleteServer: async (id) => {
    set({ loading: true, error: null })
    try {
      await apiClient.deleteServer(id)
      const { servers } = get()
      set({ 
        servers: servers.filter(server => server.id !== id), 
        loading: false 
      })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to delete server' 
      })
      throw error
    }
  }
}))