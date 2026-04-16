/**
 * 平台后台商家管理页
 * 展示商家列表，支持搜索筛选
 */
import React, { useState, useEffect } from 'react'
import { getMerchants, getMerchantDetail } from '../../api/platform'

// 商家状态标签
const statusLabels = {
  active: { text: '正常', color: 'bg-green-500/10 text-green-400' },
  inactive: { text: '禁用', color: 'bg-red-500/10 text-red-400' },
  pending: { text: '待审核', color: 'bg-yellow-500/10 text-yellow-400' },
}

// 商家详情弹窗
function MerchantDetailModal({ merchant, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (!merchant) return null

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

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
          >
            关闭
          </button>
          <button
            className="flex-1 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
            onClick={() => {
              // TODO: 跳转到商家详情页
              onClose()
            }}
          >
            查看更多
          </button>
        </div>
      </div>
    </div>
  )
}

// 商家列表项
function MerchantRow({ merchant, onViewDetail }) {
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
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusLabels.active.color}`}>
              {statusLabels.active.text}
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

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetail(merchant)}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            详情
          </button>
        </div>
      </div>
    </div>
  )
}

// 加载骨架屏
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
    setPage(1) // 重置页码
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

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setSelectedMerchant(null)
  }

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          商家管理
        </h1>
        <div className="text-sm text-slate-400">
          共 {total} 个商家
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          {/* 搜索输入 */}
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

          {/* 搜索按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            搜索
          </button>

          {/* 清除按钮 */}
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
          // 骨架屏
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : merchants.length === 0 ? (
          // 空状态
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
          // 商家列表
          merchants.map((merchant) => (
            <MerchantRow
              key={merchant.id}
              merchant={merchant}
              onViewDetail={handleViewDetail}
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
            {/* 上一页 */}
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              上一页
            </button>

            {/* 页码 */}
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

            {/* 下一页 */}
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

      {/* 商家详情弹窗 */}
      {selectedMerchant && (
        <MerchantDetailModal
          merchant={selectedMerchant}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}

export default PlatformMerchants