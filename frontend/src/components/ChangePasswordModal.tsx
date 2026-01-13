import React, { useState } from 'react'
import { apiClient } from '../services/api'
import type { ChangePasswordRequest } from '../types'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateForm = (): string | null => {
    if (!formData.current_password.trim()) {
      return '请输入当前密码'
    }
    if (!formData.new_password.trim()) {
      return '请输入新密码'
    }
    if (formData.new_password.length < 6) {
      return '新密码至少需要6个字符'
    }
    if (formData.new_password !== formData.confirm_password) {
      return '新密码和确认密码不匹配'
    }
    if (formData.current_password === formData.new_password) {
      return '新密码不能与当前密码相同'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await apiClient.changePassword(formData)
      onSuccess()
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : '修改密码失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">修改密码</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-slate-700 mb-1">
              当前密码
            </label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              required
              value={formData.current_password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
              placeholder="请输入当前密码"
            />
          </div>

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-slate-700 mb-1">
              新密码
            </label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              required
              value={formData.new_password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
              placeholder="请输入新密码（至少6个字符）"
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-1">
              确认新密码
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              value={formData.confirm_password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700"
              placeholder="请再次输入新密码"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '修改中...' : '确认修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal