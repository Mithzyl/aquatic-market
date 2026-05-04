/**
 * 平台后台商家管理页
 * 展示商家列表，支持搜索筛选、新增、编辑、删除
 */
import React, { useState, useEffect } from 'react'
import { getMerchants, getMerchantDetail, updateMerchantStatus, getMerchantOrders, createMerchant, updateMerchant, deleteMerchant } from '../../api/platform'

// 商家状态标签
const statusLabels = {
  active: { text: '正常', color: 'bg-green-500/10 text-green-400' },
  inactive: { text: '禁用', color: 'bg-red-500/10 text-red-400' },
  pending: { text: '待审核', color: 'bg-yellow-500/10 text-yellow-400' },
}

// ============================================
// 新增商家弹窗 (N04)
// ============================================
function CreateMerchantModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    shop_name: '',
    name: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    // 清除对应字段错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (serverError) setServerError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.username.trim()) newErrors.username = '请输入用户名'
    if (!form.password.trim()) newErrors.password = '请输入密码'
    else if (form.password.length < 6) newErrors.password = '密码至少6位'
    if (!form.shop_name.trim()) newErrors.shop_name = '请输入店铺名称'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    setServerError('')
    try {
      await createMerchant({
        username: form.username.trim(),
        password: form.password,
        shop_name: form.shop_name.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
      })
      onSuccess()
    } catch (err) {
      setServerError(err.message || '创建失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enter 键提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            新增商家
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-4">
          {/* 服务端错误 */}
          {serverError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          {/* 用户名 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              用户名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={handleChange('username')}
              onKeyDown={handleKeyDown}
              placeholder="商家登录用户名"
              className={`w-full h-10 px-3 rounded-lg bg-slate-700 border ${errors.username ? 'border-red-500' : 'border-slate-600'} text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
            />
            {errors.username && (
              <p className="text-xs text-red-400 mt-1">{errors.username}</p>
            )}
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              密码 <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              onKeyDown={handleKeyDown}
              placeholder="至少6位"
              className={`w-full h-10 px-3 rounded-lg bg-slate-700 border ${errors.password ? 'border-red-500' : 'border-slate-600'} text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
            />
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password}</p>
            )}
          </div>

          {/* 店铺名称 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              店铺名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.shop_name}
              onChange={handleChange('shop_name')}
              onKeyDown={handleKeyDown}
              placeholder="对外展示的店铺名"
              className={`w-full h-10 px-3 rounded-lg bg-slate-700 border ${errors.shop_name ? 'border-red-500' : 'border-slate-600'} text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
            />
            {errors.shop_name && (
              <p className="text-xs text-red-400 mt-1">{errors.shop_name}</p>
            )}
          </div>

          {/* 联系人 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              联系人 <span className="text-slate-600">（选填）</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              onKeyDown={handleKeyDown}
              placeholder="联系人姓名"
              className="w-full h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* 手机号 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              手机号 <span className="text-slate-600">（选填）</span>
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={handleChange('phone')}
              onKeyDown={handleKeyDown}
              placeholder="联系电话"
              className="w-full h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all ${isSubmitting ? 'opacity-50' : ''}`}
          >
            {isSubmitting ? '创建中...' : '确认创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 删除商家确认对话框 (N06)
// ============================================
function DeleteMerchantDialog({ merchant, onConfirm, onCancel, isLoading, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            删除商家确认
          </h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 警告提示 */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400 mb-1">
                  此操作不可撤销！
                </p>
                <ul className="text-sm text-red-300 space-y-1">
                  <li>• 商家所有数据将被永久删除</li>
                  <li>• 包括商品、订单、配置等关联数据</li>
                  <li>• 如有未完成订单将无法删除</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 商家信息 */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold">
                {merchant.shop_name?.charAt(0) || '店'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{merchant.shop_name}</p>
                <p className="text-xs text-slate-400">{merchant.name || '未知'} · {merchant.phone || '无'}</p>
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* 确认提示 */}
          <p className="text-sm text-slate-400">
            确定要删除该商家吗？此操作不可撤销。
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-10 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all ${isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 禁用商家确认对话框（保留现有功能）
// ============================================
function DisableMerchantDialog({ merchant, pendingOrders, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            禁用商家确认
          </h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 警告提示 */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400 mb-1">
                  禁用商家将产生以下影响：
                </p>
                <ul className="text-sm text-red-300 space-y-1">
                  <li>• 商家将无法登录后台管理系统</li>
                  <li>• 商家的所有商品将自动下架</li>
                  {pendingOrders > 0 && (
                    <li className="font-semibold">• {pendingOrders} 个待处理订单将被自动取消</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* 商家信息 */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                {merchant.shop_name?.charAt(0) || '店'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{merchant.shop_name}</p>
                <p className="text-xs text-slate-400">{merchant.name} · {merchant.phone}</p>
              </div>
            </div>
          </div>

          {/* 确认提示 */}
          <p className="text-sm text-slate-400">
            确定要禁用该商家吗？此操作可以撤销，但已取消的订单无法恢复。
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-10 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all ${isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading ? '处理中...' : '确认禁用'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 商家详情弹窗 (N05: 升级为支持编辑模式)
// ============================================
function MerchantDetailModal({ merchant, onClose, onToggleStatus, onDelete, onMerchantUpdated, isToggling }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    shop_name: '',
    name: '',
    phone: '',
    password: '',
    address: '',
    business_hours: '',
    contact_phone: '',
    announcement: '',
    theme_color: '#1890ff',
    enable_ordering: true,
    enable_pickup: true,
    min_order_amount: 0,
  })

  const loadDetail = React.useCallback(async () => {
    if (!merchant?.id) return
    setLoading(true)
    try {
      const data = await getMerchantDetail(merchant.id)
      setDetail(data)
    } catch (err) {
      console.error('[MerchantDetail] 加载详情失败:', err.message)
    } finally {
      setLoading(false)
    }
  }, [merchant?.id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  // 进入编辑模式：初始化表单
  const handleEnterEdit = () => {
    setEditForm({
      shop_name: detail?.shop_name || merchant.shop_name || '',
      name: detail?.name || merchant.name || '',
      phone: detail?.phone || merchant.phone || '',
      password: '',
      address: '',
      business_hours: '',
      contact_phone: '',
      announcement: '',
      theme_color: '#1890ff',
      enable_ordering: true,
      enable_pickup: true,
      min_order_amount: 0,
    })
    setSaveError('')
    setIsEditing(true)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
    setSaveError('')
  }

  // 更新编辑表单字段
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
    if (saveError) setSaveError('')
  }

  // 保存编辑
  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')
    try {
      // 只发送有变化的字段
      const payload = {}
      if (editForm.shop_name !== (detail?.shop_name || merchant.shop_name || '')) {
        payload.shop_name = editForm.shop_name
      }
      if (editForm.name !== (detail?.name || merchant.name || '')) {
        payload.name = editForm.name
      }
      if (editForm.phone !== (detail?.phone || merchant.phone || '')) {
        payload.phone = editForm.phone
      }
      // 密码（填写了才发送）
      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim()
      }
      // config 字段始终发送（后端 upsert）
      payload.address = editForm.address
      payload.business_hours = editForm.business_hours
      payload.contact_phone = editForm.contact_phone
      payload.announcement = editForm.announcement
      payload.theme_color = editForm.theme_color
      payload.enable_ordering = editForm.enable_ordering
      payload.enable_pickup = editForm.enable_pickup
      payload.min_order_amount = parseFloat(editForm.min_order_amount) || 0

      await updateMerchant(merchant.id, payload)
      setIsEditing(false)
      // 刷新详情和列表
      await loadDetail()
      if (onMerchantUpdated) onMerchantUpdated()
    } catch (err) {
      setSaveError(err.message || '保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  if (!merchant) return null

  const isActive = merchant.is_active !== false

  // ============== 编辑模式 ==============
  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-white">
              编辑商家信息
            </h3>
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 表单内容（可滚动） */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* 保存错误 */}
            {saveError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{saveError}</p>
              </div>
            )}

            {/* 基本信息区 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider">基本信息</h4>
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">店铺名称</label>
                  <input
                    type="text"
                    value={editForm.shop_name}
                    onChange={(e) => handleEditChange('shop_name', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">联系人</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">手机号</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    新密码 <span className="text-slate-500">（选填，不填则不修改）</span>
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => handleEditChange('password', e.target.value)}
                    placeholder="至少6位，留空不修改"
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 店铺配置区 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider">店铺配置</h4>
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">店铺地址</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    placeholder="如：XX市XX区XX路XX号"
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">营业时间</label>
                  <input
                    type="text"
                    value={editForm.business_hours}
                    onChange={(e) => handleEditChange('business_hours', e.target.value)}
                    placeholder="如：08:00-20:00"
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">联系电话</label>
                  <input
                    type="text"
                    value={editForm.contact_phone}
                    onChange={(e) => handleEditChange('contact_phone', e.target.value)}
                    placeholder="对外展示的联系电话"
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">店铺公告</label>
                  <textarea
                    value={editForm.announcement}
                    onChange={(e) => handleEditChange('announcement', e.target.value)}
                    placeholder="店铺公告内容"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">主题色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.theme_color}
                      onChange={(e) => handleEditChange('theme_color', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-600 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editForm.theme_color}
                      onChange={(e) => handleEditChange('theme_color', e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Toggle 开关 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">开启下单</span>
                  <button
                    type="button"
                    onClick={() => handleEditChange('enable_ordering', !editForm.enable_ordering)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editForm.enable_ordering ? 'bg-blue-500' : 'bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editForm.enable_ordering ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">开启自提</span>
                  <button
                    type="button"
                    onClick={() => handleEditChange('enable_pickup', !editForm.enable_pickup)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editForm.enable_pickup ? 'bg-blue-500' : 'bg-slate-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editForm.enable_pickup ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最低订单金额 (元)</label>
                  <input
                    type="number"
                    value={editForm.min_order_amount}
                    onChange={(e) => handleEditChange('min_order_amount', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 border-t border-slate-700 flex gap-3 flex-shrink-0">
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="flex-1 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all ${isSaving ? 'opacity-50' : ''}`}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============== 查看模式 ==============
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            商家详情
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {/* 基本信息 */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">店铺名称</span>
                  <span className="text-sm font-medium text-white">{detail?.shop_name || merchant.shop_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">联系人</span>
                  <span className="text-sm font-medium text-white">{detail?.name || merchant.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">手机号</span>
                  <span className="text-sm font-medium text-white">{detail?.phone || merchant.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">状态</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isActive ? '正常' : '已禁用'}
                  </span>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">商品数量</p>
                  <p className="text-xl font-bold text-blue-400">{detail?.product_count || 0}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-1">订单数量</p>
                  <p className="text-xl font-bold text-green-400">{detail?.order_count || 0}</p>
                </div>
              </div>

              {/* 时间信息 */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">入驻时间</span>
                  <span className="text-sm text-white">
                    {detail?.created_at ? new Date(detail.created_at).toLocaleDateString('zh-CN') : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">更新时间</span>
                  <span className="text-sm text-white">
                    {detail?.updated_at ? new Date(detail.updated_at).toLocaleDateString('zh-CN') : '-'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部按钮: [关闭] [编辑] [删除] */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
          >
            关闭
          </button>
          <button
            onClick={handleEnterEdit}
            className="flex-1 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
          >
            编辑
          </button>
          <button
            onClick={() => onDelete(merchant)}
            className="flex-1 h-10 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 商家列表项 (N04: 增加编辑/删除按钮)
// ============================================
function MerchantRow({ merchant, onViewDetail, onEdit, onDelete }) {
  const isActive = merchant.is_active !== false
  const statusKey = isActive ? 'active' : 'inactive'
  const status = statusLabels[statusKey]

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-all">
      <div className="flex items-start gap-4">
        {/* 店铺头像 */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
          {merchant.shop_name?.charAt(0) || '店'}
        </div>

        {/* 基本信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-white truncate">
              {merchant.shop_name}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>
              {status.text}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-2">
            {merchant.name} · {merchant.phone}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>ID: {merchant.id}</span>
            <span>入驻: {new Date(merchant.created_at).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* 操作按钮: [详情] [编辑] [删除] */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewDetail(merchant)}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            详情
          </button>
          <button
            onClick={() => onEdit(merchant)}
            className="px-3 py-1.5 rounded-lg text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-all"
          >
            编辑
          </button>
          <button
            onClick={() => onDelete(merchant)}
            className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 transition-all"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 加载骨架屏
// ============================================
function SkeletonRow() {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-700 rounded-xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-48 bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// 主组件
// ============================================
function PlatformMerchants() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [merchants, setMerchants] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [merchantToDisable, setMerchantToDisable] = useState(null)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // N04: 新增弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  // N06: 删除对话框状态
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [merchantToDelete, setMerchantToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadMerchants = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        page,
        page_size: pageSize,
      }

      if (keyword) {
        params.keyword = keyword
      }

      const response = await getMerchants(params)
      setMerchants(response.merchants || [])
      setTotal(response.total || 0)
    } catch (err) {
      console.error('[PlatformMerchants] 加载商家列表失败:', err.message)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword])

  // 加载商家列表
  useEffect(() => {
    loadMerchants()
  }, [loadMerchants])

  // 搜索提交
  const handleSearch = (e) => {
    e.preventDefault()
    setKeyword(searchInput)
    setPage(1)
  }

  // 清除搜索
  const handleClearSearch = () => {
    setSearchInput('')
    setKeyword('')
    setPage(1)
  }

  // 查看详情
  const handleViewDetail = (merchant) => {
    setSelectedMerchant(merchant)
  }

  // 编辑商家（打开详情弹窗）
  const handleEditClick = (merchant) => {
    setSelectedMerchant(merchant)
  }

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setSelectedMerchant(null)
  }

  // 商家更新后回调
  const handleMerchantUpdated = () => {
    loadMerchants()
  }

  // ============== N04: 新增商家 ==============
  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    // 跳到最后一页
    const newTotal = total + 1
    const lastPage = Math.ceil(newTotal / pageSize)
    setPage(lastPage)
  }

  const handleCreateCancel = () => {
    setShowCreateModal(false)
  }

  // ============== N06: 删除商家 ==============
  const handleDeleteClick = (merchant) => {
    setMerchantToDelete(merchant)
    setDeleteError('')
    setShowDeleteDialog(true)
    // 关闭详情弹窗（如果打开的是同一个商家）
    if (selectedMerchant && selectedMerchant.id === merchant.id) {
      setSelectedMerchant(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!merchantToDelete) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteMerchant(merchantToDelete.id, false)
      setShowDeleteDialog(false)
      setMerchantToDelete(null)
      // 刷新列表
      await loadMerchants()
      // 如果当前页没有数据了，回到上一页
      // （loadMerchants 会更新 total 和 merchants）
    } catch (err) {
      // 后端 409 返回 detail: "商家有 X 个未完成订单，无法删除..."
      if (err.message && err.message.includes('未完成订单')) {
        setDeleteError('无法删除：该商家有未完成订单，请先处理订单后再试')
      } else {
        setDeleteError(err.message || '删除失败，请稍后重试')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setMerchantToDelete(null)
    setDeleteError('')
  }

  // ============== 启用/禁用商家（保留） ==============
  const handleToggleStatusClick = async (merchant) => {
    const isActive = merchant.is_active !== false
    
    if (isActive) {
      try {
        const ordersData = await getMerchantOrders(merchant.id, { status: 'pending' })
        const pendingCount = ordersData.orders?.length || 0
        setPendingOrdersCount(pendingCount)
        setMerchantToDisable(merchant)
        setShowDisableDialog(true)
      } catch (err) {
        console.error('[PlatformMerchants] 获取订单失败:', err.message)
        setPendingOrdersCount(0)
        setMerchantToDisable(merchant)
        setShowDisableDialog(true)
      }
    } else {
      await handleToggleStatusConfirm(merchant.id, true)
    }
  }

  const handleToggleStatusConfirm = async (merchantId, newStatus) => {
    setIsTogglingStatus(true)
    try {
      await updateMerchantStatus(merchantId, {
        is_active: newStatus,
        reason: newStatus ? '平台管理员启用' : '平台管理员禁用'
      })
      
      setMerchants(prev =>
        prev.map(m =>
          m.id === merchantId ? { ...m, is_active: newStatus } : m
        )
      )
      
      if (selectedMerchant && selectedMerchant.id === merchantId) {
        setSelectedMerchant(prev => ({ ...prev, is_active: newStatus }))
      }
      
      setShowDisableDialog(false)
      setMerchantToDisable(null)
      setSelectedMerchant(null)
    } catch (err) {
      console.error('[PlatformMerchants] 状态更新失败:', err.message)
      alert(err.message || '操作失败，请稍后重试')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleCancelDisable = () => {
    setShowDisableDialog(false)
    setMerchantToDisable(null)
    setPendingOrdersCount(0)
  }

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            商家管理
          </h1>
          <div className="text-sm text-slate-400">
            共 {total} 个商家
          </div>
        </div>
        {/* N04: 新增商家按钮 */}
        <button
          onClick={handleCreateClick}
          className="h-10 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增商家
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索店铺名称、联系人、手机号..."
              className="w-full h-10 px-4 pr-10 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            搜索
          </button>

          {keyword && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="h-10 px-4 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
            >
              清除
            </button>
          )}
        </form>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* 商家列表 */}
      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : merchants.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10.5 12 4l8 6.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.5 9.5V19h11V9.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19v-5h4v5" />
            </svg>
            <p className="text-slate-400 mb-2">
              {keyword ? '未找到匹配的商家' : '暂无商家数据'}
            </p>
            {keyword && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                清除搜索条件
              </button>
            )}
          </div>
        ) : (
          merchants.map((merchant) => (
            <MerchantRow
              key={merchant.id}
              merchant={merchant}
              onViewDetail={handleViewDetail}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))
        )}
      </div>

      {/* 分页 */}
      {!loading && total > pageSize && (
        <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-sm text-slate-400">
            显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              上一页
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm transition-all ${
                      page === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* N04: 新增商家弹窗 */}
      {showCreateModal && (
        <CreateMerchantModal
          onClose={handleCreateCancel}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* 商家详情弹窗 */}
      {selectedMerchant && (
        <MerchantDetailModal
          merchant={selectedMerchant}
          onClose={handleCloseDetail}
          onToggleStatus={handleToggleStatusClick}
          onDelete={handleDeleteClick}
          onMerchantUpdated={handleMerchantUpdated}
          isToggling={isTogglingStatus}
        />
      )}

      {/* 禁用商家确认对话框 */}
      {showDisableDialog && merchantToDisable && (
        <DisableMerchantDialog
          merchant={merchantToDisable}
          pendingOrders={pendingOrdersCount}
          onConfirm={() => handleToggleStatusConfirm(merchantToDisable.id, false)}
          onCancel={handleCancelDisable}
          isLoading={isTogglingStatus}
        />
      )}

      {/* N06: 删除商家确认对话框 */}
      {showDeleteDialog && merchantToDelete && (
        <DeleteMerchantDialog
          merchant={merchantToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
          error={deleteError}
        />
      )}
    </div>
  )
}

export default PlatformMerchants