// services/order.js - 订单相关 API
const { get, post } = require('../utils/request')

/**
 * 创建订单
 * @param {object} orderData - 订单数据
 */
function createOrder(orderData) {
  return post('/orders', orderData)
}

/**
 * 获取用户订单列表
 * @param {number|string} userId - 用户 ID
 */
function getOrdersByUserId(userId) {
  return get(`/orders/user/${userId}`)
}

module.exports = {
  createOrder,
  getOrdersByUserId
}