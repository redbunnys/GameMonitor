import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Server } from '../types'

interface InputGroupProps {
  label: string
  children: React.ReactNode
  required?: boolean
}

const InputGroup: React.FC<InputGroupProps> = ({ label, children, required }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

interface ServerFormData {
  name: string
  type: 'minecraft' | 'cs2'
  address: string
  port: number
  description: string
}

interface ServerFormProps {
  initialData?: Partial<Server>
  onSubmit: (data: ServerFormData) => void
  mode?: 'add' | 'edit'
  loading?: boolean
}

const ServerForm: React.FC<ServerFormProps> = ({ 
  initialData, 
  onSubmit, 
  mode = 'add',
  loading = false 
}) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    type: 'minecraft',
    address: '',
    port: 25565,
    description: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'minecraft',
        address: initialData.address || '',
        port: initialData.port || 25565,
        description: initialData.description || ''
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'port' ? parseInt(value, 10) || 25565 : value 
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'minecraft' | 'cs2'
    const defaultPort = type === 'minecraft' ? 25565 : 27015
    setFormData(prev => ({ ...prev, type, port: defaultPort }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '服务器名称不能为空'
    }

    if (!formData.address.trim()) {
      newErrors.address = '服务器地址不能为空'
    } else if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(formData.address.trim())) {
      newErrors.address = '请输入有效的IP地址或域名'
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = '端口号必须在1-65535之间'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleCancel = () => {
    navigate('/admin')
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      {/* 顶部导航 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'add' ? '添加服务器' : '编辑服务器'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'add' 
              ? '配置并监控新的游戏服务器实例' 
              : '修改现有服务器的连接与展示配置'
            }
          </p>
        </div>
        <button 
          onClick={handleCancel}
          className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
        >
          ← 返回管理后台
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息卡片 */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full" /> 基本信息
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="服务器名称" required>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                placeholder="例如: 某某周目一服"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 placeholder-slate-400 ${
                  errors.name ? 'border-red-300' : 'border-slate-200'
                }`}
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </InputGroup>

            <InputGroup label="游戏类型" required>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleTypeChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700"
                disabled={loading}
                style={{ color: '#334155' }}
              >
                <option value="minecraft" style={{ color: '#334155', backgroundColor: 'white' }}>Minecraft</option>
                <option value="cs2" style={{ color: '#334155', backgroundColor: 'white' }}>CS2</option>
              </select>
            </InputGroup>

            <InputGroup label="服务器地址" required>
              <input 
                name="address" 
                value={formData.address} 
                onChange={handleChange}
                placeholder="mc.example.com 或 IP"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono text-sm outline-none focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 ${
                  errors.address ? 'border-red-300' : 'border-slate-200'
                }`}
                disabled={loading}
              />
              {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
            </InputGroup>

            <InputGroup label="端口" required>
              <input 
                name="port" 
                type="number"
                value={formData.port} 
                onChange={handleChange}
                placeholder="25565"
                min="1"
                max="65535"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono text-sm outline-none focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 ${
                  errors.port ? 'border-red-300' : 'border-slate-200'
                }`}
                disabled={loading}
              />
              {errors.port && <p className="text-red-500 text-xs">{errors.port}</p>}
            </InputGroup>
          </div>

          <div className="mt-6">
            <InputGroup label="服务器介绍 (支持 Markdown)">
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                rows={6}
                placeholder="简单介绍一下你的服务器...&#10;&#10;支持 Markdown 语法：&#10;## 标题&#10;- 列表项&#10;**粗体文字**"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all resize-y font-mono text-sm text-slate-700 placeholder-slate-400"
                disabled={loading}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[11px] text-slate-400 italic">内容将渲染为 HTML 显示在详情页</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded uppercase font-bold">
                  Markdown Support
                </span>
              </div>
            </InputGroup>
          </div>
        </section>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button"
            onClick={handleCancel}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
            disabled={loading}
          >
            取消
          </button>
          <button 
            type="submit"
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {mode === 'add' ? '添加中...' : '保存中...'}
              </div>
            ) : (
              mode === 'add' ? '立即添加' : '保存修改'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ServerForm