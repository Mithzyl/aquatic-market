import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const mockOrders = [
  {
    id: 'DD2026040201',
    items: [
      { name: '三文鱼刺身', quantity: 2, price: 88 },
      { name: '鲜活龙虾', quantity: 1, price: 198 }
    ],
    customerName: '张三',
    customerPhone: '138****8000',
    pickupTime: '2026-04-03 10:00',
    totalAmount: 374,
    status: 'pending',
    createdAt: '2026-04-02 09:00',
    store: '鲜选海鲜 柳州谷埠街店'
  },
  {
    id: 'DD2026040202',
    items: [
      { name: '鲍鱼', quantity: 3, price: 68 }
    ],
    customerName: '李四',
    customerPhone: '139****9000',
    pickupTime: '2026-04-03 14:00',
    totalAmount: 204,
    status: 'preparing',
    createdAt: '2026-04-02 10:00',
    store: '鲜选海鲜 东门鲜活店'
  },
  {
    id: 'DD2026040203',
    items: [
      { name: '帝王蟹', quantity: 1, price: 398 },
      { name: '扇贝', quantity: 2, price: 38 }
    ],
    customerName: '王五',
    customerPhone: '137****7000',
    pickupTime: '2026-04-02 16:00',
    totalAmount: 474,
    status: 'completed',
    createdAt: '2026-04-02 11:00',
    store: '鲜选海鲜 柳州谷埠街店'
  },
  {
    id: 'DD2026040204',
    items: [
      { name: '金枪鱼', quantity: 1, price: 128 }
    ],
    customerName: '赵六',
    customerPhone: '136****6000',
    pickupTime: '2026-04-01 18:00',
    totalAmount: 128,
    status: 'completed',
    createdAt: '2026-04-01 15:00',
    store: '鲜选海鲜 城中门店'
  }
]

const statusConfig = {
  pending: {
    label: '待处理',
    hint: '待订单确认',
    chipClass: 'bg-[#fff1e5] text-[#d97938]',
    dotClass: 'bg-[#f09552]'
  },
  preparing: {
    label: '备货中',
    hint: '正在处理商品',
    chipClass: 'bg-[#e9f4ef] text-[#2f6b56]',
    dotClass: 'bg-[#2f6b56]'
  },
  completed: {
    label: '已完成',
    hint: '可回看明细',
    chipClass: 'bg-[#f1ede6] text-[#7a6855]',
    dotClass: 'bg-[#96826c]'
  },
  cancelled: {
    label: '已取消',
    hint: '订单已关闭',
    chipClass: 'bg-[#efe8df] text-[#a18d79]',
    dotClass: 'bg-[#b59f89]'
  }
}

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'preparing', label: '备货中' },
  { key: 'completed', label: '已完成' }
]

function formatTime(pickupTime) {
  const date = new Date(pickupTime)

  if (Number.isNaN(date.getTime())) {
    return pickupTime
  }

  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getOrderTitle(order) {
  if (!order?.items?.length) return '海鲜订单'
  if (order.items.length === 1) return order.items[0].name
  return `${order.items[0].name}等${order.items.length}款鲜货`
}

function SectionStat({ label, value, accent = false }) {
  return (
    <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[#aa9277]">{label}</div>
      <div className={`mt-2 text-[28px] font-bold leading-none ${accent ? 'text-[#df6f33]' : 'text-[#2f281f]'}`}>{value}</div>
    </div>
  )
}

function OrderManagement() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:8000/orders')
        const data = await response.json()

        if (mounted) {
          setOrders(Array.isArray(data) && data.length ? data : mockOrders)
        }
      } catch (error) {
        if (mounted) {
          setOrders(mockOrders)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchOrders()

    return () => {
      mounted = false
    }
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeFilter === 'all') return true
      return order.status === activeFilter
    })
  }, [activeFilter, orders])

  const orderStats = useMemo(() => {
    const pendingCount = orders.filter((order) => order.status === 'pending').length
    const preparingCount = orders.filter((order) => order.status === 'preparing').length
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

    return {
      total: orders.length,
      pendingCount,
      preparingCount,
      totalAmount
    }
  }, [orders])

  const toggleExpand = (orderId) => {
    setExpandedOrder((current) => (current === orderId ? null : orderId))
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top, rgba(255, 242, 221, 0.84), rgba(245, 238, 228, 0.96) 28%, #f7f2ea 62%, #efe6db 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <div className="absolute inset-0 overflow-y-auto pb-[calc(var(--app-bottom-nav-space)+20px)]">
        <header className="sticky top-0 z-30 border-b border-[#eadfce] bg-[rgba(250,246,239,0.94)] backdrop-blur safe-area-top">
          <div className="mx-auto max-w-lg px-4 pb-4 pt-4">
            <div className="rounded-[30px] bg-white px-5 py-5 shadow-[0_18px_40px_rgba(120,93,53,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4e6] px-3 py-1 text-xs font-semibold text-[#bb6c25]">
                    <span className="h-2 w-2 rounded-full bg-[#ff7e45]" />
                    到店履约中心
                  </div>
                  <h1
                    className="mt-3 text-[32px] font-bold leading-tight text-[#2f281f]"
                    style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
                  >
                    我的订单
                  </h1>
                  <p className="mt-2 text-sm text-[#7d6a53]">查看待处理、备货中和已完成订单，快速确认取货时间和商品明细。</p>
                </div>

                <button
                  onClick={() => navigate('/price-query')}
                  className="rounded-[22px] bg-[#f6f0e7] px-4 py-3 text-right text-xs text-[#8a7152] transition-transform active:scale-[0.98]"
                >
                  <div className="font-semibold text-[#574533]">继续下单</div>
                  <div>返回鲜选页</div>
                </button>
              </div>

              {!loading && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <SectionStat label="订单总数" value={orderStats.total} />
                  <SectionStat label="待确认" value={orderStats.pendingCount} accent />
                  <SectionStat label="累计金额" value={`¥${orderStats.totalAmount}`} />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-4">
          <section className="rounded-[30px] border border-[#eadfce] bg-[#fffaf3] p-3 shadow-[0_20px_40px_rgba(105,77,44,0.08)]">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {filterTabs.map((tab) => {
                const active = activeFilter === tab.key
                const count =
                  tab.key === 'all'
                    ? orders.length
                    : orders.filter((order) => order.status === tab.key).length

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#1f4034] text-white shadow-[0_14px_28px_rgba(31,64,52,0.22)]'
                        : 'bg-[#f5ede1] text-[#7d6a53]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-[11px] ${active ? 'bg-[rgba(255,255,255,0.16)]' : 'bg-white text-[#8f775d]'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#fffaf3] p-5 shadow-[0_20px_40px_rgba(105,77,44,0.08)]"
                  >
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 w-28 rounded-full bg-[#efe5d8]" />
                      <div className="h-8 w-40 rounded-full bg-[#f3ecdf]" />
                      <div className="h-4 w-full rounded-full bg-[#f3ecdf]" />
                      <div className="h-4 w-3/4 rounded-full bg-[#f3ecdf]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-[34px] border border-dashed border-[#e5d7c5] bg-[#fffaf3] px-6 py-14 text-center shadow-[0_20px_40px_rgba(105,77,44,0.06)]">
                <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#f3e8d8] text-[#8f775d]">
                  <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                  </svg>
                </div>
                <h2
                  className="mt-5 text-[28px] font-bold leading-tight text-[#2f281f]"
                  style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
                >
                  当前没有这类订单
                </h2>
                <p className="mt-2 text-sm text-[#7d6a53]">切换筛选看看其他状态，或者回到下单页继续选购鲜货。</p>
                <button
                  onClick={() => navigate('/price-query')}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#1f4034] px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,64,52,0.22)] transition-transform active:scale-95"
                >
                  去下单
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const isExpanded = expandedOrder === order.id

                  return (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-[32px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_20px_40px_rgba(105,77,44,0.08)] transition-all"
                    >
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="w-full px-5 py-5 text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.chipClass}`}>
                                <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                                {status.label}
                              </span>
                              <span className="text-xs text-[#8f775d]">{status.hint}</span>
                            </div>

                            <h2
                              className="mt-3 text-[26px] font-bold leading-tight text-[#2f281f]"
                              style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
                            >
                              {getOrderTitle(order)}
                            </h2>
                            <p className="mt-2 text-sm text-[#7d6a53]">
                              {order.items.map((item) => `${item.name} x${item.quantity}`).join(' · ')}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <div className="text-right">
                              <div className="text-[11px] uppercase tracking-[0.16em] text-[#aa9277]">合计</div>
                              <div className="mt-1 text-[28px] font-bold leading-none text-[#df6f33]">¥{order.totalAmount}</div>
                            </div>
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#f4eadb] text-[#7c654b] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="m6 9 6 6 6-6" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <div className="rounded-[22px] bg-white px-3 py-3 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                            <div className="text-[11px] text-[#9a846c]">订单号</div>
                            <div className="mt-1 truncate text-sm font-semibold text-[#2f281f]">{order.id}</div>
                          </div>
                          <div className="rounded-[22px] bg-white px-3 py-3 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                            <div className="text-[11px] text-[#9a846c]">取货时间</div>
                            <div className="mt-1 text-sm font-semibold text-[#2f281f]">{formatTime(order.pickupTime)}</div>
                          </div>
                          <div className="rounded-[22px] bg-white px-3 py-3 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                            <div className="text-[11px] text-[#9a846c]">商品件数</div>
                            <div className="mt-1 text-sm font-semibold text-[#2f281f]">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <span className="inline-flex h-11 items-center justify-center rounded-full border border-[#e1d3c0] px-5 text-sm font-semibold text-[#7d6a53]">
                                取消订单
                              </span>
                              <span className="inline-flex h-11 items-center justify-center rounded-full bg-[#1f4034] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(31,64,52,0.22)]">
                                立即支付
                              </span>
                            </>
                          )}

                          {order.status === 'preparing' && (
                            <span className="inline-flex h-11 items-center justify-center rounded-full bg-[#e9f4ef] px-5 text-sm font-semibold text-[#2f6b56]">
                              订单准备中
                            </span>
                          )}

                          {order.status === 'completed' && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                navigate('/price-query')
                              }}
                              className="inline-flex h-11 items-center justify-center rounded-full bg-[#1f4034] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(31,64,52,0.22)] transition-transform active:scale-[0.98]"
                            >
                              再来一单
                            </button>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#efe4d4] bg-[linear-gradient(180deg,#fffaf3_0%,#f8f1e7_100%)] px-5 py-5">
                          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c47b36]">商品明细</div>
                              <div className="mt-3 space-y-3">
                                {order.items.map((item, index) => (
                                  <div key={`${order.id}-${index}`} className="flex items-center justify-between rounded-[22px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                                    <div>
                                      <div className="text-sm font-semibold text-[#2f281f]">{item.name}</div>
                                      <div className="mt-1 text-xs text-[#9a846c]">单价 ¥{item.price}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-[#9a846c]">数量</div>
                                      <div className="mt-1 text-sm font-semibold text-[#2f281f]">x{item.quantity}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c47b36]">联系信息</div>
                              <div className="mt-3 rounded-[26px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                                <div className="space-y-3 text-sm text-[#6f5e4b]">
                                  <div>
                                    <div className="text-[11px] text-[#9a846c]">顾客</div>
                                    <div className="mt-1 font-semibold text-[#2f281f]">{order.customerName}</div>
                                  </div>
                                  <div>
                                    <div className="text-[11px] text-[#9a846c]">电话</div>
                                    <div className="mt-1 font-semibold text-[#2f281f]">{order.customerPhone}</div>
                                  </div>
                                  <div>
                                    <div className="text-[11px] text-[#9a846c]">下单时间</div>
                                    <div className="mt-1 font-semibold text-[#2f281f]">{order.createdAt}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default OrderManagement
