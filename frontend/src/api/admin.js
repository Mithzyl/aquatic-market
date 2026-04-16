/**
 * 商家端 API 封装层
 * 统一请求处理，自动注入 Authorization Header
 */

import { API_BASE_URL, API_PREFIX, ADMIN_TOKEN_KEY, ADMIN_MERCHANT_KEY, LOGIN_ROUTE } from './config'

/**
 * 获取存储的 Admin Token
 * @returns {string|null}
 */
function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || null
  } catch {
    return null
  }
}

/**
 * 清除认证相关存储
 */
function clearAuthStorage() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_MERCHANT_KEY)
    console.log('[AdminApi] 已清除认证存储')
  } catch (err) {
    console.error('[AdminApi] 清除存储失败:', err)
  }
}

/**
 * 跳转到登录页
 */
function redirectToLogin() {
  // 使用 window.location 进行硬跳转，确保完全重置状态
  window.location.href = LOGIN_ROUTE
}

/**
 * 统一请求处理函数
 * @param {string} endpoint - API 路径（不含 /api 前缀）
 * @param {Object} options - fetch 选项
 * @returns {Promise<Object>} 响应数据
 */
async function adminRequest(endpoint, options = {}) {
  const token = getAdminToken()
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // 自动注入 Authorization Header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers
  }

  try {
    const response = await fetch(url, config)

    // 处理 401 未授权 - 自动跳转登录页
    if (response.status === 401) {
      console.warn('[AdminApi] 收到 401 响应，Token 无效或已过期')
      clearAuthStorage()
      redirectToLogin()
      throw new Error('未授权，请重新登录')
    }

    // 处理其他错误响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '请求失败' }))
      console.error('[AdminApi] 请求失败:', { status: response.status, error: errorData })
      throw new Error(errorData.detail || `请求失败 (${response.status})`)
    }

    // 处理空响应
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    return {}

  } catch (err) {
    // 网络错误或其他异常
    if (err.message === '未授权，请重新登录') {
      throw err
    }
    console.error('[AdminApi] 请求异常:', err.message)
    throw err
  }
}

// ============================================
// 导出的 API 函数
// ============================================

/**
 * 商家登录
 * @param {Object} credentials - 登录凭证 { code?, phone?, verify_code? }
 * @returns {Promise<Object>} { token, merchant }
 */
export async function login(credentials) {
  console.log('[AdminApi] 商家登录请求:', credentials)

  const response = await adminRequest('/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })

  // 登录成功后自动存储 Token
  if (response.token && response.merchant) {
    localStorage.setItem(ADMIN_TOKEN_KEY, response.token)
    localStorage.setItem(ADMIN_MERCHANT_KEY, JSON.stringify(response.merchant))
    console.log('[AdminApi] 登录成功，Token 已存储')
  }

  return response
}

/**
 * 获取商家信息
 * @returns {Promise<Object>} 商家信息
 */
export async function getProfile() {
  return adminRequest('/admin/merchant/info')
}

/**
 * 获取商品列表
 * @returns {Promise<Array>} 商品列表
 */
export async function getProducts() {
  return adminRequest('/admin/products')
}

/**
 * 获取收益统计
 * @returns {Promise<Object>} { today, week, month }
 */
export async function getRevenueStats() {
  return adminRequest('/admin/revenue/stats')
}

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @param {string} params.date - 日期筛选 (可选)
 * @param {string} params.status - 状态筛选 (可选)
 * @returns {Promise<Object>} { orders }
 */
export async function getOrders(params = {}) {
  const queryParams = new URLSearchParams()

  if (params.date) {
    queryParams.append('date', params.date)
  }
  if (params.status) {
    queryParams.append('status', params.status)
  }

  const queryString = queryParams.toString()
  const endpoint = queryString ? `/admin/orders?${queryString}` : '/admin/orders'

  return adminRequest(endpoint)
}

/**
 * 更新订单状态
 * @param {string|number} orderId - 订单 ID
 * @param {string} status - 新状态
 * @returns {Promise<Object>} 更新后的订单
 */
export async function updateOrderStatus(orderId, status) {
  return adminRequest(`/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
}

/**
 * 创建商品
 * @param {Object} productData - 商品数据 { name, description, price, image_url, category, stock }
 * @returns {Promise<Object>} 创建的商品
 */
export async function createProduct(productData) {
  console.log('[AdminApi] 创建商品:', productData)
  return adminRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  })
}

/**
 * 更新商品
 * @param {string|number} productId - 商品 ID
 * @param {Object} productData - 更新的商品数据
 * @returns {Promise<Object>} 更新后的商品
 */
export async function updateProduct(productId, productData) {
  console.log('[AdminApi] 更新商品:', productId, productData)
  return adminRequest(`/admin/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  })
}

/**
 * 删除商品
 * @param {string|number} productId - 商品 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteProduct(productId) {
  console.log('[AdminApi] 删除商品:', productId)
  return adminRequest(`/admin/products/${productId}`, {
    method: 'DELETE'
  })
}

/**
 * 获取品类列表
 * @returns {Promise<Object>} { categories }
 */
export async function getCategories() {
  return adminRequest('/admin/categories')
}

// 导出请求函数供高级用途使用
export { adminRequest, getAdminToken }