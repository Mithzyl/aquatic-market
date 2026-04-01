# 水产菜市全栈Web应用 - 完整项目开发规范

## 概述
- **摘要**：开发一个完整的水产菜市全栈Web应用，包含前端（React）和后端（FastAPI）。
- **目的**：为用户提供便捷的水产购买体验，支持线上浏览、下单、支付和自提/配送服务。
- **目标用户**：普通消费者、家庭用户、餐饮商家等需要购买水产品的用户。

## 项目架构
- **前端**：React 19 + TypeScript + Vite + Tailwind CSS + Zustand
- **后端**：FastAPI + SQLAlchemy + SQLite
- **API**：RESTful API
- **UI风格**：海洋主题（玻璃卡片、渐变、动画效果）

## 项目结构
```
/Users/mith/Desktop/project/sales/
├── aquatic-web-app/           # 前端应用
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # Zustand状态管理
│   │   ├── services/        # API服务层
│   │   ├── types/           # TypeScript类型定义
│   │   └── data/            # 静态数据
│   └── ...
├── backend/                  # 后端应用
│   ├── app/
│   │   ├── api/             # API路由
│   │   ├── models.py        # 数据库模型
│   │   ├── schemas.py       # Pydantic模式
│   │   ├── database.py       # 数据库配置
│   │   └── main.py           # 主应用
│   ├── venv/                 # Python虚拟环境
│   └── requirements.txt       # Python依赖
└── ...
```

## 已实现功能

### 前端功能
1. **路由系统** - 完整的页面路由和导航
2. **首页** - Hero区域、精选商品、新鲜保障、客户评价
3. **商品列表** - 左侧分类导航、搜索、商品卡片展示
4. **商品详情** - 商品图片、信息展示、数量选择、加入购物车
5. **购物车** - 商品增删改、数量调整、配送方式选择、结算
6. **订单管理** - 订单列表、状态展示、支付功能
7. **用户中心** - 登录/退出、个人信息、会员等级、积分系统
8. **状态管理** - Zustand stores（products, cart, orders, users）
9. **UI组件** - Header, Footer, ProductCard, CategoryNav
10. **样式系统** - 海洋主题CSS、自定义动画、玻璃效果

### 后端API
1. **商品API** - GET /api/products/, GET /api/products/{id}
2. **促销API** - GET /api/products/promotions/
3. **用户API** - POST /api/users/login, GET /api/users/{id}
4. **订单API** - CRUD操作、支付、取消
5. **购物车API** - 添加、更新、删除、清空

### API端点
```
POST   /api/users/login          # 用户登录/注册
GET    /api/users/{user_id}       # 获取用户信息
POST   /api/users/{user_id}/add-points  # 添加积分

GET    /api/products/            # 获取商品列表（支持分类、搜索筛选）
GET    /api/products/{id}        # 获取单个商品
GET    /api/products/promotions/ # 获取促销列表

GET    /api/orders/             # 获取用户订单
POST   /api/orders/             # 创建订单
POST   /api/orders/{id}/pay     # 支付订单
POST   /api/orders/{id}/cancel  # 取消订单

GET    /api/cart/               # 获取购物车
POST   /api/cart/add            # 添加到购物车
PUT    /api/cart/{id}           # 更新数量
DELETE /api/cart/{id}           # 删除商品
DELETE /api/cart/clear           # 清空购物车
```

## 数据库模型
1. **Product** - 商品表（id, name, category, price, unit, description, image, stock, is_new, freshness, promotion_id）
2. **Promotion** - 促销表（id, product_id, type, discount, promotion_price, title, description, start_date, end_date）
3. **User** - 用户表（id, name, phone, points, level, created_at）
4. **Order** - 订单表（id, user_id, items_json, total_amount, status, delivery_type, pickup_time, address）
5. **CartItem** - 购物车表（id, user_id, product_id, quantity）

## 技术栈

### 前端
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand (状态管理)
- React Router (路由)

### 后端
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- Uvicorn

## 验收标准

### AC-1：商品分类系统 ✅
- 左侧分类导航在桌面端正确显示
- 移动端可收起展开
- 分类切换功能正常

### AC-2：购物车功能 ✅
- 购物车状态管理正确
- 数量调整正常
- 删除功能正常

### AC-3：订单管理 ✅
- 订单创建流程完整
- 订单列表显示正确
- 支付流程完整
- 订单状态更新正确

### AC-4：用户中心 ✅
- 用户信息显示正确
- 会员等级显示正确
- 积分显示正确

### AC-5：响应式设计 ✅
- 移动端布局测试通过
- 平板端布局测试通过
- 分类导航响应式适配

### AC-6：全栈集成 ✅
- 前端成功调用后端API
- 数据持久化到数据库
- CORS配置正确

## 启动说明

### 后端启动
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 前端启动
```bash
cd aquatic-web-app
npm install
npm run dev
```

### 访问地址
- 前端：http://localhost:5173
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

## 备注
- 所有数据存储在 SQLite 数据库中（backend/aquatic_market.db）
- 启动时会自动创建数据库表和示例数据
- 支付功能仅模拟，不实际扣款
