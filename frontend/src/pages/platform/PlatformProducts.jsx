import React, { useState, useEffect, useCallback } from 'react'
import { platformRequest } from '../../api/platform'

// 加载骨架屏
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-slate-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlatformProducts() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [filterMerchant, setFilterMerchant] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [keyword, setKeyword] = useState('')
  const pageSize = 30

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, page_size: pageSize })
      if (filterMerchant) params.append('merchant_id', filterMerchant)
      if (filterActive) params.append('is_active', filterActive)
      if (keyword) params.append('keyword', keyword)

      const data = await platformRequest(`/products?${params}`)
      setProducts(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, filterMerchant, filterActive, keyword])

  useEffect(() => { loadProducts() }, [loadProducts])

  const handleToggle = async (product) => {
    try {
      await platformRequest(`/products/${product.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !product.is_active }),
      })
      loadProducts()
    } catch (err) {
      alert(err.message || '操作失败')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">商品管理</h1>
        <span className="text-sm text-slate-400">共 {total} 件</span>
      </div>

      {/* 筛选栏 */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex gap-3 flex-wrap">
        <input
          type="number" placeholder="商家ID" value={filterMerchant}
          onChange={(e) => { setFilterMerchant(e.target.value); setPage(1) }}
          className="w-24 h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <select value={filterActive} onChange={(e) => { setFilterActive(e.target.value); setPage(1) }}
          className="h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">全部状态</option>
          <option value="true">上架中</option>
          <option value="false">已下架</option>
        </select>
        <input
          type="text" placeholder="搜索商品名..." value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          className="w-40 h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button onClick={loadProducts} className="h-10 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all">
          刷新
        </button>
      </div>

      {/* 内容 */}
      {loading ? <Skeleton /> : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      ) : products.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-400">暂无商品数据</div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{p.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {p.is_active ? '上架' : '下架'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  商家: <span className="text-slate-300">{p.shop_name}</span>
                  <span className="ml-3">¥{p.price}</span>
                  <span className="ml-3">库存: {p.stock}</span>
                  <span className="ml-3">销量: {p.sales}</span>
                  <span className="ml-3">{p.category}</span>
                </p>
              </div>
              <button
                onClick={() => handleToggle(p)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  p.is_active ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
              >
                {p.is_active ? '下架' : '上架'}
              </button>
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

export default PlatformProducts
