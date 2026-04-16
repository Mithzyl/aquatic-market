// services/order.js - 订单相关 API
const { get, post } = require('../utils/request')

/**
 * 创建订单（需要认证）
 * @param {object} orderData - 订单数据（不含user_id，从Token获取）
 */
function createOrder(orderData) {
  // 移除硬编码的user_id，后端会从Token中获取
  const cleanData = {
    merchant_id: orderData.merchant_id,
    customer_name: orderData.customer_name,
    customer_phone: orderData.customer_phone,
    pickup_time: orderData.pickup_time,
    items: orderData.items
  }
  return post('/orders', cleanData)
}

/**
 * 获取当前用户的订单列表（需要认证）
 */
function getMyOrders() {
  return get('/orders/me')
}

/**
 * 获取订单详情（需要认证）
 * @param {number} orderId - 订单ID
 */
function getOrderById(orderId) {
  return get(`/orders/${orderId}`)
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById
}