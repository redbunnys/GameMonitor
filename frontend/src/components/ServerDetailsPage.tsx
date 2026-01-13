import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useServerStore } from '../stores/serverStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import type { ServerWithStatus } from '../types'

interface InfoCardProps {
  title: string
  icon: string
  children: React.ReactNode
}

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl">
      <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  )
}

const ServerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载服务器信息中...</p>
        </div>
      </div>
    )
  }

  if (notFound || !server) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-slate-400 mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">服务器未找到</h1>
          <p className="text-slate-600 mb-6">请检查服务器 ID 是否正确</p>
          <Link 
            to="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-red-400 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">加载失败</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
        return 'MINECRAFT'
      case 'cs2':
        return 'CS2'
      default:
        return type.toUpperCase()
    }
  }


  // Handle connect click (could be customized based on game type)
  const handleConnectClick = () => {
    const address = `${server.address}:${server.port}`
    navigator.clipboard.writeText(address).then(() => {
      alert(`服务器地址已复制到剪贴板: ${address}`)
    }).catch(() => {
      alert(`服务器地址: ${address}`)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 pt-16 pb-32 px-8">
        <div className="max-w-5xl mx-auto">
          <Link 
            to="/"
            className="text-indigo-100 hover:text-white mb-6 flex items-center gap-2 text-sm"
          >
            ← 返回列表
          </Link>
          
          <div className="flex flex-wrap justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-lg text-xs font-bold uppercase tracking-widest">
                  {getGameTypeDisplay(server.type)}
                </span>
                <span className="text-indigo-200 text-sm">
                  {status.version || 'Unknown'}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                {server.name}
              </h1>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleConnectClick}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all text-sm"
              >
                一键连接
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-5xl mx-auto px-8 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard title="连接信息" icon="🌐">
            <div className="mt-4 space-y-2">
              <p className="flex justify-between text-sm">
                <span className="text-slate-400">地址:</span> 
                <span className="text-slate-700 font-mono">{server.address}</span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-slate-400">端口:</span> 
                <span className="text-slate-700 font-mono">{server.port}</span>
              </p>
            </div>
          </InfoCard>

          <InfoCard title="当前状态" icon="📊">
            <div className="mt-4 flex flex-col items-center">
              <p className="text-3xl font-black text-slate-800">
                {status.players}/{status.max_players}
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
                在线人数
              </p>
            </div>
          </InfoCard>

          <InfoCard title="网络质量" icon="⚡">
            <div className="mt-4 flex flex-col items-center">
              <p className="text-3xl font-black text-green-500">
                {status.ping > 0 ? `${status.ping}ms` : '--'}
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
                响应延迟
              </p>
            </div>
          </InfoCard>
        </div>

        {/* Description Section */}
        <div className="mt-10 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            服务器介绍
          </h3>
          <article className="prose prose-slate max-w-none text-slate-600">
            {server.description ? (
              <ReactMarkdown>{server.description}</ReactMarkdown>
            ) : (
              '暂无详细介绍...'
            )}
          </article>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center pb-8">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || !isOnline}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <svg 
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
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
            {refreshing ? '刷新中...' : '刷新状态'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServerDetailsPage