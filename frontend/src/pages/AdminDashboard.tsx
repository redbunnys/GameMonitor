import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'
import ChangePasswordModal from '../components/ChangePasswordModal'
import type { Server } from '../types'

const AdminDashboard: React.FC = () => {
  const { username, logout } = useAuthStore()
  const { 
    servers, 
    loading, 
    error, 
    fetchAdminServers, 
    deleteServer, 
    clearError 
  } = useAdminStore()
  
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    fetchAdminServers()
  }, [fetchAdminServers])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const handlePasswordChangeSuccess = () => {
    // 可以显示成功消息或者强制重新登录
    alert('密码修改成功！')
  }

  const handleDeleteServer = async (server: Server) => {
    if (!confirm(`确定要删除服务器 "${server.name}" 吗？此操作不可撤销。`)) {
      return
    }

    setDeletingId(server.id)
    try {
      await deleteServer(server.id)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRetry = () => {
    clearError()
    fetchAdminServers()
  }

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

  if (loading && servers.length === 0) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          <span className="text-slate-600">加载服务器列表...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">管理后台</h1>
            <p className="text-slate-600 mt-1">游戏服务器监控面板</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-700">欢迎, {username}</span>
            <button
              onClick={() => setShowChangePassword(true)}
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              修改密码
            </button>
            <Link
              to="/"
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              查看前台
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">服务器管理</h2>
          <Link
            to="/admin/servers/new"
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition-all text-sm"
          >
            <span>+</span> 添加新服务器
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium">加载失败</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && servers.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <h3 className="text-xl font-medium text-slate-600 mb-2">暂无服务器</h3>
            <p className="text-slate-500 mb-6">
              还没有配置任何服务器。点击上方按钮添加第一台服务器。
            </p>
            <Link
              to="/admin/servers/new"
              className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
            >
              <span className="mr-2">+</span>
              添加服务器
            </Link>
          </div>
        )}

        {/* Server Table */}
        {!loading && servers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    服务器名称
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    类型
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    地址
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {servers.map((server) => (
                  <tr key={server.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {server.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold tracking-tighter uppercase">
                        {getGameTypeDisplay(server.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-500">
                      {server.address}:{server.port}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/servers/${server.id}/edit`}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDeleteServer(server)}
                          disabled={deletingId === server.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deletingId === server.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            '删除'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Statistics */}
        {servers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">
                      总服务器数
                    </dt>
                    <dd className="text-2xl font-bold text-slate-800">
                      {servers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">
                      Minecraft 服务器
                    </dt>
                    <dd className="text-2xl font-bold text-slate-800">
                      {servers.filter(s => s.type === 'minecraft').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">
                      CS2 服务器
                    </dt>
                    <dd className="text-2xl font-bold text-slate-800">
                      {servers.filter(s => s.type === 'cs2').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  )
}

export default AdminDashboard