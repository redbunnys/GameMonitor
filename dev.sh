#!/bin/bash

# 开发环境启动脚本

echo "🚀 启动开发环境..."

# 启动前端开发服务器（后台运行）
echo "📱 启动前端开发服务器..."
cd frontend
pnpm run dev &
FRONTEND_PID=$!

# 返回根目录
cd ..

# 启动 Go 后端服务器
echo "🔧 启动后端服务器..."
go run main.go &
BACKEND_PID=$!

echo "✅ 开发环境已启动！"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:${PORT:-8080}"
echo ""
echo "💡 提示: 使用环境变量自定义配置"
echo "   例如: PORT=3000 JWT_SECRET=my-secret ./dev.sh"
echo ""
echo "按 Ctrl+C 停止所有服务..."

# 捕获中断信号并清理进程
trap 'echo "🛑 停止服务..."; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit' INT

# 等待进程
wait
