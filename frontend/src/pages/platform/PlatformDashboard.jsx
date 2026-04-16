/**
 * 平台后台 Dashboard 页
 * 展示平台整体统计数据
 */
import React, { useState, useEffect } from 'react'
import { getPlatformOverview, getOrderStatistics, getRevenueStatistics } from '../../api/platform'

// 统计卡片组件
function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
    purple: 'bg-purple-500/10 text-purple-400',
  }

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all group">
      <div className="flex items-start justify-between">
        {/* 左侧内容 */}
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        {/* 右侧图标 */}
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
      </div>

      {/* 趋势指示 */}
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-500">vs 上周</span>
        </div>
      )}
    </div>
  )
}

// 图标组件
function StatIcon({ type }) {
  const common = {
    className: 'w-6 h-6',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }

  if (type === 'store') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10.5 12 4l8 6.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.5 9.5V19h11V9.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19v-5h4v5" />
      </svg>
    )
  }

  if (type === 'users') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    )
  }

  if (type === 'orders') {
    return (
      <svg {...common}>
        <rect x="5" y="4.5" width="14" height="15" rx="2.5" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 8.5h8M8 12h8M8 15.5h5" />
      </svg>
    )
  }

  if (type === 'revenue') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v12M8 10h8M8 14h8" />
      </svg>
    )
  }

  if (type === 'products') {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" strokeWidth={1.8} />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" strokeWidth={1.8} />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" strokeWidth={1.8} />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" strokeWidth={1.8} />
      </svg>
    )
  }

  return null
}

// 加载骨架屏
function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-20 bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-8 w-32 bg-slate-700 rounded animate-pulse mb-1" />
          <div className="h-3 w-16 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 bg-slate-700 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

function PlatformDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [revenueStats, setRevenueStats] = useState(null)

  // 加载统计数据
  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    setLoading(true)
    setError(null)

    try {
      // 并行请求所有统计数据
      const [overviewData, orderData, revenueData] = await Promise.all([
        getPlatformOverview(),
        getOrderStatistics(),
        getRevenueStatistics()
      ])

      setOverview(overviewData)
      setOrderStats(orderData)
      setRevenueStats(revenueData)
    } catch (err) {
      console.error('[PlatformDashboard] 加载统计数据失败:', err.message)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 格式化金额
  const formatCurrency = (amount) => {
    return `¥${typeof amount === 'number' ? amount.toFixed(2) : '0.00'}`
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          数据概览
        </h1>
        <button
          onClick={loadStatistics}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
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

      {/* 核心统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          // 骨架屏
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* 商家总数 */}
            <StatCard
              title="商家总数"
              value={overview?.merchant_count || 0}
              subtitle="已入驻商家"
              icon={<StatIcon type="store" />}
              color="blue"
            />

            {/* 用户总数 */}
            <StatCard
              title="用户总数"
              value={overview?.user_count || 0}
              subtitle="注册用户"
              icon={<StatIcon type="users" />}
              color="green"
            />

            {/* 商品总数 */}
            <StatCard
              title="商品总数"
              value={overview?.product_count || 0}
              subtitle="上架商品"
              icon={<StatIcon type="products" />}
              color="purple"
            />

            {/* 订单总数 */}
            <StatCard
              title="订单总数"
              value={overview?.order_count || 0}
              subtitle={`今日 ${overview?.today_order_count || 0} 单`}
              icon={<StatIcon type="orders" />}
              color="orange"
            />
          </>
        )}
      </div>

      {/* 收益统计 */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          收益统计
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-16 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-700 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 总收益 */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">总收益</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(revenueStats?.total_revenue || overview?.total_revenue || 0)}
              </p>
            </div>

            {/* 今日收益 */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">今日收益</p>
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(revenueStats?.today_revenue || overview?.today_revenue || 0)}
              </p>
            </div>

            {/* 本周收益 */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">本周收益</p>
              <p className="text-xl font-bold text-blue-400">
                {formatCurrency(revenueStats?.week_revenue || 0)}
              </p>
            </div>

            {/* 本月收益 */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">本月收益</p>
              <p className="text-xl font-bold text-orange-400">
                {formatCurrency(revenueStats?.month_revenue || 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 订单状态分布 */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          订单状态分布
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 待处理 */}
            <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-sm text-slate-400">待处理</p>
                <p className="text-lg font-semibold text-white">
                  {orderStats?.pending_orders || 0}
                </p>
              </div>
            </div>

            {/* 已完成 */}
            <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-sm text-slate-400">已完成</p>
                <p className="text-lg font-semibold text-white">
                  {orderStats?.completed_orders || 0}
                </p>
              </div>
            </div>

            {/* 已取消 */}
            <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-sm text-slate-400">已取消</p>
                <p className="text-lg font-semibold text-white">
                  {orderStats?.cancelled_orders || 0}
                </p>
              </div>
            </div>

            {/* 平均订单金额 */}
            <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm text-slate-400">平均金额</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(orderStats?.average_order_value || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 商家收益排名 */}
      {!loading && revenueStats?.revenue_by_merchant?.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            商家收益排名（Top 10）
          </h2>

          <div className="space-y-3">
            {revenueStats.revenue_by_merchant.map((item, index) => (
              <div key={item.merchant_id} className="flex items-center gap-4 bg-slate-700/50 rounded-lg p-3">
                {/* 排名 */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  index < 3 ? 'bg-orange-500 text-white' : 'bg-slate-600 text-slate-300'
                }`}>
                  {index + 1}
                </div>

                {/* 商家名称 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {item.merchant_name}
                  </p>
                </div>

                {/* 收益 */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlatformDashboard