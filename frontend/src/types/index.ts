// 服务器接口
export interface Server {
  id: number
  name: string
  type: 'minecraft' | 'cs2'
  address: string
  port: number
  description: string
  download_url: string
  changelog: string
  version: string
  created_at: string
  updated_at: string
}

// 服务器状态接口
export interface ServerStatus {
  online: boolean
  players: number
  max_players: number
  version: string
  ping: number
  last_updated: string
}

// 完整的服务器状态响应
export interface ServerWithStatus extends Server {
  status: ServerStatus
}

// API 响应类型
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// 登录相关类型
export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expires_at: string
}

// 服务器配置请求类型
export interface CreateServerRequest {
  name: string
  type: 'minecraft' | 'cs2'
  address: string
  port: number
  description?: string
  download_url?: string
  changelog?: string
}

export interface UpdateServerRequest extends Partial<CreateServerRequest> {
  id: number
}