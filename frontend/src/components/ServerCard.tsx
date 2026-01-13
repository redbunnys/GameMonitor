import React from 'react'
import { Link } from 'react-router-dom'
import type { ServerWithStatus } from '../types'

interface ServerCardProps {
  server: ServerWithStatus
}

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const { status } = server
  
  // Calculate player percentage for progress bar
  const playerPercentage = status.max_players > 0 
    ? Math.round((status.players / status.max_players) * 100)
    : 0

  // Determine status indicator color and text
  const getStatusInfo = () => {
    if (status.online) {
      return {
        color: 'bg-server-online',
        text: '在线',
        textColor: 'text-green-600'
      }
    } else {
      return {
        color: 'bg-server-offline',
        text: '离线',
        textColor: 'text-red-600'
      }
    }
  }

  const statusInfo = getStatusInfo()

  // Format ping display
  const formatPing = (ping: number) => {
    if (ping <= 0) return ''
    return `${ping}ms`
  }

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

  return (
    <Link 
      to={`/server/${server.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
    >
      <div className="p-6">
        {/* Header with server name and status indicator */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 truncate">
            {server.name}
          </h3>
          <div className={`w-3 h-3 ${statusInfo.color} rounded-full flex-shrink-0`} />
        </div>

        {/* Game type and version */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600 font-medium">
            {getGameTypeDisplay(server.type)}
          </span>
          {status.version && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {status.version}
            </span>
          )}
        </div>

        {/* Status and ping information */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">状态</span>
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
            {status.online && status.ping > 0 && (
              <span className="text-xs text-gray-400">
                {formatPing(status.ping)}
              </span>
            )}
          </div>
        </div>

        {/* Player count and progress bar (only show when online) */}
        {status.online ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">玩家数量</span>
              <span className="font-medium text-gray-800">
                {status.players}/{status.max_players}
              </span>
            </div>
            
            {/* Player count progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  playerPercentage >= 90 
                    ? 'bg-red-500' 
                    : playerPercentage >= 70 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(playerPercentage, 100)}%` }}
              />
            </div>
            
            {/* Player percentage indicator */}
            <div className="text-right">
              <span className="text-xs text-gray-400">
                {playerPercentage}% 满员
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-gray-400 text-sm">服务器离线</span>
          </div>
        )}

        {/* Last updated timestamp */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            更新时间: {new Date(status.last_updated).toLocaleString('zh-CN')}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default ServerCard