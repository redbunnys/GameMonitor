import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            游戏服务器监控面板
          </h1>
          <p className="text-gray-600">
            实时监控 Minecraft 和 CS2 服务器状态
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 示例服务器卡片 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">示例服务器</h3>
              <div className="w-3 h-3 bg-server-online rounded-full"></div>
            </div>
            <p className="text-gray-600 mb-2">Minecraft 1.20.1</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">玩家数量</span>
              <span className="font-medium">12/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: '12%'}}></div>
            </div>
          </div>

          {/* 离线服务器示例 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">离线服务器</h3>
              <div className="w-3 h-3 bg-server-offline rounded-full"></div>
            </div>
            <p className="text-gray-600 mb-2">CS2</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">状态</span>
              <span className="font-medium text-red-500">离线</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            项目结构设置完成 ✅ - 准备开始实现功能
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
