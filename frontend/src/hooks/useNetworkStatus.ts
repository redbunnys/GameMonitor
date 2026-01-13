import { useState, useEffect, useCallback } from 'react'

interface UseNetworkStatusReturn {
  isOnline: boolean
  isReconnecting: boolean
  lastOnlineTime: Date | null
  reconnect: () => void
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  )

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    setIsReconnecting(false)
    setLastOnlineTime(new Date())
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setIsReconnecting(false)
  }, [])

  const reconnect = useCallback(async () => {
    if (isReconnecting) return
    
    setIsReconnecting(true)
    
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/api/servers', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        handleOnline()
      } else {
        throw new Error('Server not responding')
      }
    } catch (error) {
      // Still offline
      window.setTimeout(() => {
        setIsReconnecting(false)
      }, 2000)
    }
  }, [isReconnecting, handleOnline])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Auto-reconnect when offline
  useEffect(() => {
    if (!isOnline && !isReconnecting) {
      const timer = window.setTimeout(() => {
        reconnect()
      }, 5000) // Try to reconnect every 5 seconds

      return () => clearTimeout(timer)
    }
  }, [isOnline, isReconnecting, reconnect])

  return {
    isOnline,
    isReconnecting,
    lastOnlineTime,
    reconnect
  }
}