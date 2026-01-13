import React, { useEffect, useState, useCallback } from 'react'
import { useServerStore } from '../stores/serverStore'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import ServerCard from '../components/ServerCard'

const HomePage: React.FC = () => {
  const { 
    servers, 
    loading, 
    error, 
    lastUpdated,
    isRetrying,
    fetchServers,
    fetchServersWithRetry,
    clearError 
  } = useServerStore()
  
  const { isOnline, isReconnecting, reconnect } = useNetworkStatus()
  const [refreshError, setRefreshError] = useState<string | null>(null)

  // Auto-refresh configuration
  const handleRefresh = useCallback(async () => {
    setRefreshError(null)
    if (isOnline) {
      await fetchServersWithRetry(3)
    } else {
      throw new Error('No network connection')
    }
  }, [fetchServersWithRetry, isOnline])

  const handleRefreshError = useCallback((error: Error) => {
    setRefreshError(error.message)
  }, [])

  const {
    isEnabled: autoRefreshEnabled,
    lastRefresh,
    nextRefresh,
    timeUntilNextRefresh,
    toggle: toggleAutoRefresh,
    refreshNow
  } = useAutoRefresh({
    interval: 30000, // 30 seconds as per requirements
    enabled: true,
    onRefresh: handleRefresh,
    onError: handleRefreshError
  })

  // Initial fetch
  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    setRefreshError(null)
    clearError()
    await refreshNow()
  }, [refreshNow, clearError])

  // Network reconnection handler
  const handleNetworkReconnect = useCallback(async () => {
    await reconnect()
    if (isOnline) {
      await handleManualRefresh()
    }
  }, [reconnect, isOnline, handleManualRefresh])

  // Error retry handler
  const handleRetry = useCallback(async () => {
    setRefreshError(null)
    clearError()
    await fetchServersWithRetry(3)
  }, [clearError, fetchServersWithRetry])

  // Format time until next refresh
  const formatTimeUntilRefresh = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}秒`
  }

  // Determine current error to display
  const currentError = refreshError || error
  const displayLastUpdate = lastRefresh || lastUpdated

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            游戏服务器监控面板
          </h1>
          <p className="text-gray-600">
            实时监控 Minecraft 和 CS2 服务器状态
          </p>
        </header>

        {/* Network Status Banner */}
        {!isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-orange-800 font-medium">网络连接断开</h3>
                  <p className="text-orange-600 text-sm">
                    {isReconnecting ? '正在尝试重新连接...' : '无法连接到服务器'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleNetworkReconnect}
                disabled={isReconnecting}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {isReconnecting ? '连接中...' : '重新连接'}
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleManualRefresh}
              disabled={loading || isRetrying || !isOnline}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg 
                className={`w-4 h-4 ${(loading || isRetrying) ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              <span>
                {loading || isRetrying ? '刷新中...' : '手动刷新'}
              </span>
            </button>

            <button
              onClick={toggleAutoRefresh}
              disabled={!isOnline}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefreshEnabled && isOnline
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              } disabled:opacity-50`}
            >
              <div className={`w-2 h-2 rounded-full ${
                autoRefreshEnabled && isOnline ? 'bg-white animate-pulse' : 'bg-gray-600'
              }`} />
              <span>
                自动刷新 {autoRefreshEnabled && isOnline ? '开启' : '关闭'}
              </span>
            </button>
          </div>

          <div className="text-sm text-gray-500 text-center sm:text-right">
            {displayLastUpdate && (
              <div>上次更新: {displayLastUpdate.toLocaleString('zh-CN')}</div>
            )}
            {autoRefreshEnabled && isOnline && nextRefresh && (
              <div className="text-xs">
                下次刷新: {formatTimeUntilRefresh(timeUntilNextRefresh)}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && servers.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">加载服务器列表...</span>
            </div>
          </div>
        )}

        {/* Retry State */}
        {isRetrying && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="text-blue-800 font-medium">正在重试</h3>
                <p className="text-blue-600 text-sm">正在尝试重新获取服务器状态...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {currentError && !isRetrying && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium">加载失败</h3>
                  <p className="text-red-600 text-sm">{currentError}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                disabled={!isOnline}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !currentError && servers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <h3 className="text-xl font-medium text-gray-600 mb-2">暂无服务器</h3>
            <p className="text-gray-500">
              还没有配置任何服务器。请联系管理员添加服务器配置。
            </p>
          </div>
        )}

        {/* Server Grid - Responsive Layout */}
        {!loading && servers.length > 0 && (
          <>
            {/* Server Count */}
            <div className="mb-4">
              <p className="text-gray-600">
                共 {servers.length} 台服务器 • 
                在线 {servers.filter(s => s.status.online).length} 台 • 
                离线 {servers.filter(s => !s.status.online).length} 台
              </p>
            </div>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {servers.map(server => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>游戏服务器监控面板 - 实时监控您的游戏服务器状态</p>
          {autoRefreshEnabled && isOnline && (
            <p className="mt-1">自动刷新已启用 • 每30秒更新一次</p>
          )}
        </footer>
      </div>
    </div>
  )
}

export default HomePage