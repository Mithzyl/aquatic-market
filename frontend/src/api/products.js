// frontend/src/api/products.js - 商品API（用户端）
import { API_BASE_URL } from './config.js'
import { getCustomerConfig } from './config.js'

// 用户端API地址（端口8002）
const CUSTOMER_API_BASE = 'http://localhost:8002/api/customer'

/**
 * 获取商品列表
 */
export async function getProducts() {
  const response = await fetch(`${CUSTOMER_API_BASE}/products`)
  if (!response.ok) throw new Error('Failed to fetch products')
  return response.json()
}

/**
 * 获取商品详情
 * @param {number|string} id - 商品ID
 */
export async function getProductById(id) {
  const response = await fetch(`${CUSTOMER_API_BASE}/products/${id}`)
  if (!response.ok) throw new Error('Failed to fetch product')
  return response.json()
}

/**
 * 获取分类列表（从配置 API 获取描述）
 */
export async function getCategories() {
  // 先获取分类列表
  const response = await fetch(`${CUSTOMER_API_BASE}/categories`)
  if (!response.ok) throw new Error('Failed to fetch categories')
  const data = await response.json()
  
  // 尝试从配置 API 获取分类描述（不传 merchantId，让后端返回默认商家配置）
  let categoryDescriptions = {}
  try {
    const configData = await getCustomerConfig()
    if (configData.categoryDescriptions) {
      categoryDescriptions = configData.categoryDescriptions
    }
  } catch (error) {
    console.error('[products.js] 获取配置失败，使用默认描述:', error)
    // 使用默认描述
    categoryDescriptions = {
      shrimp: '鲜活现捞',
      crab: '肥美到店',
      fish: '刺身精选',
      shell: '净选即烹',
      lobster: '宴请招牌'
    }
  }
  
  // 数据映射：将后端格式转换为前端期望的格式
  // 后端: { id: "shrimp", name: "虾类", icon: "🦐", order: 1 }
  // 前端期望: { id: "shrimp", name: "虾类", shortName: "虾", icon: "🦐", description: "..." }
  return data.map(cat => ({
    id: cat.id,
    name: cat.name,
    shortName: cat.name.charAt(0),
    icon: cat.icon,
    description: categoryDescriptions[cat.id] || '精选品类',
    order: cat.order
  }))
}