/**
 * 商家端 API 封装层
 * 统一请求处理，自动注入 Authorization Header
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * 获取存储的 Admin Token
 */
function getAdminToken() {
  try {
    return localStorage.getItem('admin_token') || null
  } catch {
    return null
  }
}

/**
 * 统一请求处理函数
 * @param {string} endpoint - API 路径（不含 /api 前缀）
 * @param {Object} options - fetch 选项
 * @returns {Promise<Object>} 响应数据
 */
async function adminRequest(endpoint, options = {}) {
  const token = getAdminToken()

  const url = `${API_BASE_URL}/api${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // 自动注入 Authorization Header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log('[AdminApi] 请求携带 Authorization Header:', endpoint)
  } else {
    console.warn('[AdminApi] 请求未携带 Token:', endpoint)
  }

  const config = {
    ...options,
    headers
  }

  try {
    console.log('[AdminApi] 发起请求:', { url, method: config.method || 'GET' })

    const response = await fetch(url, config)

    // 处理响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '请求失败' }))
      console.error('[AdminApi] 请求失败:', { status: response.status, error: errorData })

      // Token 过期或无效，清除本地存储
      if (response.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_merchant')
        console.warn('[AdminApi] Token 无效，已清除本地存储')
      }

      throw new Error(errorData.detail || `请求失败 (${response.status})`)
    }

    const data = await response.json()
    console.log('[AdminApi] 请求成功:', endpoint)
    return data

  } catch (err) {
    console.error('[AdminApi] 请求异常:', err.message)
    throw err
  }
}

/**
 * 商家登录
 * @param {Object} credentials - 登录凭证 { code?, phone?, verify_code? }
 * @returns {Promise<Object>} { token, merchant }
 */
export async function adminLogin(credentials) {
  console.log('[AdminApi] 商家登录请求:', credentials)

  const data = await adminRequest('/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })

  // 登录成功后自动存储 Token
  if (data.token && data.merchant) {
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_merchant', JSON.stringify(data.merchant))
    console.log('[AdminApi] Token 已存储:', { merchantId: data.merchant.id })
  }

  return data
}

/**
 * 获取商品列表
 * @returns {Promise<Array>} 商品列表
 */
export async function getProducts() {
  return adminRequest('/admin/products')
}

/**
 * 创建商品
 * @param {Object} productData - 商品数据
 * @returns {Promise<Object>} 创建的商品
 */
export async function createProduct(productData) {
  return adminRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  })
}

/**
 * 更新商品
 * @param {number} productId - 商品 ID
 * @param {Object} productData - 更新数据
 * @returns {Promise<Object>} 更新后的商品
 */
export async function updateProduct(productId, productData) {
  return adminRequest(`/admin/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  })
}

/**
 * 删除商品
 * @param {number} productId - 商品 ID
 * @returns {Promise<Object>} { success: true }
 */
export async function deleteProduct(productId) {
  return adminRequest(`/admin/products/${productId}`, {
    method: 'DELETE'
  })
}

/**
 * 更新商品上架状态
 * @param {number} productId - 商品 ID
 * @param {boolean} isActive - 上架状态
 * @returns {Promise<Object>} 更新后的商品
 */
export async function updateProductStatus(productId, isActive) {
  return adminRequest(`/admin/products/${productId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive })
  })
}

/**
 * 获取品类列表
 * @returns {Promise<Array>} 品类列表
 */
export async function getCategories() {
  return adminRequest('/admin/categories')
}

/**
 * 更新品类
 * @param {Array} categories - 品类数据
 * @returns {Promise<Array>} 更新后的品类列表
 */
export async function updateCategories(categories) {
  return adminRequest('/admin/categories', {
    method: 'PUT',
    body: JSON.stringify({ categories })
  })
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
 * @param {string} date - 日期筛选 (可选)
 * @returns {Promise<Object>} { orders }
 */
export async function getOrders(date = null) {
  const endpoint = date ? `/admin/orders?date=${date}` : '/admin/orders'
  return adminRequest(endpoint)
}

/**
 * 获取商家信息
 * @returns {Promise<Object>} 商家信息
 */
export async function getMerchantInfo() {
  return adminRequest('/admin/merchant/info')
}

/**
 * 更新商家信息
 * @param {Object} merchantData - 更新数据
 * @returns {Promise<Object>} 更新后的商家信息
 */
export async function updateMerchantInfo(merchantData) {
  return adminRequest('/admin/merchant/info', {
    method: 'PUT',
    body: JSON.stringify(merchantData)
  })
}

/**
 * 退出登录
 * @returns {Promise<Object>} { success: true }
 */
export async function adminLogout() {
  try {
    const data = await adminRequest('/admin/logout', {
      method: 'POST'
    })
    // 清除本地存储
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_merchant')
    console.log('[AdminApi] 已退出登录，本地存储已清除')
    return data
  } catch (err) {
    // 即使后端请求失败，也清除本地存储
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_merchant')
    console.log('[AdminApi] 退出登录（本地存储已清除）')
    return { success: true }
  }
}

// 导出请求函数供其他模块使用
export { adminRequest, getAdminToken }