// pages/order-list/index.js - 订单管理页
const { getMyOrders } = require('../../services/order')
const auth = require('../../services/auth')
const config = require('../../utils/config')

Page({
  data: {
    orders: [],
    filteredOrders: [],
    loading: true,
    activeFilter: 'all',
    filterTabs: [
      { key: 'all', label: '全部' },
      { key: 'preparing', label: '待取货' },
      { key: 'pending', label: '已下单' },
      { key: 'completed', label: '已完成' }
    ],
    orderStats: { readyCount: 0, pendingCount: 0, completedCount: 0 },
    expandedOrderId: null
  },

  onLoad() {
    // 检查登录状态
    if (!auth.isLoggedIn()) {
      wx.showModal({
        title: '请先登录',
        content: '查看订单需要登录，是否立即登录？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/index?from=' + encodeURIComponent('/pages/order-list/index')
            })
          } else {
            this.setData({ loading: false, orders: [] })
          }
        }
      })
      this.setData({ loading: false })
    } else {
      this.fetchOrders()
    }
  },
  
  onShow() {
    // 每次显示页面时刷新订单（如果已登录）
    if (auth.isLoggedIn()) {
      this.fetchOrders()
    }
  },
  
  onPullDownRefresh() {
    if (auth.isLoggedIn()) {
      this.fetchOrders().then(() => wx.stopPullDownRefresh())
    } else {
      wx.stopPullDownRefresh()
    }
  },

  async fetchOrders() {
    try {
      // 使用新的认证API，不再硬编码user_id
      const data = await getMyOrders()
      const orders = Array.isArray(data) ? data : []
      this.setData({ orders }, () => this.filterOrders())
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      if (error.message && error.message.includes('未授权')) {
        wx.showToast({ title: '请先登录', icon: 'none' })
        auth.logout()
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
      this.setData({ orders: [], loading: false })
    }
  },

  filterOrders() {
    const { orders, activeFilter } = this.data
    const filteredOrders = activeFilter === 'all' ? orders : orders.filter(o => o.status === activeFilter)
    const orderStats = {
      readyCount: orders.filter(o => o.status === 'preparing').length,
      pendingCount: orders.filter(o => o.status === 'pending').length,
      completedCount: orders.filter(o => o.status === 'completed').length
    }
    this.setData({ filteredOrders, orderStats, loading: false })
  },

  onFilterChange(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key }, () => this.filterOrders())
  },

  onToggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedOrderId: this.data.expandedOrderId === id ? null : id })
  },

  onGoToOrder() { wx.switchTab({ url: '/pages/price-query/index' }) },

  getStatusLabel(status) {
    return (config.statusConfig[status] || config.statusConfig.pending).badgeLabel
  },

  getStatusColor(status) {
    return (config.statusConfig[status] || config.statusConfig.pending).badgeBg
  }
})