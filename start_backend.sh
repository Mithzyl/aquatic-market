#!/bin/bash

echo "🚀 启动水产菜市全栈应用"
echo "=================================="

# 启动后端
echo "📦 启动后端服务..."
cd /Users/mith/Desktop/project/sales/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
echo "   API地址: http://127.0.0.1:8000"
echo "   API文档: http://127.0.0.1:8000/docs"

# 等待2秒
sleep 2

# 启动前端
echo ""
echo "🎨 启动前端服务..."
cd /Users/mith/Desktop/project/sales/aquatic-web-app
npm run dev &
FRONTEND_PID=$!

echo "✅ 前端服务启动成功 (PID: $FRONTEND_PID)"
echo "   前端地址: http://localhost:5173"

echo ""
echo "=================================="
echo "🎉 所有服务已启动！"
echo ""
echo "📝 使用说明:"
echo "   - 前端: http://localhost:5173"
echo "   - 后端API: http://127.0.0.1:8000"
echo "   - API文档: http://127.0.0.1:8000/docs"
echo ""
echo "🛑 按 Ctrl+C 停止所有服务"
echo "=================================="

# 等待用户中断
wait
