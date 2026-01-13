import React from 'react'

interface PingIndicatorProps {
  ping: number
  className?: string
}

const PingIndicator: React.FC<PingIndicatorProps> = ({ ping, className = '' }) => {
  // Don't show anything if ping is 0 or negative (offline/invalid)
  if (ping <= 0) {
    return null
  }

  // Determine ping quality and color
  const getPingInfo = () => {
    if (ping <= 50) {
      return {
        quality: '优秀',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        bars: 4
      }
    } else if (ping <= 100) {
      return {
        quality: '良好',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        bars: 3
      }
    } else if (ping <= 200) {
      return {
        quality: '一般',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        bars: 2
      }
    } else {
      return {
        quality: '较差',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        bars: 1
      }
    }
  }

  const pingInfo = getPingInfo()

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Signal strength bars */}
      <div className="flex items-end space-x-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 transition-colors duration-200 ${
              bar <= pingInfo.bars 
                ? pingInfo.color.replace('text-', 'bg-')
                : 'bg-gray-300'
            }`}
            style={{ height: `${bar * 3 + 2}px` }}
          />
        ))}
      </div>

      {/* Ping value and quality */}
      <div className="flex items-center space-x-1">
        <span className={`text-xs font-medium ${pingInfo.color}`}>
          {ping}ms
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${pingInfo.bgColor} ${pingInfo.color}`}>
          {pingInfo.quality}
        </span>
      </div>
    </div>
  )
}

export default PingIndicator