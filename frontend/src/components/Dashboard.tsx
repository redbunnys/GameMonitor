import React from 'react';
import { useServerStore } from '../stores/serverStore';

const StatusBadge = ({ status }: { status: 'online' | 'offline' }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
    status === 'online' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700'
  }`}>
    <span className={`w-2 h-2 rounded-full ${
      status === 'online' 
        ? 'bg-green-500 animate-pulse' 
        : 'bg-red-500'
    }`} />
    {status === 'online' ? '在线' : '离线'}
  </div>
);

const Dashboard: React.FC = () => {
  const { servers, loading, fetchServers } = useServerStore();

  // 计算统计数据
  const totalServers = servers.length;
  const onlineServers = servers.filter(s => s.status.online).length;
  const averageLatency = servers.length > 0 
    ? Math.round(servers.reduce((sum, s) => sum + (s.status.ping || 0), 0) / servers.length)
    : 0;

  const handleManualRefresh = () => {
    fetchServers();
  };

  const handleManageClick = () => {
    // 这里可以添加跳转到管理后台的逻辑
    window.location.href = '/admin';
  };

  const handleServerDetails = (serverId: number) => {
    // 这里可以添加跳转到服务器详情的逻辑
    window.location.href = `/server/${serverId}`;
  };

  if (loading && servers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-slate-600">加载服务器列表...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">游戏服务器监控</h1>
            <p className="text-slate-500 mt-2">实时掌握 Minecraft 和 CS2 服务运行状态</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleManualRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-sm font-medium disabled:opacity-50"
            >
              {loading ? '刷新中...' : '手动刷新'}
            </button>
            <button 
              onClick={handleManageClick}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              管理后台
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: '总服务器', value: totalServers, color: 'text-blue-600' },
            { label: '运行中', value: onlineServers, color: 'text-green-600' },
            { label: '平均延迟', value: `${averageLatency}ms`, color: 'text-amber-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {servers.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <h3 className="text-xl font-medium text-slate-600 mb-2">暂无服务器</h3>
            <p className="text-slate-500">
              还没有配置任何服务器。请联系管理员添加服务器配置。
            </p>
          </div>
        )}

        {/* Server Grid */}
        {servers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div 
                key={server.id} 
                className="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                    {server.type}
                  </span>
                  <StatusBadge status={server.status.online ? 'online' : 'offline'} />
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">
                  {server.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mb-4">
                  {server.address}:{server.port}
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">在线玩家</span>
                      <span className="text-slate-900 font-semibold">
                        {server.status.players}/{server.status.max_players}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${server.status.max_players > 0 
                            ? (server.status.players / server.status.max_players) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 
                      {server.status.ping > 0 ? `${server.status.ping}ms` : '--'}
                    </div>
                    <button 
                      onClick={() => handleServerDetails(server.id)}
                      className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                    >
                      查看详情 →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;