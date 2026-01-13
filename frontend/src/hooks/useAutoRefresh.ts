import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAutoRefreshOptions {
  interval?: number // in milliseconds
  enabled?: boolean
  onRefresh: () => Promise<void>
  onError?: (error: Error) => void
}

interface UseAutoRefreshReturn {
  isEnabled: boolean
  lastRefresh: Date | null
  nextRefresh: Date | null
  timeUntilNextRefresh: number
  toggle: () => void
  enable: () => void
  disable: () => void
  refreshNow: () => Promise<void>
}

export const useAutoRefresh = ({
  interval = 30000, // 30 seconds default
  enabled = true,
  onRefresh,
  onError
}: UseAutoRefreshOptions): UseAutoRefreshReturn => {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [nextRefresh, setNextRefresh] = useState<Date | null>(null)
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(0)
  
  const intervalRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const isRefreshingRef = useRef(false)

  // Update countdown timer
  const updateCountdown = useCallback(() => {
    if (nextRefresh) {
      const now = new Date()
      const remaining = Math.max(0, nextRefresh.getTime() - now.getTime())
      setTimeUntilNextRefresh(remaining)
      
      if (remaining > 0) {
        countdownRef.current = window.setTimeout(updateCountdown, 1000)
      }
    }
  }, [nextRefresh])

  // Refresh function with error handling
  const refreshNow = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    isRefreshingRef.current = true
    const refreshTime = new Date()
    
    try {
      await onRefresh()
      setLastRefresh(refreshTime)
      
      if (isEnabled) {
        const next = new Date(refreshTime.getTime() + interval)
        setNextRefresh(next)
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error('Refresh failed'))
      }
    } finally {
      isRefreshingRef.current = false
    }
  }, [onRefresh, onError, isEnabled, interval])

  // Setup auto-refresh interval
  useEffect(() => {
    if (isEnabled) {
      // Initial refresh
      refreshNow()
      
      // Setup interval
      intervalRef.current = window.setInterval(refreshNow, interval)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setNextRefresh(null)
      setTimeUntilNextRefresh(0)
    }
  }, [isEnabled, interval, refreshNow])

  // Setup countdown timer
  useEffect(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
    }
    
    if (isEnabled && nextRefresh) {
      updateCountdown()
    }
    
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [nextRefresh, isEnabled, updateCountdown])

  // Control functions
  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev)
  }, [])

  const enable = useCallback(() => {
    setIsEnabled(true)
  }, [])

  const disable = useCallback(() => {
    setIsEnabled(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [])

  return {
    isEnabled,
    lastRefresh,
    nextRefresh,
    timeUntilNextRefresh,
    toggle,
    enable,
    disable,
    refreshNow
  }
}