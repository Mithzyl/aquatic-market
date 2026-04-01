# 水产菜市 - Aquatic Market

一个完整的全栈水产电商项目，包含前端和后端。

## 项目结构

```
sales/
├── aquatic-web-app/        # 前端项目（React 19 + TypeScript + Tailwind CSS）
└── backend/                # 后端项目（FastAPI + SQLite）
```

## 技术栈

### 前端
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand (状态管理)
- React Router
- Axios (API调用)

### 后端
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic

## 功能特性

- 📱 移动端响应式设计
- 🏠 首页展示（推荐商品、新鲜保障、客户评价）
- 🛍️ 商品列表与分类
- 🔍 商品搜索
- 📦 购物车管理
- 📋 订单管理
- 👤 用户中心
- 💳 支付功能
- 🏷️ 促销活动

## 快速开始

### 前端

1. 进入前端目录
```bash
cd aquatic-web-app
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

前端将在 `http://localhost:5173` 运行

### 后端

1. 进入后端目录
```bash
cd backend
```

2. 创建虚拟环境
```bash
python3 -m venv venv
```

3. 激活虚拟环境
```bash
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

4. 安装依赖
```bash
pip install -r requirements.txt
```

5. 启动后端服务器
```bash
uvicorn app.main:app --reload
```

后端将在 `http://127.0.0.1:8000` 运行

## API 文档

后端启动后，可以通过以下地址访问API文档：
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 部署

### 前端构建
```bash
cd aquatic-web-app
npm run build
```

构建产物将生成在 `dist` 目录

### 后端部署
使用生产级服务器如 Gunicorn 部署：
```bash
cd backend
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 项目特点

- 🌊 海洋主题设计，清新自然
- 📱 移动端优先，响应式布局
- ⚡ 性能优化，流畅体验
- 🔒 安全可靠，数据加密
- 📈 完整的电商功能
- 🎨 精美的UI设计

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
