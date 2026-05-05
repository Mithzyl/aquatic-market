import React, { useState, useEffect, useCallback } from 'react'
import { platformRequest } from '../../api/platform'

// 加载骨架屏
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-24 h-16 bg-slate-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlatformCarousels() {
  const [carousels, setCarousels] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [filterMerchant, setFilterMerchant] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const pageSize = 30

  const loadCarousels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, page_size: pageSize })
      if (filterMerchant) params.append('merchant_id', filterMerchant)
      if (filterActive) params.append('is_active', filterActive)

      const data = await platformRequest(`/carousels?${params}`)
      setCarousels(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, filterMerchant, filterActive])

  useEffect(() => { loadCarousels() }, [loadCarousels])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`确定要删除轮播图「${title}」吗？`)) return
    try {
      await platformRequest(`/carousels/${id}`, { method: 'DELETE' })
      loadCarousels()
    } catch (err) {
      alert(err.message || '删除失败')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">轮播图管理</h1>
        <span className="text-sm text-slate-400">共 {total} 张</span>
      </div>

      {/* 筛选栏 */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex gap-3 flex-wrap">
        <input
          type="number" placeholder="商家ID筛选" value={filterMerchant}
          onChange={(e) => { setFilterMerchant(e.target.value); setPage(1) }}
          className="w-32 h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <select value={filterActive} onChange={(e) => { setFilterActive(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">全部状态</option>
          <option value="true">已启用</option>
          <option value="false">已禁用</option>
        </select>
        <button onClick={loadCarousels} className="h-10 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all">
          刷新
        </button>
      </div>

      {/* 内容 */}
      {loading ? <Skeleton /> : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      ) : carousels.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-400">暂无轮播图数据</div>
      ) : (
        <div className="space-y-3">
          {carousels.map((c) => (
            <div key={c.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex gap-3">
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                  {c.image_url && <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {c.is_active ? '启用' : '禁用'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    商家: <span className="text-slate-300">{c.shop_name}</span> (ID: {c.merchant_id})
                    <span className="ml-3">排序: {c.sort_order}</span>
                    {c.link_url && <span className="ml-3">链接: {c.link_url}</span>}
                  </p>
                  <button
                    onClick={() => handleDelete(c.id, c.title)}
                    className="mt-2 text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlatformCarousels
