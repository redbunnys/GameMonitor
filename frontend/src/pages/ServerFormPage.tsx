import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminStore } from '../stores/adminStore'
import type { CreateServerRequest, UpdateServerRequest } from '../types'

const ServerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    servers, 
    loading, 
    error, 
    addServer, 
    updateServer, 
    fetchAdminServers,
    clearError 
  } = useAdminStore()

  const isEditing = !!id
  const serverId = id ? parseInt(id, 10) : null
  const existingServer = serverId ? servers.find(s => s.id === serverId) : null

  const [formData, setFormData] = useState<CreateServerRequest>({
    name: '',
    type: 'minecraft',
    address: '',
    port: 25565,
    description: '',
    download_url: '',
    changelog: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Load existing server data for editing
  useEffect(() => {
    if (isEditing && !existingServer && servers.length === 0) {
      fetchAdminServers()
    }
  }, [isEditing, existingServer, servers.length, fetchAdminServers])

  useEffect(() => {
    if (isEditing && existingServer) {
      setFormData({
        name: existingServer.name,
        type: existingServer.type,
        address: existingServer.address,
        port: existingServer.port,
        description: existingServer.description || '',
        download_url: existingServer.download_url || '',
        changelog: existingServer.changelog || ''
      })
    }
  }, [isEditing, existingServer])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value, 10) || 0 : value
    }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // Clear global error
    if (error) clearError()
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = '服务器名称不能为空'
    }

    if (!formData.address.trim()) {
      errors.address = '服务器地址不能为空'
    } else {
      // Basic IP/domain validation
      const addressRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      if (!addressRegex.test(formData.address.trim())) {
        errors.address = '请输入有效的IP地址或域名'
      }
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      errors.port = '端口号必须在1-65535之间'
    }

    if (formData.download_url && formData.download_url.trim()) {
      try {
        new URL(formData.download_url.trim())
      } catch {
        errors.download_url = '请输入有效的下载链接URL'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    clearError()

    try {
      if (isEditing && serverId) {
        const updateData: UpdateServerRequest = { ...formData, id: serverId }
        await updateServer(serverId, updateData)
      } else {
        await addServer(formData)
      }
      
      navigate('/admin')
    } catch (err) {
      console.error('Form submission failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin')
  }

  // Set default port based on game type
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'minecraft' | 'cs2'
    const defaultPort = newType === 'minecraft' ? 25565 : 27015
    
    setFormData(prev => ({
      ...prev,
      type: newType,
      port: defaultPort
    }))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? '编辑服务器' : '添加服务器'}
              </h1>
              <p className="text-gray-600">
                {isEditing ? '修改服务器配置信息' : '添加新的游戏服务器到监控列表'}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-500 transition-colors"
            >
              ← 返回管理后台
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && isEditing && !existingServer && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">加载服务器信息...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-red-800 font-medium">操作失败</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {(!loading || !isEditing || existingServer) && (
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      服务器名称 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="例如：我的 Minecraft 服务器"
                      disabled={submitting}
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      游戏类型 *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleTypeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={submitting}
                    >
                      <option value="minecraft">Minecraft</option>
                      <option value="cs2">CS2</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      服务器地址 *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="例如：play.example.com 或 192.168.1.100"
                      disabled={submitting}
                    />
                    {validationErrors.address && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                      端口 *
                    </label>
                    <input
                      type="number"
                      id="port"
                      name="port"
                      value={formData.port}
                      onChange={handleInputChange}
                      min="1"
                      max="65535"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.port ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={submitting}
                    />
                    {validationErrors.port && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.port}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    服务器描述
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="简单描述这个服务器的特色和玩法..."
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">附加信息</h3>
                
                <div>
                  <label htmlFor="download_url" className="block text-sm font-medium text-gray-700 mb-1">
                    客户端下载链接
                  </label>
                  <input
                    type="url"
                    id="download_url"
                    name="download_url"
                    value={formData.download_url}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.download_url ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/download"
                    disabled={submitting}
                  />
                  {validationErrors.download_url && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.download_url}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    如果提供，将在服务器详情页显示下载按钮
                  </p>
                </div>

                <div>
                  <label htmlFor="changelog" className="block text-sm font-medium text-gray-700 mb-1">
                    更新日志 (支持 Markdown)
                  </label>
                  <textarea
                    id="changelog"
                    name="changelog"
                    value={formData.changelog}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="## 版本 1.0.0&#10;- 新增功能A&#10;- 修复问题B&#10;&#10;## 版本 0.9.0&#10;- 初始版本"
                    disabled={submitting}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    支持 Markdown 格式，将在服务器详情页渲染显示
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditing ? '保存中...' : '添加中...'}</span>
                    </>
                  ) : (
                    <span>{isEditing ? '保存修改' : '添加服务器'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServerFormPage