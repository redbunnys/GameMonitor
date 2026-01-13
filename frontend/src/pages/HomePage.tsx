import React, { useEffect } from 'react'
import { useServerStore } from '../stores/serverStore'
import Dashboard from '../components/Dashboard'

const HomePage: React.FC = () => {
  const { fetchServers } = useServerStore()

  // Initial fetch
  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  return <Dashboard />
}

export default HomePage