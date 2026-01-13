import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useServerStore } from '../stores/serverStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { ServerStatusIndicator, PlayerCountBar, PingIndicator } from './index'
import type { ServerWithStatus } from '../types'

const ServerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getServerById, fetchServers, loading, error } = useServerStore()
  const { isOnline } = useNetworkStatus()
  const [server, setServer] = useState<ServerWithStatus | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 手动刷新功能
  const handleManualRefresh = useCallback(async () => {
    if (refreshing || !isOnline || !server) return
    
    setRefreshing(true)
    try {
      await fetchServers()
      const updatedServer = getServerById(server.id)
      if (updatedServer) {
        setServer(updatedServer)
      }
    } catch (err) {
      console.error('Manual refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, isOnline, server, fetchServers, getServerById])

  useEffect(() => {
    const loadServer = async () => {
      if (!id) {
        setNotFound(true)
        return
      }

      const serverId = parseInt(id, 10)
      if (isNaN(serverId)) {
        setNotFound(true)
        return
      }

      // Try to get server from store first
      let foundServer = getServerById(serverId)
      
      // If not found in store, fetch all servers
      if (!foundServer) {
        await fetchServers()
        foundServer = getServerById(serverId)
      }

      if (foundServer) {
        setServer(foundServer)
        setNotFound(false)
      } else {
        setNotFound(true)
      }
    }

    loadServer()
  }, [id, getServerById, fetchServers])

  if (loading && !server) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载服务器信息中...</p>
        </div>
      </div>
    )
  }

  if (notFound || !server) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">服务器未找到</h1>
          <p className="text-gray-600 mb-6">请检查服务器 ID 是否正确</p>
          <Link 
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-red-400 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">加载失败</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  const { status } = server

  // Get game type display name
  const getGameTypeDisplay = (type: string) => {
    switch (type) {
      case 'minecraft':
        return 'Minecraft'
      case 'cs2':
        return 'CS2'
      default:
        return type.toUpperCase()
    }
  }

  // Format last updated time
  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return '刚刚更新'
    if (diffMinutes < 60) return `${diffMinutes} 分钟前更新`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} 小时前更新`
    
    return date.toLocaleString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with back button and refresh controls */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <Link 
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回服务器列表
            </Link>

            {/* Refresh controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualRefresh}
                disabled={loading || !isOnline}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg 
                  className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} 
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
                <span>{loading ? '刷新中' : '刷新'}</span>
              </button>

              <button
                onClick={handleManualRefresh}
                disabled={refreshing || !isOnline}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
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
                <span>{refreshing ? '刷新中' : '手动刷新'}</span>
              </button>

              <div className="text-xs text-gray-500">
                自动刷新已在首页启用
              </div>
            </div>
          </div>
        </div>

        {/* Main server info card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Header section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{server.name}</h1>
                <div className="flex items-center space-x-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {getGameTypeDisplay(server.type)}
                  </span>
                  {status.version && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {status.version}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <ServerStatusIndicator status={status} size="lg" showText />
                <div className="mt-2 text-sm opacity-90">
                  {formatLastUpdated(status.last_updated)}
                </div>
              </div>
            </div>
          </div>

          {/* Server stats section */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Connection info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">连接信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">地址:</span>
                    <span className="font-mono">{server.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">端口:</span>
                    <span className="font-mono">{server.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">完整地址:</span>
                    <span className="font-mono text-blue-600">
                      {server.address}:{server.port}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">玩家统计</h3>
                {status.online ? (
                  <PlayerCountBar 
                    current={status.players} 
                    max={status.max_players}
                    className="mb-2"
                  />
                ) : (
                  <div className="text-center py-4">
                    <span className="text-gray-500">服务器离线</span>
                  </div>
                )}
              </div>

              {/* Performance info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">性能信息</h3>
                <div className="space-y-3">
                  {status.online ? (
                    <>
                      <PingIndicator ping={status.ping} />
                      <div className="text-sm text-gray-600">
                        响应时间: {status.ping > 0 ? `${status.ping}ms` : '未知'}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-gray-500">无法获取性能数据</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Download button (conditional) */}
            {server.download_url && (
              <div className="mb-6">
                <a
                  href={server.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  下载客户端
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Description section */}
        {server.description && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">服务器介绍</h2>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{server.description}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Changelog section */}
        {server.changelog && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">更新日志</h2>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{server.changelog}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Footer with additional actions */}
        <div className="mt-8 text-center">
          <button
            onClick={handleManualRefresh}
            disabled={loading || !isOnline}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors mr-4"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? '刷新中...' : '刷新状态'}
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServerDetailsPage