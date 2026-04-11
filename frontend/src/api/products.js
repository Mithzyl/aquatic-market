const API_BASE = 'http://localhost:8000'

export async function getProducts() {
  const response = await fetch(`${API_BASE}/products`)
  if (!response.ok) throw new Error('Failed to fetch products')
  return response.json()
}

export async function getProductById(id) {
  const response = await fetch(`${API_BASE}/products/${id}`)
  if (!response.ok) throw new Error('Failed to fetch product')
  return response.json()
}

export async function getCategories() {
  const response = await fetch(`${API_BASE}/categories`)
  if (!response.ok) throw new Error('Failed to fetch categories')
  const data = await response.json()
  
  // 数据映射：将后端格式转换为前端期望的格式
  // 后端: { id: 1, slug: "shrimp", name: "虾类", icon: "🦐", order: 1 }
  // 前端期望: { id: "shrimp", name: "虾类", shortName: "虾", icon: "🦐", description: "..." }
  return data.map(cat => ({
    id: cat.slug,
    name: cat.name,
    shortName: cat.name.charAt(0),
    icon: cat.icon,
    description: getCategoryDescription(cat.slug),
    order: cat.order
  }))
}

// 品类描述映射
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