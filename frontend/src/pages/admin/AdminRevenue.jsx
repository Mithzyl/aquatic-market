import React, { useState, useEffect, useCallback } from 'react'
import { getRevenueStats, getOrders, updateOrderStatus } from '../../api/admin'

// 订单状态配置
const ORDER_STATUS = {
  pending: { label: '待确认', color: 'bg-[#f5f0e6] text-[#8b755d]', next: 'confirmed' },
  confirmed: { label: '已确认', color: 'bg-[#fff3e7] text-[#d67635]', next: 'ready' },
  ready: { label: '待取货', color: 'bg-[#e8f5e9] text-[#2f6b56]', next: 'completed' },
  completed: { label: '已完成', color: 'bg-[#f0f0f0] text-[#5a4d3d]', next: null },
  cancelled: { label: '已取消', color: 'bg-[#f5f0e6] text-[#b5a18a]', next: null }
}

// 格式化金额
function formatAmount(amount) {
  return `¥${amount.toFixed(2)}`
}

// 格式化时间
function formatPickupTime(timeStr) {
  try {
    const date = new Date(timeStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  } catch {
    return timeStr
  }
}

// 格式化创建时间
function formatCreatedTime(timeStr) {
  try {
    const date = new Date(timeStr)
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  } catch {
    return timeStr
  }
}

// 统计卡片组件
function StatCard({ title, amount, orderCount, growth, delay = 0 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const growthColor = growth > 0 ? 'text-[#2f6b56]' : growth < 0 ? 'text-[#d67635]' : 'text-[#8b755d]'
  const growthIcon = growth > 0 ? '↑' : growth < 0 ? '↓' : ''

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex flex-col">
        {/* 标题 */}
        <span className="text-xs text-[#7d6a53] mb-1">{title}</span>
        
        {/* 金额 */}
        <span className="text-xl font-semibold text-[#2c241b] mb-0.5">
          {formatAmount(amount)}
        </span>
        
        {/* 订单数 + 同比 */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8b755d]">{orderCount} 单</span>
          {growth !== 0 && (
            <span className={`${growthColor} font-medium`}>
              {growthIcon} {Math.abs(growth)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// 订单卡片组件
function OrderCard({ order, onStatusUpdate, updating }) {
  const statusConfig = ORDER_STATUS[order.status] || ORDER_STATUS.pending
  const isUpdating = updating === order.id
  const canProgress = statusConfig.next !== null

  const handleNextStatus = () => {
    if (canProgress && !isUpdating) {
      onStatusUpdate(order.id, statusConfig.next)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#eadfce] p-4 transition-all duration-200 hover:border-[#d4c4a8]">
      {/* 顶部：客户信息 + 时间 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-base font-medium text-[#2c241b]">
            {order.customer_name}
          </span>
          <span className="text-xs text-[#8b755d]">
            {order.customer_phone}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-[#2c241b]">
            {formatPickupTime(order.pickup_time)}
          </span>
          <span className="text-xs text-[#b5a18a]">
            下单 {formatCreatedTime(order.created_at)}
          </span>
        </div>
      </div>

      {/* 订单明细 */}
      {order.items && order.items.length > 0 && (
        <div className="mb-3 py-2 border-t border-b border-[#f5f0e6]">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {order.items.map((item, idx) => (
              <span key={idx} className="text-xs text-[#7d6a53]">
                {item.quantity}件 × ¥{item.unit_price.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 底部：金额 + 状态 */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-[#2c241b]">
          {formatAmount(order.total_amount)}
        </span>
        
        {/* 状态按钮 */}
        <button
          onClick={handleNextStatus}
          disabled={!canProgress || isUpdating}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isUpdating
              ? 'bg-[#f5f0e6] text-[#b5a18a] cursor-wait'
              : canProgress
                ? `${statusConfig.color} hover:opacity-80 active:scale-[0.98]`
                : `${statusConfig.color} cursor-default`
          }`}
        >
          {isUpdating ? '更新中...' : statusConfig.label}
        </button>
      </div>
    </div>
  )
}

// 加载状态组件
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 border-[#eadfce] border-t-[#ff8b52] animate-spin mb-3" />
      <span className="text-sm text-[#8b755d]">加载中...</span>
    </div>
  )
}

// 空状态组件
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 rounded-full bg-[#f5f0e6] flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-[#b5a18a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <span className="text-sm text-[#8b755d]">暂无订单</span>
    </div>
  )
}

// 错误状态组件
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 rounded-full bg-[#fff3e7] flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-[#d67635]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.542 0 2.602-1.654 1.952-3.118L13.952 4.93c-.77-1.538-3.134-1.538-3.904 0L4.052 16.882c-.65 1.464.41 3.118 1.952 3.118z" />
        </svg>
      </div>
      <span className="text-sm text-[#d67635] mb-3">{message}</span>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-[#fff4e8] text-[#2f6b56] text-sm font-medium hover:bg-[#ffe8d6] active:scale-[0.98] transition-all"
      >
        重新加载
      </button>
    </div>
  )
}

// 主组件
function AdminRevenue() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 并行加载统计和订单
      const [statsResponse, ordersResponse] = await Promise.all([
        getRevenueStats(),
        getOrders()
      ])

      setStats(statsResponse)
      setOrders(ordersResponse.orders || [])
    } catch (err) {
      console.error('[AdminRevenue] 加载失败:', err.message)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化加载
  useEffect(() => {
    loadData()
  }, [loadData])

  // 更新订单状态
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)

    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus)
      
      // 更新本地订单列表
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      )

      // 重新加载统计数据（金额可能变化）
      const statsResponse = await getRevenueStats()
      setStats(statsResponse)
    } catch (err) {
      console.error('[AdminRevenue] 更新状态失败:', err.message)
      // 可选：显示错误提示
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // 加载状态
  if (loading) {
    return <LoadingState />
  }

  // 错误状态
  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  return (
    <div className="py-4">
      {/* 统计区域 */}
      <section className="mb-6">
        <h2 className="text-xs font-medium text-[#7d6a53] mb-4">收益统计</h2>
        
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              title="今日"
              amount={stats.today?.amount || 0}
              orderCount={stats.today?.order_count || 0}
              growth={stats.today?.growth || 0}
              delay={0}
            />
            <StatCard
              title="本周"
              amount={stats.week?.amount || 0}
              orderCount={stats.week?.order_count || 0}
              growth={stats.week?.growth || 0}
              delay={100}
            />
            <StatCard
              title="本月"
              amount={stats.month?.amount || 0}
              orderCount={stats.month?.order_count || 0}
              growth={stats.month?.growth || 0}
              delay={200}
            />
          </div>
        )}
      </section>

      {/* 订单列表区域 */}
      <section>
        <h2 className="text-xs font-medium text-[#7d6a53] mb-4">订单列表</h2>
        
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                updating={updatingOrderId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminRevenue