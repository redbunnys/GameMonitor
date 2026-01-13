import React from 'react'

interface PlayerCountBarProps {
  current: number
  max: number
  showPercentage?: boolean
  className?: string
}

const PlayerCountBar: React.FC<PlayerCountBarProps> = ({ 
  current, 
  max, 
  showPercentage = true,
  className = ''
}) => {
  // Calculate percentage
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0
  const clampedPercentage = Math.min(percentage, 100)

  // Determine bar color based on capacity
  const getBarColor = () => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  // Get capacity status text
  const getCapacityStatus = () => {
    if (percentage >= 95) return '几乎满员'
    if (percentage >= 80) return '较为拥挤'
    if (percentage >= 50) return '适中'
    if (percentage > 0) return '较为空闲'
    return '空服务器'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Player count display */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">玩家数量</span>
        <span className="font-medium text-gray-800">
          {current}/{max}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      
      {/* Additional information */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">
          {getCapacityStatus()}
        </span>
        {showPercentage && (
          <span className="text-gray-400">
            {percentage}% 满员
          </span>
        )}
      </div>
    </div>
  )
}

export default PlayerCountBar