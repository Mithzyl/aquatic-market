/**
 * 平台后台 API 封装层
 * 统一请求处理，自动注入 Authorization Header
 */

import { API_BASE_URL, API_PREFIX } from './config'

// 平台后台 Token 存储 Key
const PLATFORM_TOKEN_KEY = 'platform_token'
const PLATFORM_ADMIN_KEY = 'platform_admin'

// 平台后台服务端口
const PLATFORM_SERVICE_URL = 'http://localhost:8003'

/**
 * 获取存储的平台后台 Token
 * @returns {string|null}
 */
function getPlatformToken() {
  try {
    return localStorage.getItem(PLATFORM_TOKEN_KEY) || null
  } catch {
    return null
  }
}

/**
 * 清除认证相关存储
 */
function clearPlatformAuthStorage() {
  try {
    localStorage.removeItem(PLATFORM_TOKEN_KEY)
    localStorage.removeItem(PLATFORM_ADMIN_KEY)
    console.log('[PlatformApi] 已清除认证存储')
  } catch (err) {
    console.error('[PlatformApi] 清除存储失败:', err)
  }
}

/**
 * 跳转到登录页
 */
function redirectToPlatformLogin() {
  window.location.href = '/platform/login'
}

/**
 * 统一请求处理函数
 * @param {string} endpoint - API 路径（不含 /api/platform 前缀）
 * @param {Object} options - fetch 选项
 * @returns {Promise<Object>} 响应数据
 */
async function platformRequest(endpoint, options = {}) {
  const token = getPlatformToken()
  const url = `${PLATFORM_SERVICE_URL}${API_PREFIX}/platform${endpoint}`

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
      console.warn('[PlatformApi] 收到 401 响应，Token 无效或已过期')
      clearPlatformAuthStorage()
      redirectToPlatformLogin()
      throw new Error('未授权，请重新登录')
    }

    // 处理其他错误响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '请求失败' }))
      console.error('[PlatformApi] 请求失败:', { status: response.status, error: errorData })
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
    console.error('[PlatformApi] 请求异常:', err.message)
    throw err
  }
}

// ============================================
// 导出的 API 函数
// ============================================

/**
 * 平台管理员登录
 * @param {Object} credentials - 登录凭证 { username, password }
 * @returns {Promise<Object>} { token, admin_id, username, role, permissions }
 */
export async function platformLogin(credentials) {
  console.log('[PlatformApi] 管理员登录请求:', credentials)

  const response = await platformRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })

  // 登录成功后自动存储 Token
  if (response.token) {
    localStorage.setItem(PLATFORM_TOKEN_KEY, response.token)
    localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify({
      id: response.admin_id,
      username: response.username,
      role: response.role,
      permissions: response.permissions
    }))
    console.log('[PlatformApi] 登录成功，Token 已存储')
  }

  return response
}

/**
 * 获取平台概览统计
 * @returns {Promise<Object>} { merchant_count, user_count, product_count, order_count, total_revenue, ... }
 */
export async function getPlatformOverview() {
  return platformRequest('/statistics/overview')
}

/**
 * 获取商家列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @param {string} params.keyword - 搜索关键词
 * @returns {Promise<Object>} { merchants, total }
 */
export async function getMerchants(params = {}) {
  const queryParams = new URLSearchParams()

  if (params.page) {
    queryParams.append('page', params.page)
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size)
  }
  if (params.keyword) {
    queryParams.append('keyword', params.keyword)
  }

  const queryString = queryParams.toString()
  const endpoint = queryString ? `/merchants?${queryString}` : '/merchants'

  return platformRequest(endpoint)
}

/**
 * 获取商家详情
 * @param {number} merchantId - 商家 ID
 * @returns {Promise<Object>} 商家详情
 */
export async function getMerchantDetail(merchantId) {
  return platformRequest(`/merchants/${merchantId}`)
}

/**
 * 获取商家订单
 * @param {number} merchantId - 商家 ID
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} { orders, total }
 */
export async function getMerchantOrders(merchantId, params = {}) {
  const queryParams = new URLSearchParams()

  if (params.page) {
    queryParams.append('page', params.page)
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size)
  }
  if (params.status) {
    queryParams.append('status', params.status)
  }

  const queryString = queryParams.toString()
  const endpoint = queryString 
    ? `/merchants/${merchantId}/orders?${queryString}` 
    : `/merchants/${merchantId}/orders`

  return platformRequest(endpoint)
}

/**
 * 获取商家商品
 * @param {number} merchantId - 商家 ID
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} { products, total }
 */
export async function getMerchantProducts(merchantId, params = {}) {
  const queryParams = new URLSearchParams()

  if (params.page) {
    queryParams.append('page', params.page)
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size)
  }

  const queryString = queryParams.toString()
  const endpoint = queryString 
    ? `/merchants/${merchantId}/products?${queryString}` 
    : `/merchants/${merchantId}/products`

  return platformRequest(endpoint)
}

/**
 * 更新商家状态
 * @param {number} merchantId - 商家 ID
 * @param {Object} data - { is_active, reason }
 * @returns {Promise<Object>} 更新结果
 */
export async function updateMerchantStatus(merchantId, data) {
  return platformRequest(`/merchants/${merchantId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * 获取订单统计
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 订单统计
 */
export async function getOrderStatistics(params = {}) {
  const queryParams = new URLSearchParams()

  if (params.start_date) {
    queryParams.append('start_date', params.start_date)
  }
  if (params.end_date) {
    queryParams.append('end_date', params.end_date)
  }

  const queryString = queryParams.toString()
  const endpoint = queryString 
    ? `/statistics/orders?${queryString}` 
    : '/statistics/orders'

  return platformRequest(endpoint)
}

/**
 * 获取收益统计
 * @returns {Promise<Object>} 收益统计
 */
export async function getRevenueStatistics() {
  return platformRequest('/statistics/revenue')
}

/**
 * 获取用户统计
 * @returns {Promise<Object>} 用户统计
 */
export async function getUserStatistics() {
  return platformRequest('/statistics/users')
}

/**
 * 获取商家统计
 * @returns {Promise<Object>} 商家统计
 */
export async function getMerchantStatistics() {
  return platformRequest('/statistics/merchants')
}

/**
 * 获取当前管理员信息
 * @returns {Promise<Object>} 管理员信息
 */
export async function getPlatformProfile() {
  return platformRequest('/profile')
}

/**
 * 退出登录
 * @returns {Promise<Object>} 退出结果
 */
export async function platformLogout() {
  try {
    await platformRequest('/logout', { method: 'POST' })
  } catch (err) {
    // 即使 API 调用失败，也清除本地状态
    console.warn('[PlatformApi] 退出登录 API 调用失败，但仍清除本地状态')
  }
  clearPlatformAuthStorage()
  redirectToPlatformLogin()
}

// 导出请求函数和常量供高级用途使用
export { 
  platformRequest, 
  getPlatformToken, 
  clearPlatformAuthStorage,
  PLATFORM_TOKEN_KEY,
  PLATFORM_ADMIN_KEY,
  PLATFORM_SERVICE_URL
}