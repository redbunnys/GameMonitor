import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAdminStore } from '../stores/adminStore'
import ServerForm from '../components/ServerForm'

const ServerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { 
    servers, 
    loading, 
    error, 
    addServer, 
    updateServer, 
    fetchAdminServers, 
    clearError 
  } = useAdminStore()
  
  const isEditMode = !!id
  const serverId = id ? parseInt(id, 10) : null
  const serverData = serverId ? servers.find(s => s.id === serverId) : null
  
  const [submitting, setSubmitting] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login')
    }
  }, [isAuthenticated, navigate])

  // Fetch servers if editing and server not found
  useEffect(() => {
    if (isEditMode && !serverData && servers.length === 0) {
      fetchAdminServers()
    }
  }, [isEditMode, serverData, servers.length, fetchAdminServers])

  const handleSubmit = useCallback(async (formData: any) => {
    setSubmitting(true)
    clearError()
    
    try {
      if (isEditMode && serverId) {
        await updateServer(serverId, formData)
      } else {
        await addServer(formData)
      }
      navigate('/admin')
    } catch (err) {
      console.error('Form submission failed:', err)
    } finally {
      setSubmitting(false)
    }
  }, [isEditMode, serverId, updateServer, addServer, navigate, clearError])

  // Loading state for edit mode when server data is not available
  if (isEditMode && loading && !serverData) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-slate-600">加载服务器信息...</span>
        </div>
      </div>
    )
  }

  // Server not found in edit mode
  if (isEditMode && !loading && !serverData) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-slate-400 mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">服务器未找到</h1>
          <p className="text-slate-600 mb-6">请检查服务器 ID 是否正确</p>
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            ← 返回管理后台
          </button>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-red-400 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">操作失败</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            ← 返回管理后台
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ServerForm
        mode={isEditMode ? 'edit' : 'add'}
        initialData={serverData || undefined}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  )
}

export default ServerFormPage