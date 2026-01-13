import React from 'react'
import type { ServerStatus } from '../types'

interface ServerStatusIndicatorProps {
  status: ServerStatus
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({ 
  status, 
  size = 'md',
  showText = false 
}) => {
  // Size classes for the indicator dot
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  // Get status information
  const getStatusInfo = () => {
    if (status.online) {
      return {
        color: 'bg-server-online',
        text: '在线',
        textColor: 'text-green-600',
        pulseColor: 'animate-pulse bg-green-400'
      }
    } else {
      return {
        color: 'bg-server-offline',
        text: '离线',
        textColor: 'text-red-600',
        pulseColor: 'animate-pulse bg-red-400'
      }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="flex items-center space-x-2">
      {/* Status indicator dot with pulse animation */}
      <div className="relative">
        <div className={`${sizeClasses[size]} ${statusInfo.color} rounded-full`} />
        {status.online && (
          <div className={`absolute inset-0 ${sizeClasses[size]} ${statusInfo.pulseColor} rounded-full opacity-75`} />
        )}
      </div>
      
      {/* Optional status text */}
      {showText && (
        <span className={`text-sm font-medium ${statusInfo.textColor}`}>
          {statusInfo.text}
        </span>
      )}
    </div>
  )
}

export default ServerStatusIndicator