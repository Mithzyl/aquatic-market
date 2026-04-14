// pages/order-list/index.js - 订单管理页
const { getOrdersByUserId } = require('../../services/order')
const { formatDate } = require('../../utils/format')
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

  onLoad() { this.fetchOrders() },
  onShow() { this.fetchOrders() },
  onPullDownRefresh() { this.fetchOrders().then(() => wx.stopPullDownRefresh()) },

  async fetchOrders() {
    try {
      const data = await getOrdersByUserId(1)
      const orders = Array.isArray(data) ? data : []
      this.setData({ orders }, () => this.filterOrders())
    } catch (error) {
      console.error('Failed to fetch orders:', error)
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