import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, getCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin'

// 常用海鲜 emoji 图标
const SEAFOOD_EMOJIS = ['🦐', '🦀', '🐟', '🦪', '🦞', '🐙', '🦑', '🐠', '🐡', '🦈', '🐳', '🦭', '🦂', '🍣', '🐚', '🦴', '🍤', '🥡']

// 品类图标组件
function CategoryIcon({ categoryId, icon, className = 'h-10 w-10' }) {
  // 如果有自定义 icon（emoji），优先显示
  if (icon && /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]/.test(icon)) {
    return <span className={`${className} inline-flex items-center justify-center text-2xl`}>{icon}</span>
  }

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

// 品类表单弹窗
function CategoryFormModal({ isOpen, onClose, onSubmit, category, isLoading, mode }) {
  const [formData, setFormData] = useState({
    name: '',
    icon: '🦐',
    description: ''
  })

  // 当编辑品类时，填充表单
  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name || '',
        icon: category.icon || '🦐',
        description: category.description || ''
      })
    } else {
      setFormData({
        name: '',
        icon: '🦐',
        description: ''
      })
    }
  }, [category, mode, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-[#fbf6ef] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* 头部 */}
        <div className="sticky top-0 bg-[#fbf6ef] border-b border-[#eadfce] px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2c241b]">
            {mode === 'edit' ? '编辑品类' : '创建品类'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[#f5f0e8] transition-colors"
          >
            <svg className="w-5 h-5 text-[#8b755d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 品类图标 */}
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              品类图标
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SEAFOOD_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    formData.icon === emoji
                      ? 'bg-[#1f4034] text-white scale-110 shadow-md'
                      : 'bg-white border border-[#eadfce] hover:border-[#ff8b52] hover:bg-[#fff4e8]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#7d6a53]">选择一个图标代表该品类</p>
          </div>

          {/* 品类名称 */}
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              品类名称 <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="请输入品类名称"
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
            />
          </div>

          {/* 品类描述 */}
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              品类描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="请输入品类描述"
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034] resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-[#1f4034] text-white rounded-xl font-medium transition-colors ${
                isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#2a5647]'
              }`}
            >
              {isLoading ? '保存中...' : (mode === 'edit' ? '保存修改' : '创建品类')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 删除品类确认对话框
function DeleteCategoryDialog({ category, productCount, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#fbf6ef] rounded-xl border border-[#eadfce] w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eadfce]">
          <h3 className="text-lg font-semibold text-[#2c241b]">
            删除品类确认
          </h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#8b755d] hover:text-[#2c241b] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 警告提示 */}
          {productCount > 0 && (
            <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#dc2626] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#dc2626] mb-1">
                    该品类下有 {productCount} 个商品
                  </p>
                  <p className="text-sm text-[#991b1b]">
                    删除品类后，这些商品的品类信息将被清空，请先处理关联商品。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 品类信息 */}
          <div className="bg-[#f6efe4] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fff4e8] to-[#ffe8d6] flex items-center justify-center text-[#d67635]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 7.5V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.5l-1.5-2H5a2 2 0 00-2 2v.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 9h18" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2c241b]">{category.name}</p>
                <p className="text-xs text-[#7d6a53]">{category.description}</p>
              </div>
            </div>
          </div>

          {/* 确认提示 */}
          <p className="text-sm text-[#7d6a53]">
            {productCount > 0 
              ? '建议先移除或修改关联商品的品类，再删除此品类。'
              : '确定要删除该品类吗？此操作不可撤销。'}
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-[#eadfce] flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-10 rounded-lg bg-[#f5f0e8] text-[#5c4a36] hover:bg-[#eadfce] transition-all disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || productCount > 0}
            className={`flex-1 h-10 rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-all ${isLoading || productCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
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
function CategoryCard({ category, productCount, onClick, onEdit, onDelete }) {
  const hasEmojiIcon = category.icon && /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]/.test(category.icon)
  return (
    <div className="rounded-[24px] border border-[#eadfce] bg-white/80 p-4 shadow-[0_8px_24px_rgba(94,70,38,0.05)] hover:shadow-[0_12px_32px_rgba(94,70,38,0.1)] hover:border-[#ff8b52]/30 transition-all">
      <div className="flex items-start gap-4">
        {/* 品类图标 */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-[18px] flex items-center justify-center ${hasEmojiIcon ? 'bg-[#f6efe4] text-3xl' : 'bg-gradient-to-br from-[#fff4e8] to-[#ffe8d6] text-[#d67635]'}`}>
          <CategoryIcon categoryId={category.id} icon={category.icon} />
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

        {/* 操作按钮 */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={() => onEdit(category)}
            className="w-8 h-8 rounded-full bg-[#f6efe4] flex items-center justify-center text-[#8b755d] hover:bg-[#eadfce] hover:text-[#2c241b] transition-all"
            title="编辑品类"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(category)}
            className="w-8 h-8 rounded-full bg-[#fef2f2] flex items-center justify-center text-[#dc2626] hover:bg-[#fee2e2] transition-all"
            title="删除品类"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* 点击查看商品 */}
      <button
        onClick={onClick}
        className="mt-3 w-full py-2 rounded-xl bg-[#f6efe4] text-[#8b755d] text-sm font-medium hover:bg-[#eadfce] active:scale-[0.98] transition-all"
      >
        查看商品
      </button>
    </div>
  )
}

// 主组件
function AdminCategories() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      // 前端期望: { id: string (slug), name: string, description: string, icon: string, productCount: number }
      const categoriesWithCounts = categoriesData.map(cat => ({
        id: cat.slug || String(cat.id), // 使用 slug 作为 id，兼容 CategoryIcon
        name: cat.name,
        icon: cat.icon || '',
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

  // 创建品类
  const handleCreateCategory = () => {
    setEditingCategory(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  // 编辑品类
  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  // 提交品类表单（创建或编辑）
  const handleSubmitCategory = async (formData) => {
    setIsSubmitting(true)
    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      
      if (modalMode === 'edit' && editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          icon: formData.icon || '🦐'
        })
      } else {
        await createCategory({
          slug: slug,
          name: formData.name,
          icon: formData.icon || '🦐',
          order: categories.length + 1
        })
      }
      
      setIsModalOpen(false)
      setEditingCategory(null)
      await loadCategories()
    } catch (err) {
      console.error('[AdminCategories] 保存失败:', err)
      alert(err.message || '保存失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 删除品类
  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category)
    setShowDeleteDialog(true)
  }

  // 确认删除品类
  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCategory(categoryToDelete.id)
      
      setShowDeleteDialog(false)
      setCategoryToDelete(null)
      await loadCategories()
    } catch (err) {
      console.error('[AdminCategories] 删除失败:', err)
      alert(err.message || '删除失败，请稍后重试')
    } finally {
      setIsDeleting(false)
    }
  }

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setCategoryToDelete(null)
  }

  // 关闭表单弹窗
  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false)
      setEditingCategory(null)
    }
  }

  // 计算总商品数
  const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="py-4">
      {/* 页面标题 */}
      <div className="mb-5 flex items-center justify-between">
        <div>
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
        <button
          onClick={handleCreateCategory}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1f4034] text-white rounded-full text-sm font-medium hover:bg-[#2a5647] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建品类
        </button>
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
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      )}

      {/* 品类表单弹窗 */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCategory}
        category={editingCategory}
        isLoading={isSubmitting}
        mode={modalMode}
      />

      {/* 删除品类确认对话框 */}
      {showDeleteDialog && categoryToDelete && (
        <DeleteCategoryDialog
          category={categoryToDelete}
          productCount={categoryToDelete.productCount || 0}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isLoading={isDeleting}
        />
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