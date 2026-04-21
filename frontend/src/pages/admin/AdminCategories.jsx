import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, getCategories } from '../../api/admin'

// 品类图标组件
function CategoryIcon({ categoryId, className = 'h-10 w-10' }) {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }

  if (categoryId === 'shrimp') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6.5 13.5c2.5-5.5 8.5-7.5 11-5 2 2-1 5-4 5H9.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.5 13.5c0 2.5 1.5 4 4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 10.5 5.5 9M7 13.5l-2 .5M8 16l-1 2" />
      </svg>
    )
  } else if (categoryId === 'crab') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 12a4 4 0 1 1 8 0v2H8v-2Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 11 5.5 9M16 11 18.5 9M8 14 5 15.5M16 14l3 1.5M10 8.5 8.5 6.5M14 8.5l1.5-2" />
      </svg>
    )
  } else if (categoryId === 'fish') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5.5 12c2-2.6 4.9-4 8.3-4 2.3 0 4.1.6 5.7 1.9l-2 2.1 2 2.1c-1.6 1.3-3.4 1.9-5.7 1.9-3.4 0-6.3-1.4-8.3-4Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 12h4.5" />
        <circle cx="14.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  } else if (categoryId === 'shell') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 15c0-4.2 2.5-7 6-7s6 2.8 6 7c-2-.7-4-.7-6 0-2-.7-4-.7-6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 8v7M9 9.2l1.5 5M15 9.2l-1.5 5" />
      </svg>
    )
  } else if (categoryId === 'lobster') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 7h6l1.5 4.5L12 17l-4.5-5.5L9 7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 7 7 4.5M15 7 17 4.5" />
      </svg>
    )
  }

  // 默认图标
  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 7.5V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.5l-1.5-2H5a2 2 0 00-2 2v.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 9h18" />
    </svg>
  )
}

// 骨架屏组件
function CategoryCardSkeleton() {
  return (
    <div className="rounded-[24px] border border-[#eadfce] bg-white/80 p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-[18px] bg-[#f2e9dd]" />
        <div className="flex-1 pt-1">
          <div className="h-5 w-16 rounded bg-[#f2e9dd] mb-2" />
          <div className="h-4 w-24 rounded bg-[#f2e9dd]" />
        </div>
        <div className="h-6 w-6 rounded bg-[#f2e9dd]" />
      </div>
    </div>
  )
}

// 空状态组件
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-[#fff4e8] flex items-center justify-center mb-4">
        <svg
          className="h-10 w-10 text-[#d67635]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7.5V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.5l-1.5-2H5a2 2 0 00-2 2v.5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11v4M10 13h4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#2c241b] mb-2">暂无品类数据</h3>
      <p className="text-sm text-[#7d6a53] text-center max-w-[240px]">
        请先在商品管理中添加商品，系统将自动生成品类统计
      </p>
    </div>
  )
}

// 错误状态组件
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4">
        <svg
          className="h-10 w-10 text-[#dc2626]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#2c241b] mb-2">加载失败</h3>
      <p className="text-sm text-[#7d6a53] text-center max-w-[240px] mb-4">
        {message || '无法加载品类数据，请稍后重试'}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl bg-[#ff8b52] text-white text-sm font-semibold hover:bg-[#e67842] active:scale-[0.98] transition-all"
      >
        重新加载
      </button>
    </div>
  )
}

// 品类描述映射
const CATEGORY_DESCRIPTIONS = {
  shrimp: '鲜活现捞',
  crab: '肥美到店',
  fish: '刺身精选',
  shell: '净选即烹',
  lobster: '宴请招牌'
}

// 品类卡片组件
function CategoryCard({ category, productCount, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[24px] border border-[#eadfce] bg-white/80 p-4 shadow-[0_8px_24px_rgba(94,70,38,0.05)] hover:shadow-[0_12px_32px_rgba(94,70,38,0.1)] hover:border-[#ff8b52]/30 active:scale-[0.98] transition-all"
    >
      <div className="flex items-start gap-4">
        {/* 品类图标 */}
        <div className="flex-shrink-0 w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#fff4e8] to-[#ffe8d6] flex items-center justify-center text-[#d67635]">
          <CategoryIcon categoryId={category.id} />
        </div>

        {/* 品类信息 */}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-base font-semibold text-[#2c241b] mb-1">
            {category.name}
          </h3>
          <p className="text-sm text-[#7d6a53] mb-2">
            {category.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f0f7f4] text-xs font-medium text-[#2f6b56]">
              {productCount} 款商品
            </span>
          </div>
        </div>

        {/* 箭头图标 */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f6efe4] flex items-center justify-center text-[#8b755d] mt-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}

// 主组件
function AdminCategories() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [productCounts, setProductCounts] = useState({})

  // 加载商品数据并统计品类
  const loadCategories = async () => {
    setLoading(true)
    setError(null)

    try {
      // 获取商品列表和品类列表
      const [response, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ])
      const products = response.products || response || []

      // 统计每个品类的商品数量（使用 slug 作为品类标识）
      const counts = {}
      products.forEach(product => {
        const categorySlug = product.category
        if (categorySlug) {
          counts[categorySlug] = (counts[categorySlug] || 0) + 1
        }
      })

      setProductCounts(counts)

      // 合并品类信息：将后端格式转换为前端期望格式
      // 后端 admin API: { id: number, slug: string, name: string, icon: string, order: number }
      // 前端期望: { id: string (slug), name: string, description: string, productCount: number }
      const categoriesWithCounts = categoriesData.map(cat => ({
        id: cat.slug || String(cat.id), // 使用 slug 作为 id，兼容 CategoryIcon
        name: cat.name,
        description: CATEGORY_DESCRIPTIONS[cat.slug] || '精选品类',
        productCount: counts[cat.slug] || 0
      }))

      // 按商品数量降序排序
      categoriesWithCounts.sort((a, b) => b.productCount - a.productCount)

      setCategories(categoriesWithCounts)
    } catch (err) {
      console.error('[AdminCategories] 加载失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // 点击品类卡片 - 跳转到商品管理页并带上品类筛选
  const handleCategoryClick = (categoryId) => {
    // 跳转到商品管理页，带上品类筛选参数
    navigate(`/admin/products?category=${categoryId}`)
  }

  // 计算总商品数
  const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="py-4">
      {/* 页面标题 */}
      <div className="mb-5">
        <h1
          className="text-2xl font-bold text-[#2c241b]"
          style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
        >
          品类管理
        </h1>
        <p className="mt-1 text-sm text-[#7d6a53]">
          查看各品类下的商品分布情况
        </p>
      </div>

      {/* 统计卡片 */}
      {!loading && !error && categories.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-[#eadfce] bg-gradient-to-br from-[#fff4e8] to-[#ffe8d6] p-4">
            <p className="text-xs text-[#b17e4b] mb-1">品类总数</p>
            <p className="text-2xl font-bold text-[#2c241b]">{categories.length}</p>
          </div>
          <div className="rounded-[20px] border border-[#eadfce] bg-gradient-to-br from-[#f0f7f4] to-[#e8f4ef] p-4">
            <p className="text-xs text-[#2f6b56] mb-1">商品总数</p>
            <p className="text-2xl font-bold text-[#2c241b]">{totalProducts}</p>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      {loading ? (
        // 加载状态 - 骨架屏
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        // 错误状态
        <ErrorState message={error} onRetry={loadCategories} />
      ) : categories.length === 0 ? (
        // 空状态
        <EmptyState />
      ) : (
        // 品类列表
        <div className="space-y-3">
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              productCount={category.productCount}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>
      )}

      {/* 底部提示 */}
      {!loading && !error && categories.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-[#b5a18a]">
            品类管理，一目了然
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminCategories