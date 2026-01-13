#!/bin/bash

# 游戏服务器监控面板构建脚本

set -e

echo "🏗️  开始构建游戏服务器监控面板..."

# 检查依赖
echo "📦 检查 Go 依赖..."
go mod tidy

echo "📦 检查前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    pnpm install
fi

# 构建前端
echo "🔨 构建前端应用..."
pnpm run build

# 返回根目录
cd ..

# 构建 Go 应用
echo "🔨 构建 Go 应用..."
go build -o game-server-monitor main.go

echo "✅ 构建完成！"
echo "🚀 运行: ./game-server-monitor"