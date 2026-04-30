// frontend/src/api/orders.js - 订单API
import { API_BASE_URL, CUSTOMER_API_BASE_URL, CUSTOMER_TOKEN_KEY, ADMIN_TOKEN_KEY } from './config.js'

/**
 * 创建订单（用户端）
 * 通过 Token 认证，user_id 由后端从 Token 自动获取
 * @param {object} orderData - 订单数据（不含 user_id）
 * @param {number} orderData.merchant_id - 商家ID
 * @param {string} orderData.customer_name - 客户姓名
 * @param {string} orderData.customer_phone - 客户电话
 * @param {string} orderData.pickup_time - 取货时间
 * @param {Array} orderData.items - 订单明细
 */
export async function createOrder(orderData) {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  if (!token) {
    throw new Error('请先登录后再提交订单')
  }

  const response = await fetch(`${CUSTOMER_API_BASE_URL}/api/customer/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '创建订单失败' }))
    throw new Error(errorData.detail || errorData.message || '创建订单失败')
  }
  return response.json()
}

/**
 * 获取订单列表（商家端）
 * @param {object} params - 查询参数
 */
export async function getOrders(params = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  const queryParams = new URLSearchParams()
  if (params.date) queryParams.append('date', params.date)
  if (params.status) queryParams.append('status', params.status)
  
  const queryString = queryParams.toString()
  const endpoint = queryString ? `/api/admin/orders?${queryString}` : '/api/admin/orders'
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers })
  if (!response.ok) throw new Error('Failed to fetch orders')
  return response.json()
}

/**
 * 获取用户订单列表（用户端）
 * 通过 token 获取当前用户的订单，不需要 userId 参数
 */
export async function getOrdersByUserId() {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/api/customer/orders/me`, {
    headers
  })
  if (!response.ok) throw new Error('Failed to fetch orders')
  return response.json()
}

/**
 * 更新订单状态（商家端）
 * @param {number|string} orderId - 订单ID
 * @param {string} status - 新状态
 */
export async function updateOrderStatus(orderId, status) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status })
  })
  if (!response.ok) throw new Error('Failed to update order status')
  return response.json()
}