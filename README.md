# 海鲜零售预订与价格查询系统

## 项目概述

这是一个为海鲜零售个体户开发的客户预订与价格查询系统，支持商品展示、价格查询、预订下单和订单管理功能。系统采用前后端分离架构，先以 Web App 形式开发，后续可适配为微信小程序。

## 技术栈

- **后端**: FastAPI + SQLModel + SQLite
- **前端**: React + Vite + Tailwind CSS

## 项目结构

```
├── backend/              # 后端代码
│   ├── main.py           # 主应用文件
│   ├── models.py         # 数据库模型
│   ├── test_api.py       # API 测试
│   ├── requirements.txt  # 依赖项
│   └── .env              # 环境变量
├── frontend/             # 前端代码
│   ├── src/              # 源代码
│   │   ├── pages/        # 页面组件
│   │   ├── main.jsx      # 入口文件
│   │   └── App.jsx       # 主应用组件
│   ├── index.html        # HTML 模板
│   └── package.json      # 前端依赖
└── README.md             # 项目说明
```

## 部署说明

### 后端部署

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
   source venv/bin/activate  # macOS/Linux
   # 或
   venv\Scripts\activate  # Windows
   ```

4. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

5. 启动后端服务
   ```bash
   uvicorn main:app --reload
   ```

   后端服务将在 http://localhost:8000 运行，API 文档可在 http://localhost:8000/docs 查看。

### 前端部署

1. 进入前端目录
   ```bash
   cd frontend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动前端开发服务器
   ```bash
   npm run dev
   ```

   前端服务将在 http://localhost:5173 运行。

## 功能说明

### 后端 API

- **GET /products**: 获取商品列表
- **GET /products/{id}**: 获取商品详情
- **POST /products**: 创建商品
- **GET /products/price/search**: 按价格范围查询商品
- **GET /products/price/category**: 按分类查询商品
- **GET /orders**: 获取订单列表
- **GET /orders/{id}**: 获取订单详情
- **POST /orders**: 创建订单

### 前端页面

- **首页**: 商品列表展示
- **商品详情页**: 查看商品详细信息和价格
- **预订页面**: 选择商品、数量和取货时间，提交预订
- **价格查询页面**: 通过搜索或筛选功能查询商品价格
- **订单管理页面**: 查看所有预订订单，包含订单详情和状态

## 注意事项

- 本系统使用 SQLite 作为数据库，无需额外配置数据库服务
- 前端开发时已考虑后续适配微信小程序的可行性
- 系统仅用于预订，不处理在线支付
- 所有预订均为到店取货，不涉及配送

## 后续优化方向

- 添加商品分类管理功能
- 实现订单状态跟踪
- 增加库存管理系统
- 适配微信小程序
- 添加用户认证系统