# 小程序对齐 Web App — Spec

> 创建日期：2026-05-05
> 分支：`feature/qiniu-object-storage`
> 状态：实施中

---

## 1. 概述

将小程序 7 个页面与已更新的 Web App 对齐，复用 `/api/customer/*` 接口。不作全新开发，聚焦差异修正和功能补全。

---

## 2. 变更清单

### 2.1 首页 (pages/index)

| 变更 | 旧值 | 新值 |
|------|------|------|
| Hero 标签 | `NEW RETAIL SEAFOOD` | `鲜选直达 · 当日到店` |
| Hero 标题 | `当日直采的 海鲜零售首页` | `源头直采 鲜活到家` |
| Hero 副标题 | `把门店鲜度...` | `每日凌晨渔港直发，虾蟹贝鱼分类上架，下单即留货。` |
| 店铺名 | 硬编码 `柳州鲜选海产店` | 动态读取 `merchantConfig.shop_name` |
| 轮播图 | 无 | 新增 Banner 区域，调用 `/api/customer/carousels` |
| 空商家状态文案 | 同 Web App | 对齐即可，大致一致 |

### 2.2 下单页 (pages/price-query)

| 变更 | 说明 |
|------|------|
| 页面标题 | 硬编码品类故事已有兜底文案，确认与 Web App 一致 |
| 品类展示 | 品类计数从后端动态获取，已正确 ✅ |
| 搜索 placeholder | `搜索虾类、黑虎虾、三文鱼...` 保持一致 ✅ |

### 2.3 下单确认 (pages/booking)

| 变更 | 旧值 | 新值 |
|------|------|------|
| user_id | 硬编码 `1` | `app.getUserId()` |
| merchant_id | 硬编码 `2` | `app.globalData.defaultMerchantId` |

### 2.4 商品详情 (pages/product-detail)

| 变更 | 说明 |
|------|------|
| 类别标签 | `海鲜鲜选` → `product.category_name` 动态 |
| 规格占位 | `门店称重` → `product.unit` 动态 |
| 推荐方式 | `门店推荐` → `product.badges[0]` 动态 |
| 服务亮点 | 与 Web App 保持一致 ✅ |

### 2.5 订单管理 (pages/order-list)

| 变更 | 说明 |
|------|------|
| 订单标题 | 当前已正确 `海鲜订单` / `{name}等{n}款鲜货` ✅ |
| 状态文案 | 与 Web App 一致 ✅ |

### 2.6 我的 (pages/profile)

| 变更 | 旧值 | 新值 |
|------|------|------|
| 联系手机 | 硬编码 `400-820-5520` | `merchantConfig.contact_phone` |

### 2.7 登录 (pages/login)

| 变更 | 说明 |
|------|------|
| 页面标题 | `柳州鲜选` ✅ |
| 副标题 | `新鲜海鲜，当日送达` ✅ |
| 验证码 | 模拟 → 保持模拟，后续对接短信 |

---

## 3. 无需变更

| 功能 | 原因 |
|------|------|
| 购物车逻辑 (app.js) | 完整可用 ✅ |
| 认证服务 (services/auth.js) | 完整可用 ✅ |
| 小程序 tabBar 配置 | 4 tab 正确 ✅ |
| API 服务层 (services/product.js) | 接口完整 ✅ |
| 小程序样式 (.wxss) | 设计一致 ✅ |
| 品类图标 (emoji) | 后端可控制 ✅ |

---

## 4. 验收标准

- [ ] 首页 Hero 文案与 Web App 一致
- [ ] 首页展示轮播图 Banner
- [ ] 首页店铺名动态读取
- [ ] 下单确认关联真实 user_id/merchant_id
- [ ] 我的页联系手机从配置读取
- [ ] 所有页面无硬编码占位文字
- [ ] 微信开发者工具编译通过
