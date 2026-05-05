import React, { useState, useEffect, useCallback } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, getAdminToken } from '../../api/admin'
import ImageUploader from '../../components/ImageUploader'

// 状态标签颜色映射
const STATUS_CONFIG = {
  active: { label: '上架中', bgClass: 'bg-[#e8f5e9]', textClass: 'text-[#2e7d32]' },
  inactive: { label: '已下架', bgClass: 'bg-[#fff3e0]', textClass: 'text-[#e65100]' }
}

// 加载骨架屏
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#eadfce] overflow-hidden animate-pulse">
      <div className="aspect-square bg-[#f5f0e8]" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#f5f0e8] rounded w-3/4" />
        <div className="h-3 bg-[#f5f0e8] rounded w-1/2" />
        <div className="flex justify-between pt-1">
          <div className="h-5 bg-[#f5f0e8] rounded w-16" />
          <div className="h-5 bg-[#f5f0e8] rounded w-12" />
        </div>
      </div>
    </div>
  )
}

// 空状态组件
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-[#fff3e7] flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-[#c9a87c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#2c241b] mb-2">暂无商品</h3>
      <p className="text-sm text-[#8b755d] text-center mb-6">点击下方按钮添加您的第一个商品</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#1f4034] text-white rounded-full text-sm font-medium hover:bg-[#2a5647] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加商品
      </button>
    </div>
  )
}

// 商品卡片组件
function ProductCard({ product, onEdit, onToggleStatus, onDelete }) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const statusKey = product.is_active ? 'active' : 'inactive'
  const status = STATUS_CONFIG[statusKey]

  const handleToggleStatus = async () => {
    setIsToggling(true)
    try {
      await onToggleStatus(product.id, !product.is_active)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`确定要删除商品「${product.name}」吗？此操作不可撤销。`)) {
      return
    }
    setIsDeleting(true)
    try {
      await onDelete(product.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#eadfce] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* 商品图片 */}
      <div className="aspect-square bg-[#f8f4ee] relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`}
          style={{ display: product.image_url ? 'none' : 'flex' }}
        >
          <svg className="w-12 h-12 text-[#d4c4a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        {/* 状态标签 */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${status.bgClass} ${status.textClass}`}>
          {status.label}
        </div>
      </div>

      {/* 商品信息 */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[#2c241b] truncate mb-0.5">{product.name}</h3>
        {product.category && (
          <p className="text-xs text-[#8b755d] mb-2">{product.category}</p>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-[#c9302c]">¥{Number(product.price).toFixed(2)}</span>
          <span className="text-xs text-[#8b755d]">库存 {product.stock}</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              product.is_active
                ? 'bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2]'
                : 'bg-[#e8f5e9] text-[#2e7d32] hover:bg-[#c8e6c9]'
            } ${isToggling ? 'opacity-60' : ''}`}
          >
            {isToggling ? '处理中...' : (product.is_active ? '下架' : '上架')}
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex-1 py-2 bg-[#f5f0e8] text-[#5c4a36] rounded-lg text-xs font-medium hover:bg-[#eadfce] transition-colors"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`py-2 px-3 bg-[#fef2f2] text-[#dc2626] rounded-lg text-xs font-medium hover:bg-[#fee2e2] transition-colors ${isDeleting ? 'opacity-60' : ''}`}
          >
            {isDeleting ? '...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 商品表单弹窗
function ProductModal({ isOpen, onClose, onSubmit, product, categories, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: ''
  })

  // 当编辑商品时，填充表单
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price ? String(product.price) : '',
        image_url: product.image_url || '',
        category: product.category || '',
        stock: product.stock ? String(product.stock) : ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: '',
        stock: ''
      })
    }
  }, [product, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0
    })
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
            {product ? '编辑商品' : '新增商品'}
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
          {/* 商品名称 */}
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              商品名称 <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="请输入商品名称"
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
            />
          </div>

          {/* 商品描述 */}
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              商品描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="请输入商品描述"
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034] resize-none"
            />
          </div>

          {/* 价格和库存 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
                价格 <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
                库存 <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                placeholder="0"
                className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
              />
            </div>
          </div>

          {/* 品类选择 */}
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              品类
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
            >
              <option value="">请选择品类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 商品图片上传 */}
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              商品图片
            </label>
            <ImageUploader
              value={formData.image_url}
              onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              folder="products"
              token={getAdminToken()}
              placeholder="上传商品图片"
              previewSize="w-full h-32"
              maxSizeMB={5}
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
              {isLoading ? '保存中...' : (product ? '保存修改' : '添加商品')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 错误状态组件
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[#2c241b] mb-1">加载失败</h3>
      <p className="text-sm text-[#8b755d] text-center mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 bg-[#1f4034] text-white rounded-full text-sm font-medium hover:bg-[#2a5647] transition-colors"
      >
        重新加载
      </button>
    </div>
  )
}

// 主组件
function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 加载商品列表和品类
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getCategories()
      ])
      // 处理 API 返回格式
      setProducts(productsRes.products || productsRes || [])
      setCategories(categoriesRes.categories || categoriesRes || [])
    } catch (err) {
      console.error('[AdminProducts] 加载失败:', err)
      setError(err.message || '加载商品列表失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 新增商品
  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  // 编辑商品
  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  // 提交表单（新增或编辑）
  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      if (editingProduct) {
        // 编辑模式
        await updateProduct(editingProduct.id, formData)
      } else {
        // 新增模式
        await createProduct(formData)
      }
      setIsModalOpen(false)
      setEditingProduct(null)
      // 重新加载列表
      await loadData()
    } catch (err) {
      console.error('[AdminProducts] 保存失败:', err)
      alert(err.message || '保存失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 切换上架/下架状态
  const handleToggleStatus = async (productId, newStatus) => {
    try {
      await updateProduct(productId, { is_active: newStatus })
      // 更新本地状态
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, is_active: newStatus } : p
        )
      )
    } catch (err) {
      console.error('[AdminProducts] 状态切换失败:', err)
      alert(err.message || '操作失败，请稍后重试')
    }
  }

  // 删除商品
  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId)
      // 从本地列表移除
      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch (err) {
      console.error('[AdminProducts] 删除失败:', err)
      alert(err.message || '删除失败，请稍后重试')
    }
  }

  // 关闭弹窗
  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false)
      setEditingProduct(null)
    }
  }

  return (
    <div className="py-4">
      {/* 页面标题和新增按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#2c241b]">商品管理</h1>
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1f4034] text-white rounded-full text-sm font-medium hover:bg-[#2a5647] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增商品
        </button>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        // 加载状态
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        // 错误状态
        <ErrorState message={error} onRetry={loadData} />
      ) : products.length === 0 ? (
        // 空状态
        <EmptyState onAdd={handleAddProduct} />
      ) : (
        // 商品列表
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteProduct}
            />
          ))}
        </div>
      )}

      {/* 商品弹窗 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        product={editingProduct}
        categories={categories}
        isLoading={isSubmitting}
      />
    </div>
  )
}

export default AdminProducts