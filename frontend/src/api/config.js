/**
 * API 配置文件
 * 管理 API 请求的基础配置
 */

/**
 * API 基础 URL
 * 优先从环境变量读取，默认使用 localhost
 */
// API配置：商家端服务端口8000
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * 用户端 API 基础 URL（端口 8002）
 * 生产环境通过 VITE_CUSTOMER_API_BASE_URL 环境变量配置
 */
export const CUSTOMER_API_BASE_URL = import.meta.env.VITE_CUSTOMER_API_BASE_URL ?? ''

/**
 * API 路径前缀
 */
export const API_PREFIX = '/api'

/**
 * Token 存储 Key
 */
export const ADMIN_TOKEN_KEY = 'admin_token'

/**
 * 商家信息存储 Key
 */
export const ADMIN_MERCHANT_KEY = 'admin_merchant'

/**
 * 用户端 Token 存储 Key
 */
export const CUSTOMER_TOKEN_KEY = 'customer_token'

/**
 * 用户端用户信息存储 Key
 */
export const CUSTOMER_USER_KEY = 'customer_user'

/**
 * 登录页面路径
 */
export const LOGIN_ROUTE = '/admin/login'

/**
 * 获取用户端配置
 * @param {number|null} merchantId - 商家ID，可选。不传时后端返回首个商家配置或空配置
 * @returns {Promise<Object>} 配置数据，包含 is_empty 字段标识是否有商家
 */
export async function getCustomerConfig(merchantId = null) {
  const url = merchantId 
    ? `${CUSTOMER_API_BASE_URL}/api/customer/config?merchant_id=${merchantId}`
    : `${CUSTOMER_API_BASE_URL}/api/customer/config`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch customer config: ${response.status}`)
  }
  return response.json()
}

/**
 * 获取商家端配置（需要 JWT 认证）
 * @returns {Promise<Object>} 配置数据
 */
export async function getAdminConfig() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (!token) {
    throw new Error('No admin token found')
  }
  
  const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch admin config: ${response.status}`)
  }
  return response.json()
}