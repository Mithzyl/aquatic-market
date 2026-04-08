# 商家端管理系统设计规格

**日期**: 2026-04-07
**版本**: v1.0
**状态**: 已确认

---

## 1. 概述

为海鲜零售个体户设计商家端管理系统，支持商家登录后管理商品、品类和查看收益。

## 2. 技术架构

| 项目 | 说明 |
|------|------|
| **入口** | `/admin` (独立于用户端 `/`) |
| **登录** | 独立登录页 + 微信授权 + 服务端鉴权 |
| **布局** | 底部 TabBar (4 个标签) |
| **鉴权** | JWT Token，服务端接口鉴权 |

## 3. 目录结构

```
frontend/src/
├── pages/
│   └── admin/
│       ├── Login.jsx          # 登录页
│       ├── AdminLayout.jsx     # 管理后台布局(TabBar)
│       ├── Products.jsx        # 商品管理
│       ├── Categories.jsx      # 品类管理
│       ├── Revenue.jsx         # 收益查看
│       └── Settings.jsx        # 设置
```

## 4. TabBar 标签

| 标签 | 图标 | 路径 | 功能 |
|------|------|------|------|
| 商品 | grid | /admin/products | 表格列表、上架/下架、编辑、删除 |
| 品类 | folder | /admin/categories | 查看/编辑品类 |
| 收益 | chart | /admin/revenue | 今日/本周/本月统计 + 订单列表 |
| 设置 | cog | /admin/settings | 退出登录、店铺信息 |

## 5. 页面详细设计

### 5.1 登录页 (`/admin`)

**功能**: 商家登录入口

**组件**:
- Logo: 柳州鲜选 · 商家版
- 微信登录按钮 (微信授权)
- 手机号 + 验证码登录表单
- 商家入驻入口链接

**API**:
- `POST /api/admin/login` - 商家登录

### 5.2 商品管理 (`/admin/products`)

**功能**: 管理商品列表

**布局**: 表格列表
- 表头: 商品图片 | 商品名称 | 品类 | 价格 | 库存 | 状态 | 操作
- 支持批量选择
- 右上角新增商品按钮

**功能**:
- 查看商品列表
- 新增商品 (弹窗表单)
- 编辑商品 (弹窗表单)
- 删除商品 (二次确认)
- 上架/下架切换

**API**:
- `GET /api/admin/products` - 获取商品列表
- `POST /api/admin/products` - 新增商品
- `PUT /api/admin/products/{id}` - 编辑商品
- `DELETE /api/admin/products/{id}` - 删除商品

**数据模型**:
```typescript
interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock: number
  is_active: boolean  // 上架/下架状态
  created_at: datetime
  updated_at: datetime
}
```

### 5.3 品类管理 (`/admin/categories`)

**功能**: 管理商品品类

**布局**: 列表 + 拖拽排序

**功能**:
- 查看品类列表
- 编辑品类名称/图标
- 调整品类顺序

**API**:
- `GET /api/admin/categories` - 获取品类列表
- `PUT /api/admin/categories` - 更新品类

**数据模型**:
```typescript
interface Category {
  id: string
  name: string
  icon: string  // SVG 图标 ID
  order: number
}
```

### 5.4 收益查看 (`/admin/revenue`)

**功能**: 查看收益统计

**布局**: 统计卡片 + 订单列表

**组件**:
- 今日收益卡片 (金额 + 同比)
- 本周收益卡片 (金额 + 同比)
- 本月收益卡片 (金额 + 同比)
- 订单列表 (按日期分组)

**API**:
- `GET /api/admin/revenue?period=today|week|month` - 获取收益统计
- `GET /api/admin/orders?date=YYYY-MM-DD` - 获取指定日期订单

**数据模型**:
```typescript
interface RevenueStats {
  today: { amount: number, order_count: number, growth: number }
  week: { amount: number, order_count: number, growth: number }
  month: { amount: number, order_count: number, growth: number }
}
```

### 5.5 设置 (`/admin/settings`)

**功能**: 系统设置

**组件**:
- 商家信息卡片
- 店铺名称
- 联系方式
- 退出登录按钮

**API**:
- `GET /api/admin/profile` - 获取商家信息
- `POST /api/admin/logout` - 退出登录

## 6. 后端 API 规格

### 6.1 认证

```
POST /api/admin/login
Request: { code?: string, phone?: string, verify_code?: string }
Response: { token: string, merchant: MerchantInfo }
```

### 6.2 商品管理

```
GET /api/admin/products
Response: { products: Product[] }

POST /api/admin/products
Request: { name, description, price, image_url, category, stock }
Response: { product: Product }

PUT /api/admin/products/{id}
Request: { name?, description?, price?, image_url?, category?, stock?, is_active? }
Response: { product: Product }

DELETE /api/admin/products/{id}
Response: { success: true }
```

### 6.3 品类管理

```
GET /api/admin/categories
Response: { categories: Category[] }

PUT /api/admin/categories
Request: { categories: Category[] }
Response: { categories: Category[] }
```

### 6.4 收益统计

```
GET /api/admin/revenue?period=today|week|month
Response: { stats: RevenueStats }

GET /api/admin/orders?date=YYYY-MM-DD
Response: { orders: Order[] }
```

## 7. 数据库模型变更

### 新增字段

**Product 表**:
- `stock: int` - 库存数量
- `is_active: bool` - 上架状态 (默认 true)

**新增表: Merchant**:
```python
class Merchant(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(...)
    phone: str = Field(...)
    wechat_openid: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

## 8. 设计约束

- 保持与用户端一致的视觉风格
- 使用现有 Tailwind CSS 配置
- 响应式设计适配手机端
- 考虑后续微信小程序适配

## 9. 待定项

- [ ] 微信授权登录的具体实现（需要微信公众平台配置）
- [ ] 验证码登录的短信服务商选择
- [ ] 图片上传的存储方案
