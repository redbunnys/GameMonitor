# 前端对接后端API功能总结

## 🎯 项目概述
游戏服务器监控面板 - 支持Minecraft和CS2服务器的实时状态监控，包含前端展示和后端管理功能。

## 📋 API接口对接状态

### ✅ 公共API接口（无需认证）

| 接口 | 方法 | 路径 | 功能 | 前端调用 | 状态 |
|------|------|------|------|----------|------|
| 获取服务器列表 | GET | `/api/servers` | 获取所有服务器及实时状态 | `apiClient.getServers()` | ✅ |
| 获取单个服务器 | GET | `/api/servers/:id` | 获取指定服务器详情和状态 | `apiClient.getServerById(id)` | ✅ |

### ✅ 认证API接口

| 接口 | 方法 | 路径 | 功能 | 前端调用 | 状态 |
|------|------|------|------|----------|------|
| 用户登录 | POST | `/api/auth/login` | 管理员登录获取JWT token | `apiClient.login(credentials)` | ✅ |
| 获取用户信息 | GET | `/api/auth/profile` | 获取当前用户信息 | - | ✅ |
| 修改密码 | POST | `/api/auth/change-password` | 修改当前用户密码 | - | ✅ |
| 验证token | POST | `/api/auth/validate` | 验证JWT token有效性 | - | ✅ |

### ✅ 管理员API接口（需要JWT认证）

#### 服务器管理
| 接口 | 方法 | 路径 | 功能 | 前端调用 | 状态 |
|------|------|------|------|----------|------|
| 获取管理服务器列表 | GET | `/api/admin/servers` | 获取所有服务器配置（管理用） | `apiClient.getAdminServers()` | ✅ 新增 |
| 创建服务器 | POST | `/api/admin/servers` | 创建新的服务器配置 | `apiClient.createServer(data)` | ✅ |
| 更新服务器 | PUT | `/api/admin/servers/:id` | 更新服务器配置 | `apiClient.updateServer(id, data)` | ✅ |
| 删除服务器 | DELETE | `/api/admin/servers/:id` | 删除服务器配置 | `apiClient.deleteServer(id)` | ✅ |

#### 用户管理
| 接口 | 方法 | 路径 | 功能 | 前端调用 | 状态 |
|------|------|------|------|----------|------|
| 创建用户 | POST | `/api/admin/users` | 创建新管理员用户 | - | ✅ |
| 获取用户列表 | GET | `/api/admin/users` | 获取所有用户列表 | - | ✅ |
| 删除用户 | DELETE | `/api/admin/users/:id` | 删除指定用户 | - | ✅ |
| 重置用户密码 | POST | `/api/admin/users/:id/reset-password` | 重置用户密码 | - | ✅ |

## 🔧 修复的问题

### 1. 新增缺失的API接口
- **问题**: 前端调用 `apiClient.getAdminServers()` 但后端缺少 `GET /api/admin/servers` 接口
- **解决**: 在 `main.go` 中添加路由，在 `server.go` 中实现 `GetAdminServers` 方法

### 2. 统一API响应格式
- **问题**: 部分接口返回格式与前端期望的 `ApiResponse<T>` 不匹配
- **解决**: 修改所有接口返回统一的 `{"data": T, "message": "..."}` 格式

## 📱 前端功能页面

### 公共页面
- **首页** (`HomePage.tsx`): 展示所有服务器状态，支持自动刷新
- **服务器详情页** (`ServerDetailsPage.tsx`): 显示单个服务器详细信息

### 管理后台页面
- **登录页** (`LoginPage.tsx`): 管理员登录界面
- **管理面板** (`AdminDashboard.tsx`): 服务器管理列表
- **服务器表单页** (`ServerFormPage.tsx`): 创建/编辑服务器配置

## 🏗️ 技术架构

### 前端技术栈
- **框架**: React + TypeScript + Vite
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **样式**: Tailwind CSS
- **路由**: React Router

### 后端技术栈
- **语言**: Go
- **框架**: Gin
- **数据库**: SQLite + GORM
- **认证**: JWT
- **服务器探测**: 自定义prober服务

## 🔐 认证机制

### JWT Token认证
- 登录成功后返回JWT token
- 前端自动在请求头中添加 `Authorization: Bearer <token>`
- token过期自动跳转到登录页
- 支持token有效性验证

### 权限控制
- 公共接口：无需认证
- 管理接口：需要JWT token认证
- 自动处理401未授权响应

## 🚀 部署和运行

### 开发环境
```bash
# 前端开发
cd frontend
npm install
npm run dev

# 后端开发
go run main.go
```

### 生产环境
```bash
# 构建前端
cd frontend
npm run build

# 构建后端（包含前端静态文件）
go build -o game-server-monitor

# 运行
./game-server-monitor
```

## 📊 实时功能

### 自动刷新机制
- 前端每30秒自动刷新服务器状态
- 支持手动刷新和开关自动刷新
- 网络断开时自动暂停刷新

### 服务器状态监控
- 实时显示在线/离线状态
- 当前玩家数/最大玩家数
- 服务器版本信息
- 响应延迟(ping)

## 🎨 用户体验

### 响应式设计
- 支持桌面和移动设备
- 自适应网格布局
- 友好的加载和错误状态

### 国际化
- 完整的中文界面
- 友好的错误提示
- 直观的操作反馈

## 🔍 默认配置

### 默认管理员账户
- 用户名: `admin`
- 密码: `admin123`
- 首次运行时自动创建

### 服务器配置
- 默认端口: `8080`
- 数据库文件: `game_servers.db`
- 前端静态文件: 嵌入到二进制文件中

---

**总结**: 前端与后端API对接已完成，所有核心功能都已实现并测试通过。系统支持完整的服务器监控和管理功能，具备良好的用户体验和安全性。