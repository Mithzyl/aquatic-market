// frontend/src/api/orders.js - 订单API（商家端）
import { API_BASE_URL } from './config.js'

/**
 * 创建订单
 * @param {object} orderData - 订单数据
 */
export async function createOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  if (!response.ok) throw new Error('Failed to create order')
  return response.json()
}

/**
 * 获取订单列表（商家端）
 * @param {object} params - 查询参数
 */
export async function getOrders(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.date) queryParams.append('date', params.date)
  if (params.status) queryParams.append('status', params.status)
  
  const queryString = queryParams.toString()
  const endpoint = queryString ? `/api/admin/orders?${queryString}` : '/api/admin/orders'
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`)
  if (!response.ok) throw new Error('Failed to fetch orders')
  return response.json()
}

/**
 * 更新订单状态
 * @param {number|string} orderId - 订单ID
 * @param {string} status - 新状态
 */
export async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  if (!response.ok) throw new Error('Failed to update order status')
  return response.json()
}