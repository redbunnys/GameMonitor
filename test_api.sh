#!/bin/bash

# 测试API对接脚本
echo "=== 游戏服务器监控API测试 ==="

# 启动服务器（后台运行）
echo "启动服务器..."
./game-server-monitor &
SERVER_PID=$!

# 等待服务器启动
sleep 3

echo "测试公共API接口..."

# 测试获取服务器列表
echo "1. 测试 GET /api/servers"
curl -s http://localhost:8080/api/servers | jq '.' || echo "JSON解析失败"

echo -e "\n2. 测试登录接口 POST /api/auth/login"
# 测试登录（需要先有用户）
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "$LOGIN_RESPONSE" | jq '.' || echo "登录失败或JSON解析失败"

# 提取token（如果登录成功）
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -n "$TOKEN" ]; then
    echo -e "\n3. 测试管理员API GET /api/admin/servers"
    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/admin/servers | jq '.' || echo "JSON解析失败"
else
    echo "无法获取token，跳过管理员API测试"
fi

# 清理
echo -e "\n清理进程..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "测试完成"