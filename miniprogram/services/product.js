// services/product.js - 商品相关 API
const { get } = require('../utils/request')

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
    return data.map(cat => ({
      id: cat.slug,
      name: cat.name,
      shortName: cat.name.charAt(0),
      icon: cat.icon,
      description: cat.description || getCategoryDescription(cat.slug),
      order: cat.order
    }))
  })
}

function getCategoryDescription(slug) {
  const descriptions = {
    shrimp: '鲜活现捞',
    crab: '肥美到店',
    fish: '刺身精选',
    shell: '净选即烹',
    lobster: '宴请招牌'
  }
  return descriptions[slug] || '精选品类'
}

module.exports = {
  getProducts,
  getProductById,
  getCategories
}