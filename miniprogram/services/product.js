// services/product.js - 商品相关 API
const { get } = require('../utils/request')
const config = require('../utils/config')

/**
 * 获取商品列表
 */
function getProducts() {
  return get('/products')
}

/**
 * 获取商品详情
 * @param {number|string} id - 商品 ID
 */
function getProductById(id) {
  return get(`/products/${id}`)
}

/**
 * 获取品类列表
 */
function getCategories() {
  return get('/categories').then(data => {
    // 数据映射：将后端格式转换为前端期望的格式
    // 使用 utils/config.js 中的 categoryDescriptions 配置
    return data.map(cat => ({
      id: cat.slug,
      name: cat.name,
      shortName: cat.name.charAt(0),
      icon: cat.icon,
      description: cat.description || config.categoryDescriptions[cat.slug] || '精选品类',
      order: cat.order
    }))
  })
}

module.exports = {
  getProducts,
  getProductById,
  getCategories
}