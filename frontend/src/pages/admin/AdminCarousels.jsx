import React, { useState, useEffect, useCallback } from 'react'
import { adminRequest, getAdminToken } from '../../api/admin'
import ImageUploader from '../../components/ImageUploader'

// 加载骨架屏
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-[#eadfce] p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-20 h-14 bg-[#f5f0e8] rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#f5f0e8] rounded w-2/3" />
              <div className="h-3 bg-[#f5f0e8] rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// 轮播图表单弹窗
function CarouselModal({ isOpen, onClose, onSubmit, carousel, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    sort_order: 0,
  })

  useEffect(() => {
    if (carousel) {
      setFormData({
        title: carousel.title || '',
        image_url: carousel.image_url || '',
        link_url: carousel.link_url || '',
        sort_order: carousel.sort_order || 0,
      })
    } else {
      setFormData({ title: '', image_url: '', link_url: '', sort_order: 0 })
    }
  }, [carousel, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      sort_order: parseInt(formData.sort_order, 10) || 0,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#fbf6ef] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-[#fbf6ef] border-b border-[#eadfce] px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2c241b]">
            {carousel ? '编辑轮播图' : '新增轮播图'}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-[#f5f0e8] transition-colors">
            <svg className="w-5 h-5 text-[#8b755d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              标题 <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="请输入轮播图标题"
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">
              轮播图片 <span className="text-[#dc2626]">*</span>
            </label>
            <ImageUploader
              value={formData.image_url}
              onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              folder="carousels"
              token={getAdminToken()}
              placeholder="上传轮播图片"
              previewSize="w-full h-40"
              maxSizeMB={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">跳转链接</label>
            <input
              type="text"
              value={formData.link_url}
              onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
              placeholder="/products 或留空不跳转"
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2c241b] mb-1.5">排序序号</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
              min="0"
              placeholder="0"
              className="w-full px-4 py-2.5 bg-white border border-[#eadfce] rounded-xl text-sm text-[#2c241b] placeholder-[#c9a87c] focus:outline-none focus:border-[#1f4034] focus:ring-1 focus:ring-[#1f4034]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-[#1f4034] text-white rounded-xl font-medium transition-colors ${
                isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#2a5647]'
              }`}
            >
              {isLoading ? '保存中...' : (carousel ? '保存修改' : '添加轮播图')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 轮播图卡片
function CarouselCard({ carousel, onEdit, onToggle, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-[#eadfce] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-3">
        {/* 缩略图 */}
        <div className="w-24 h-16 rounded-lg overflow-hidden bg-[#f5f0e8] flex-shrink-0">
          {carousel.image_url ? (
            <img src={carousel.image_url} alt={carousel.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#d4c4a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[#2c241b] truncate">{carousel.title}</h3>
            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              carousel.is_active ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fff3e0] text-[#e65100]'
            }`}>
              {carousel.is_active ? '启用' : '禁用'}
            </span>
          </div>
          <p className="text-xs text-[#8b755d] mb-2">
            排序: {carousel.sort_order}
            {carousel.link_url && <span className="ml-2">链接: {carousel.link_url}</span>}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onToggle(carousel)}
              className="text-xs px-2 py-1 rounded-md bg-[#f5f0e8] text-[#5c4a36] hover:bg-[#eadfce] transition-colors"
            >
              {carousel.is_active ? '禁用' : '启用'}
            </button>
            <button
              onClick={() => onEdit(carousel)}
              className="text-xs px-2 py-1 rounded-md bg-[#e8f0fb] text-[#2f5e9e] hover:bg-[#d0e0f5] transition-colors"
            >
              编辑
            </button>
            <button
              onClick={async () => {
                if (!window.confirm(`确定要删除轮播图「${carousel.title}」吗？`)) return
                setIsDeleting(true)
                try { await onDelete(carousel.id) } finally { setIsDeleting(false) }
              }}
              disabled={isDeleting}
              className="text-xs px-2 py-1 rounded-md bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] transition-colors disabled:opacity-60"
            >
              {isDeleting ? '...' : '删除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 主组件
function AdminCarousels() {
  const [carousels, setCarousels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCarousel, setEditingCarousel] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCarousels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminRequest('/merchant/carousels')
      setCarousels(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[AdminCarousels] 加载失败:', err)
      setError(err.message || '加载轮播图失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadCarousels() }, [loadCarousels])

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      if (editingCarousel) {
        await adminRequest(`/merchant/carousels/${editingCarousel.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
      } else {
        await adminRequest('/merchant/carousels', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
      }
      setIsModalOpen(false)
      setEditingCarousel(null)
      await loadCarousels()
    } catch (err) {
      alert(err.message || '保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (carousel) => {
    try {
      await adminRequest(`/merchant/carousels/${carousel.id}/toggle`, { method: 'PATCH' })
      await loadCarousels()
    } catch (err) {
      alert(err.message || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await adminRequest(`/merchant/carousels/${id}`, { method: 'DELETE' })
      await loadCarousels()
    } catch (err) {
      alert(err.message || '删除失败')
    }
  }

  return (
    <div className="py-6 space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2c241b]" style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}>
          轮播图管理
        </h1>
        <button
          onClick={() => { setEditingCarousel(null); setIsModalOpen(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1f4034] text-white rounded-full text-sm font-medium hover:bg-[#2a5647] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增
        </button>
      </div>

      {/* 内容区 */}
      {isLoading ? (
        <Skeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-[#8b755d] mb-4">{error}</p>
          <button onClick={loadCarousels} className="px-5 py-2 bg-[#1f4034] text-white rounded-full text-sm">
            重新加载
          </button>
        </div>
      ) : carousels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#fff3e7] flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-[#c9a87c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-[#8b755d] mb-4">暂无轮播图</p>
          <button
            onClick={() => { setEditingCarousel(null); setIsModalOpen(true) }}
            className="px-5 py-2 bg-[#1f4034] text-white rounded-full text-sm font-medium hover:bg-[#2a5647] transition-colors"
          >
            添加第一张轮播图
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {carousels.map((c) => (
            <CarouselCard
              key={c.id}
              carousel={c}
              onEdit={(carousel) => { setEditingCarousel(carousel); setIsModalOpen(true) }}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 弹窗 */}
      <CarouselModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCarousel(null) }}
        onSubmit={handleSubmit}
        carousel={editingCarousel}
        isLoading={isSubmitting}
      />
    </div>
  )
}

export default AdminCarousels
