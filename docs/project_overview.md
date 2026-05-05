# 水产市场 SaaS 系统 — 项目概览

> 最后更新：2026-05-05  
> 当前分支：`feature/qiniu-object-storage`  
> 最新提交：`956b678 docs: P0 修复完成 — Booking 关联真实用户 + My 动态联系手机`

### 🚫 现阶段排除的功能
| 功能 | 原因 |
|------|------|
| 商家审核管理 | 当前为单商家 SaaS 模式，无需审核流程 |
| 商家入驻 | 商家由平台管理员直接创建 |
| 用户管理详情 | 侧边栏已禁用，待后续需要时开发 |
| 支付 | 后续单独开发 |
| 真实短信验证码 | 当前模拟，后续对接 |

### 🎯 下一阶段：小程序开发

> **设计原则**：小程序基于用户端 Web App 的页面结构和交互逻辑进行实现。复用用户端 API（8002 端口），保证数据口径一致。

| 维度 | 说明 |
|------|------|
| 参考页面 | `frontend/src/pages/` 中的 Home、PriceQuery、ProductDetail、Booking、OrderManagement、My、CustomerLogin |
| 数据源 | 复用 `/api/customer/*` 接口（商品、品类、订单、轮播图、配置） |
| 已有基础 | `miniprogram/pages/` 已有 7 个页面骨架（index/price-query/product-detail/booking/order-list/login/profile） |

---

## 1. 系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                      Nginx (80/443)                          │
│                  反向代理 / SSL 终止                          │
└─────┬──────────────────┬──────────────────┬─────────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
┌──────────┐     ┌──────────┐     ┌──────────────┐
│ Merchant │     │ Customer │     │   Platform   │
│  :8001   │     │  :8002   │     │    :8003     │
│ 商家端API │     │ 用户端API │     │  平台后台API  │
└────┬─────┘     └────┬─────┘     └──────┬───────┘
     │                │                 │
     └────────────────┼─────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  MySQL 8.0   │
              │   :3306      │
              │ aquatic_market│
              └──────────────┘
```

### 三端分离设计

| 服务 | 端口 | 用户角色 | 功能 |
|------|:----:|----------|------|
| **Merchant** | 8001 | 水产店主/员工 | 商品管理、订单处理、收益统计、品类管理、店铺配置、轮播图管理、图片上传 |
| **Customer** | 8002 | C端消费者 | 浏览商品、搜索比价、下单预订、订单查询、个人信息、轮播图展示 |
| **Platform** | 8003 | 平台管理员 | 商家管理、平台统计、轮播图管理、商品管理 |

---

## 2. 技术栈

| 层次 | 技术 | 版本/备注 |
|------|------|-----------|
| **后端框架** | FastAPI (Python) | 三服务独立进程 |
| **ORM** | SQLModel | 基于 SQLAlchemy + Pydantic |
| **认证** | JWT (HS256) | 7 天有效期，RBAC 权限管理 |
| **密码加密** | bcrypt | 管理员/用户密码 |
| **数据库** | MySQL 8.0 (生产) / SQLite (开发) | |
| **前端** | React 18 + Vite | 单仓库多路由 |
| **样式** | Tailwind CSS | |
| **路由** | React Router v6 | 三端路由隔离 |
| **部署** | Docker Compose | 5 容器架构 |
| **反向代理** | Nginx (Alpine) | 生产环境 |
| **小程序** | 微信原生框架 | miniprogram/ |

---

## 3. 目录结构

```
sales/
├── backend/                        # 后端代码
│   ├── main.py                     # 商家端入口（单服务模式）
│   ├── requirements.txt            # Python 依赖
│   ├── config/                     # 配置模块
│   │   ├── database.py             # 数据库连接/引擎/会话
│   │   └── dependencies.py         # 依赖注入（JWT 认证中间件）
│   ├── shared/                     # 共享模块（三服务共用）
│   │   ├── models.py               # 数据模型（12 张表）
│   │   ├── auth.py                 # JWT 认证（创建/验证/中间件）
│   │   ├── database.py             # 数据库引擎（与 config/ 重复）
│   │   └── schemas/                # Pydantic Schema
│   ├── routes/                     # 路由定义
│   │   ├── order_routes.py         # 订单相关（商家端）
│   │   ├── merchant_routes.py      # 商家端路由（/api/merchant/*）
│   │   ├── admin_routes.py         # 管理端路由别名（/api/admin/*）
│   │   ├── product_routes.py       # 商品路由
│   │   └── category_routes.py      # 品类路由
│   ├── services/                   # 业务逻辑层
│   │   ├── merchant_service.py     # 商家端完整业务逻辑
│   │   ├── order_service.py        # 订单服务（通用）
│   │   ├── product_service.py      # 商品服务（通用）
│   │   ├── merchant/               # 商家端微服务（独立进程）
│   │   │   └── Dockerfile
│   │   ├── customer/               # 用户端微服务（独立进程）
│   │   │   ├── main.py             # FastAPI 应用入口
│   │   │   ├── routes/             # 用户端路由
│   │   │   └── Dockerfile
│   │   └── platform/               # 平台后台微服务（独立进程）
│   │       ├── main.py             # FastAPI 应用入口
│   │       ├── routes/             # 平台路由
│   │       └── Dockerfile
│   ├── tests/                      # 后端测试
│   ├── migrate_to_mysql.py         # SQLite → MySQL 迁移脚本
│   └── mysql_migration.sql         # 迁移 SQL 输出
│
├── frontend/                       # 前端代码
│   ├── src/
│   │   ├── App.jsx                 # 主路由（三端 Shell）
│   │   ├── main.jsx                # 入口
│   │   ├── api/                    # API 调用层
│   │   │   ├── config.js           # API 地址 / Token 配置
│   │   │   └── orders.js           # 订单 API
│   │   ├── contexts/               # React Context
│   │   │   ├── AdminAuthContext.jsx
│   │   │   ├── PlatformAuthContext.jsx
│   │   │   └── CustomerAuthContext.jsx
│   │   ├── pages/                  # 页面组件
│   │   │   ├── Home.jsx            # 用户端首页
│   │   │   ├── Booking.jsx         # 下单确认页
│   │   │   ├── PriceQuery.jsx      # 商品搜索/下单
│   │   │   ├── OrderManagement.jsx # 订单管理
│   │   │   ├── My.jsx              # 个人信息
│   │   │   ├── CustomerLogin.jsx   # 用户端登录
│   │   │   ├── admin/              # 商家管理端页面
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── AdminProducts.jsx
│   │   │   │   ├── AdminRevenue.jsx
│   │   │   │   ├── AdminCategories.jsx
│   │   │   │   └── AdminSettings.jsx
│   │   │   └── platform/           # 平台后台页面
│   │   │       ├── PlatformLogin.jsx
│   │   │       ├── PlatformLayout.jsx
│   │   │       ├── PlatformDashboard.jsx
│   │   │       └── PlatformMerchants.jsx
│   │   └── components/             # 通用组件
│   ├── vite.config.js              # Vite 构建配置
│   ├── tailwind.config.js          # Tailwind CSS 配置
│   └── .env                        # 前端环境变量
│
├── miniprogram/                    # 微信小程序
│   ├── pages/                      # 小程序页面
│   ├── utils/                      # 工具函数
│   └── app.js / app.json / app.wxss
│
├── docs/                           # 项目文档
│   ├── specs/                      # 规格设计文档
│   ├── logs/tasks/                 # 任务执行日志
│   └── project_overview.md         # 本文档
│
├── tests/                          # 综合测试
│   ├── test_backend_features.py
│   ├── test_rbac.py
│   └── e2e/                        # E2E 测试截图
│
├── docker-compose.yml              # Docker 编排（5 服务）
├── .env                            # 项目级环境变量（模板）
├── .env.example                    # 环境变量示例
├── .gitignore                      # Git 忽略规则
└── README.md
```

---

## 4. 数据模型（13 张表）

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `merchant` | 商家 | id, name, phone, wechat_openid, shop_name, role_id, is_active |
| `product` | 商品 | id, merchant_id, name, price, image, category, stock, is_active |
| `category` | 品类 | id, merchant_id, slug, name, icon, order |
| `order` | 订单 | id, merchant_id, user_id, customer_name, pickup_time, total_amount, status |
| `orderitem` | 订单明细 | id, order_id, product_id, quantity, unit_price, subtotal |
| `carousel` | 轮播图 | id, merchant_id, title, image_url, link_url, sort_order, is_active |
| `merchantrole` | 商家角色 (RBAC) | id, code, name, permissions(JSON) |
| `merchant_config` | 商家配置 | merchant_id, shop_name, announcement, theme_color, enable_ordering |
| `user` | C端用户 | id, phone, wechat_openid, nickname, default_merchant_id |
| `platform_admin` | 平台管理员 | id, username, password_hash, role, permissions |
| `merchant_operation_log` | 商家操作日志 | merchant_id, admin_id, operation_type, reason |
| `init_lock` | 初始化锁 | lock_name, is_locked (防并发) |

### RBAC 角色体系

| 角色 | code | 权限范围 |
|------|------|----------|
| 店主 | `owner` | product:read/create/update/delete, order:read/update, category:read/create, revenue:read, merchant:read/update |
| 管理员 | `admin` | product:CRUD, order:read/update, category:read/create, revenue:read, merchant:read |
| 员工 | `staff` | product:read, order:read/update, merchant:read |

### 订单状态流转

```
pending → confirmed → ready → completed
    ↓         ↓
    └────── cancelled ←────┘
```

---

## 5. API 路由概览

### 商家端（8001）

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | `/api/merchant/login` | — | 微信授权 / 手机验证码登录 |
| GET | `/api/merchant/products` | JWT | 商品列表 |
| POST | `/api/merchant/products` | JWT | 创建商品 |
| PUT | `/api/merchant/products/{id}` | JWT | 更新商品 |
| DELETE | `/api/merchant/products/{id}` | JWT | 删除商品 |
| PATCH | `/api/merchant/products/{id}/status` | JWT | 上架/下架 |
| GET | `/api/merchant/categories` | JWT | 品类列表 |
| GET | `/api/merchant/revenue/stats` | JWT | 收益统计 |
| GET | `/api/merchant/orders` | JWT | 订单列表 |
| PUT | `/api/merchant/orders/{id}/status` | JWT | 更新订单状态 |
| GET | `/api/merchant/profile` | JWT | 商家信息 |

> **别名**：以上路径同时挂载在 `/api/admin/*`（功能完全相同）

### 商家端 — 轮播图 & 上传

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| GET | `/api/merchant/carousels` | JWT | 当前商家轮播图列表 |
| POST | `/api/merchant/carousels` | JWT | 创建轮播图 |
| PUT | `/api/merchant/carousels/{id}` | JWT | 更新轮播图 |
| DELETE | `/api/merchant/carousels/{id}` | JWT | 删除轮播图 |
| PATCH | `/api/merchant/carousels/{id}/toggle` | JWT | 启用/禁用 |
| POST | `/api/upload/token` | JWT | 获取七牛云上传凭证 |

### 用户端（8002）

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | `/api/customer/auth/login` | — | 用户登录 |
| GET | `/api/customer/products` | — | 商品列表/搜索 |
| GET | `/api/customer/products/{id}` | — | 商品详情 |
| GET | `/api/customer/categories` | — | 品类列表 |
| GET | `/api/customer/carousels` | — | 启用轮播图列表 |
| POST | `/api/customer/orders` | JWT | 创建订单 |
| GET | `/api/customer/orders/me` | JWT | 我的订单 |
| GET | `/api/customer/config` | — | 商家配置 |

### 平台后台（8003）

| 方法 | 路径 | 认证 | 说明 |
|------|------|:----:|------|
| POST | `/api/platform/auth/login` | — | 管理员登录 |
| GET | `/api/platform/merchants` | JWT | 商家列表 |
| PUT | `/api/platform/merchants/{id}/status` | JWT | 启用/禁用商家 |
| GET | `/api/platform/statistics` | JWT | 平台统计 |
| GET | `/api/platform/carousels` | JWT | 全平台轮播图（分页+筛选） |
| DELETE | `/api/platform/carousels/{id}` | JWT | 删除轮播图 |
| GET | `/api/platform/products` | JWT | 全平台商品（分页+搜索） |
| PATCH | `/api/platform/products/{id}/status` | JWT | 上架/下架商品 |

---

## 6. 前端路由

```
/                         → Home（用户端首页，含轮播图 Banner）
/product/:id              → ProductDetail（商品详情）
/booking                  → Booking（下单确认）
/price-query              → PriceQuery（商品搜索/下单）
/login                    → CustomerLogin（用户登录）
/order-management         → OrderManagement（订单管理）
/my                       → My（个人信息，含头像上传）
/admin                    → AdminLogin（商家登录）
/admin/products           → AdminProducts（商品管理，含图片上传）
/admin/categories         → AdminCategories（品类管理）
/admin/carousels          → AdminCarousels（轮播图管理）
/admin/revenue            → AdminRevenue（收益统计）
/admin/settings           → AdminSettings（店铺设置，含 Logo 上传）
/platform/login           → PlatformLogin（平台登录）
/platform/dashboard       → PlatformDashboard（数据面板）
/platform/merchants       → PlatformMerchants（商家管理）
/platform/carousels       → PlatformCarousels（全平台轮播图管理）
/platform/products        → PlatformProducts（全平台商品管理）
```

### 小程序路由（基于用户端 Web App 设计）

```
pages/index/index          → 首页（对标 Home.jsx：轮播图+品类+热卖）
pages/price-query/index    → 下单页（对标 PriceQuery.jsx：分类+搜索+商品列表）
pages/product-detail/index → 商品详情（对标 ProductDetail.jsx）
pages/booking/index        → 下单确认（对标 Booking.jsx）
pages/order-list/index     → 订单管理（对标 OrderManagement.jsx）
pages/profile/index        → 我的（对标 My.jsx：头像+信息）
pages/login/index          → 登录（对标 CustomerLogin.jsx）
```

### 路由守卫

- **CustomerRouteGuard**：未登录重定向 `/login`
- **AdminRouteGuard**：未登录重定向 `/admin`
- **PlatformRouteGuard**：未登录重定向 `/platform/login`

---

## 7. 部署架构

```
docker-compose --profile production up

容器列表：
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  merchant-api    │  │  customer-api   │  │  platform-api   │
│  Python 3.11     │  │  Python 3.11    │  │  Python 3.11    │
│  uvicorn :8001   │  │  uvicorn :8002  │  │  uvicorn :8003  │
│  Health: /health │  │  Health: /health│  │  Health: /health│
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │        sales-network          │
              ├───────────────────────────────┤
              │  sales-mysql (profile: prod)  │
              │  sales-nginx (profile: prod)  │
              └───────────────────────────────┘
```

### 关键配置

| 配置项 | 生产值 | 说明 |
|--------|--------|------|
| `DATABASE_URL` | `mysql+pymysql://aquatic_user:***@43.134.24.99:3306/aquatic_market` | 生产 MySQL |
| `JWT_SECRET` | 必须在生产环境重新生成 | 强随机 32+ 字符 |
| `WECHAT_DEMO_MODE` | `false` | 必须禁用 |
| `AUTO_CREATE_MERCHANT` | `false` | 必须禁用 |
| `ENVIRONMENT` | `production` | 启用严格 CORS |
| `QINIU_ACCESS_KEY` | 七牛云 AK | 对象存储认证 |
| `QINIU_SECRET_KEY` | 七牛云 SK | 对象存储认证 |
| `QINIU_BUCKET` | `aquatic-sales` | 存储空间名称 |
| `QINIU_DOMAIN` | CDN 域名 | 图片访问域名 |

---

## 8. 环境变量清单

| 变量 | 必填 | 用途 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | 数据库连接串 |
| `JWT_SECRET` | ✅ | JWT 签名密钥（生产必须强随机） |
| `ENVIRONMENT` | — | `development` / `production` |
| `ALLOWED_ORIGINS` | 生产 | CORS 允许的域名 |
| `QINIU_ACCESS_KEY` | ✅ | 七牛云 AccessKey |
| `QINIU_SECRET_KEY` | ✅ | 七牛云 SecretKey |
| `QINIU_BUCKET` | ✅ | 七牛云存储空间 |
| `QINIU_DOMAIN` | ✅ | 七牛云 CDN 域名 |
| `QINIU_REGION` | — | 存储区域，默认 z2 |
| `WECHAT_DEMO_MODE` | — | 演示模式开关 |
| `AUTO_CREATE_MERCHANT` | — | 自动创建商家 |
| `ADMIN_USERNAME` | — | 平台管理员用户名 |
| `ADMIN_PASSWORD` | — | 平台管理员密码 |
| `MYSQL_ROOT_PASSWORD` | 生产 | MySQL root 密码 |
| `MYSQL_DATABASE` | 生产 | 数据库名 |

---

## 9. 当前开发状态

| 优先级 | 数量 | 说明 |
|:------:|:----:|------|
| 🔴 P0 | 3 | Booking 硬编码 user_id/merchant_id、My 联系手机写死、Platform 审核路由空壳 |
| 🟠 P1 | 3 | 下单未关联真实用户、平台超级管理员未初始化、验证码模拟 |
| 🟡 P2 | 2 | 微信登录未对接、小程序功能对齐 |

### 本分支新增功能
| 功能 | 状态 |
|------|:--:|
| 七牛云图片上传（商品/头像/Logo/轮播图） | ✅ |
| 商家端轮播图 CRUD | ✅ |
| 用户端轮播图展示 | ✅ |
| 平台端轮播图管理 | ✅ |
| 平台端商品管理（上下架） | ✅ |
| 营销文案优化 | ✅ |

### 不在范围内
| 功能 | 原因 |
|------|------|
| 审核管理 | 单商家模式，无需审核 |
| 商家入驻 | 管理员直接创建 |
| 支付 | 后续单独开发 |
| 手机验证码 | 后续对接短信服务 |
