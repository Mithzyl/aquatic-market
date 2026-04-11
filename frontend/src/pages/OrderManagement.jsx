import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrdersByUserId } from '../api/orders'

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'preparing', label: '待取货' },
  { key: 'pending', label: '已下单' },
  { key: 'completed', label: '已完成' }
]

const statusConfig = {
  preparing: {
    badgeLabel: '待取货',
    badgeEnglish: 'READY FOR PICKUP',
    badgeClass: 'bg-[#1f7a55] text-white shadow-[0_18px_36px_rgba(31,122,85,0.24)]',
    badgeDotClass: 'bg-white',
    pulse: true,
    ctaClass: 'border-[#b9e0cf] bg-[linear-gradient(180deg,#effbf5_0%,#e6f6ee_100%)]',
    ctaTitle: '请注意！您的海鲜已备好，请尽快领取！',
    ctaHint: '为保证最佳品相，请在指定时段内到店核对。',
    ctaAccentClass: 'text-[#1f7a55]'
  },
  pending: {
    badgeLabel: '已下单',
    badgeEnglish: 'ORDER RECEIVED',
    badgeClass: 'bg-[#f4b54a] text-[#4c3414] shadow-[0_18px_36px_rgba(209,151,48,0.22)]',
    badgeDotClass: 'bg-[#7a4a10]',
    pulse: false,
    ctaClass: 'border-[#edd9b6] bg-[linear-gradient(180deg,#fff7e8_0%,#fff2d6_100%)]',
    ctaTitle: '等待店主确认与工艺处理中...',
    ctaHint: '当前订单已进入队列，如需加急或确认细节，可以直接联系店主。',
    ctaAccentClass: 'text-[#a36a17]'
  },
  completed: {
    badgeLabel: '已领取',
    badgeEnglish: 'COMPLETED',
    badgeClass: 'bg-[#ebe7e1] text-[#786553] shadow-[0_12px_26px_rgba(121,101,83,0.12)]',
    badgeDotClass: 'bg-[#96826c]',
    pulse: false,
    ctaClass: 'border-[#e7ddd0] bg-[linear-gradient(180deg,#faf6f0_0%,#f4eee7_100%)]',
    ctaTitle: '本次交易已完成',
    ctaHint: '可查看交易凭证与收货记录，作为后续复购参考。',
    ctaAccentClass: 'text-[#7b6854]'
  },
  cancelled: {
    badgeLabel: '已取消',
    badgeEnglish: 'CANCELLED',
    badgeClass: 'bg-[#efe8df] text-[#8b7865]',
    badgeDotClass: 'bg-[#b59f89]',
    pulse: false,
    ctaClass: 'border-[#e7ddd0] bg-[linear-gradient(180deg,#faf6f0_0%,#f4eee7_100%)]',
    ctaTitle: '订单已关闭',
    ctaHint: '如果仍有购买需求，可以重新选择商品。',
    ctaAccentClass: 'text-[#7b6854]'
  }
}

const itemCraftTags = {
  三文鱼刺身: ['现切', '冰鲜处理'],
  鲜活龙虾: ['去线', '氧气处理'],
  鲍鱼: ['刷洗净选', '规格复核'],
  帝王蟹: ['分切处理', '低温保鲜'],
  扇贝: ['代开壳', '净选即烹'],
  金枪鱼: ['低温冷藏', '即切即取']
}

function parseDateTime(value) {
  if (!value) return new Date(0)
  const normalized = String(value).replace(' ', 'T')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed
}

function formatDateTimeLabel(value) {
  const date = parseDateTime(value)
  if (date.getTime() === 0) return value

  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatDateLabel(value) {
  const date = parseDateTime(value)
  if (date.getTime() === 0) return value

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function getOrderTitle(order) {
  if (!order?.items?.length) return '海鲜订单'
  if (order.items.length === 1) return order.items[0].name
  return `${order.items[0].name}等${order.items.length}款鲜货`
}

function getCraftTags(itemName) {
  return itemCraftTags[itemName] || ['标准处理', '鲜度复核']
}

function getOrderActionText(status) {
  if (status === 'preparing') return '建议尽快到店'
  if (status === 'pending') return '建议主动联系'
  if (status === 'completed') return '历史记录'
  return '查看详情'
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <div className={`inline-flex min-h-[78px] min-w-[220px] items-center gap-3 rounded-[24px] px-4 py-3 ${config.badgeClass}`}>
      <div className="relative flex h-4 w-4 items-center justify-center">
        {config.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/65" />}
        <span className={`relative inline-flex h-4 w-4 rounded-full ${config.badgeDotClass}`} />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em]">{config.badgeEnglish}</div>
        <div className="mt-1 text-[18px] font-bold leading-none">{config.badgeLabel}</div>
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()

  return (
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
  )
}

function OrderCard({ order, isReceiptOpen, onToggleReceipt }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className="overflow-hidden rounded-[34px] border border-[#eadfce] bg-[#fffaf3] shadow-[0_20px_40px_rgba(105,77,44,0.08)]">
      <div className="px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <StatusBadge status={order.status} />

          <div className="min-w-[132px] text-right">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#aa9277]">{getOrderActionText(order.status)}</div>
            <div className="mt-1 text-sm font-semibold text-[#2f281f]">订单号 {order.id}</div>
            <div className="mt-1 text-xs text-[#8f775d]">下单日期 {formatDateLabel(order.created_at)}</div>
          </div>
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h2
            className="text-[28px] font-bold leading-tight text-[#2f281f]"
            style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
          >
            {getOrderTitle(order)}
          </h2>
          <div className="text-[36px] font-bold text-[#df6f33]">¥{order.total_amount}</div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-[#7d6a53] transition-colors hover:text-[#5a4633]"
        >
          订单明细
          <span className={`inline-block transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        <div className={`mt-4 space-y-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {order.items.map((item, index) => (
            <div key={`${order.id}-${index}`} className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#2f281f]">{item.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getCraftTags(item.name).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#fff4e8] px-2.5 py-1 text-[11px] font-medium text-[#d67635]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-[#2f281f]">x{item.quantity}</div>
                  <div className="mt-1 text-sm font-bold text-[#df6f33]">¥{item.price * item.quantity}</div>
                </div>
              </div>
            </div>
          ))}

          {order.status === 'completed' && (
            <button
              type="button"
              onClick={onToggleReceipt}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#2d2a27] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(35,31,28,0.16)] transition-transform active:scale-[0.98]"
            >
              {isReceiptOpen ? '收起交易凭证' : '查看交易凭证'}
            </button>
          )}
        </div>
      </div>

      {isReceiptOpen && (
        <div className="border-t border-[#efe4d4] bg-[linear-gradient(180deg,#fffaf3_0%,#f8f1e7_100%)] px-5 py-5">
          <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c47b36]">交易凭证</div>
              <div className="mt-3 rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                <div className="space-y-3 text-sm text-[#6f5e4b]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9a846c]">订单号</span>
                    <span className="font-semibold text-[#2f281f]">{order.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9a846c]">完成时间</span>
                    <span className="font-semibold text-[#2f281f]">{formatDateTimeLabel(order.pickup_time)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#9a846c]">支付金额</span>
                    <span className="font-semibold text-[#df6f33]">¥{order.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c47b36]">收货记录</div>
              <div className="mt-3 rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                <div className="space-y-3 text-sm text-[#6f5e4b]">
                  <div>
                    <div className="text-[11px] text-[#9a846c]">收货人</div>
                    <div className="mt-1 font-semibold text-[#2f281f]">{order.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#9a846c]">联系电话</div>
                    <div className="mt-1 font-semibold text-[#2f281f]">{order.customer_phone}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#9a846c]">收货状态</div>
                    <div className="mt-1 font-semibold text-[#2f281f]">已领取并完成交易</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function OrderManagement() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [receiptOrderId, setReceiptOrderId] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchOrders = async () => {
      try {
        const data = await getOrdersByUserId(1)
        if (mounted) {
          setOrders(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (mounted) {
          setOrders([])
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

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => parseDateTime(b.created_at).getTime() - parseDateTime(a.created_at).getTime())
  }, [orders])

  const filteredOrders = useMemo(() => {
    return sortedOrders.filter((order) => {
      if (activeFilter === 'all') return true
      return order.status === activeFilter
    })
  }, [activeFilter, sortedOrders])

  const orderStats = useMemo(() => {
    const readyCount = orders.filter((order) => order.status === 'preparing').length
    const pendingCount = orders.filter((order) => order.status === 'pending').length
    const completedCount = orders.filter((order) => order.status === 'completed').length

    return {
      readyCount,
      pendingCount,
      completedCount
    }
  }, [orders])

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
                    Customer View
                  </div>
                  <h1
                    className="mt-3 text-[32px] font-bold leading-tight text-[#2f281f]"
                    style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
                  >
                    我的订单
                  </h1>
                </div>

                <button
                  onClick={() => navigate('/price-query')}
                  className="w-[120px] whitespace-nowrap rounded-[22px] bg-[#f6f0e7] px-2 py-2 text-center text-sm font-semibold text-[#574533] transition-transform active:scale-[0.98]"
                >
                  继续下单
                </button>
              </div>

              {!loading && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#aa9277]">待取货</div>
                    <div className="mt-2 text-[28px] font-bold leading-none text-[#1f7a55]">{orderStats.readyCount}</div>
                  </div>
                  <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#aa9277]">待确认</div>
                    <div className="mt-2 text-[28px] font-bold leading-none text-[#d78622]">{orderStats.pendingCount}</div>
                  </div>
                  <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#aa9277]">历史订单</div>
                    <div className="mt-2 text-[28px] font-bold leading-none text-[#7b6854]">{orderStats.completedCount}</div>
                  </div>
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
                    ? sortedOrders.length
                    : sortedOrders.filter((order) => order.status === tab.key).length

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
                      <div className="h-16 w-56 rounded-[24px] bg-[#efe5d8]" />
                      <div className="h-8 w-48 rounded-full bg-[#f3ecdf]" />
                      <div className="h-24 w-full rounded-[24px] bg-[#f3ecdf]" />
                      <div className="h-28 w-full rounded-[24px] bg-[#f3ecdf]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isReceiptOpen={receiptOrderId === order.id}
                    onToggleReceipt={() => setReceiptOrderId((current) => (current === order.id ? null : order.id))}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default OrderManagement
