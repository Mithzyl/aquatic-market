// pages/order-list/index.js - 订单管理页
const { getMyOrders, cancelOrder } = require('../../services/order')
const auth = require('../../services/auth')
const config = require('../../utils/config')

Page({
  data: {
    orders: [],
    filteredOrders: [],
    loading: true,
    requireAuth: false, // 是否需要登录（未登录状态）
    activeFilter: 'all',
    filterTabs: [
      { key: 'all', label: '全部' },
      { key: 'preparing', label: '待取货' },
      { key: 'pending', label: '已下单' },
      { key: 'completed', label: '已完成' }
    ],
    orderStats: { readyCount: 0, pendingCount: 0, completedCount: 0 },
    expandedOrderId: null,
    showCancelDialog: false,
    orderToCancel: null,
    isCancelling: false
  },

  onLoad() {
    // 检查登录状态
    if (!auth.isLoggedIn()) {
      // 未登录：显示"请登录"空状态 UI，不弹出 Modal
      this.setData({ requireAuth: true, loading: false })
    } else {
      this.fetchOrders()
    }
  },
  
  onShow() {
    // 每次显示页面时检查登录状态并刷新订单
    if (auth.isLoggedIn()) {
      // 已登录：如果之前是未登录状态，现在需要刷新
      if (this.data.requireAuth) {
        this.setData({ requireAuth: false, loading: true })
      }
      this.fetchOrders()
    } else {
      // 未登录：显示登录引导
      this.setData({ requireAuth: true, loading: false, orders: [], filteredOrders: [] })
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
    
    // 为每个订单计算 canCancel 属性
    const ordersWithCanCancel = orders.map(order => ({
      ...order,
      canCancel: this.canCancelOrder(order)
    }))
    
    const filteredOrders = activeFilter === 'all' 
      ? ordersWithCanCancel 
      : ordersWithCanCancel.filter(o => o.status === activeFilter)
    
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

  // 跳转到登录页
  onLogin() {
    wx.navigateTo({
      url: '/pages/login/index?from=' + encodeURIComponent('/pages/order-list/index')
    })
  },

  // 检查订单是否可以取消（pending 状态且 5 分钟内）
  canCancelOrder(order) {
    if (order.status !== 'pending') return false
    
    // 检查订单创建时间是否在 5 分钟内
    const createdAt = new Date(order.created_at)
    const now = new Date()
    const diffMinutes = (now - createdAt) / (1000 * 60)
    
    return diffMinutes <= 5
  },

  // 点击取消订单按钮
  onCancelOrderClick(e) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o.id === orderId)
    
    if (!order) return
    
    // 再次检查是否可以取消
    if (!this.canCancelOrder(order)) {
      wx.showToast({ title: '订单已超时或已处理', icon: 'none' })
      return
    }
    
    this.setData({
      showCancelDialog: true,
      orderToCancel: order
    })
  },

  // 确认取消订单
  async onConfirmCancel() {
    const { orderToCancel } = this.data
    if (!orderToCancel) return
    
    this.setData({ isCancelling: true })
    
    try {
      await cancelOrder(orderToCancel.id)
      
      // 更新订单状态
      const orders = this.data.orders.map(o => 
        o.id === orderToCancel.id ? { ...o, status: 'cancelled' } : o
      )
      
      this.setData({
        orders,
        showCancelDialog: false,
        orderToCancel: null,
        isCancelling: false
      }, () => this.filterOrders())
      
      wx.showToast({ title: '订单已取消', icon: 'success' })
    } catch (error) {
      console.error('Failed to cancel order:', error)
      
      this.setData({
        showCancelDialog: false,
        orderToCancel: null,
        isCancelling: false
      })
      
      // 显示错误提示
      let errorMessage = '取消失败，请稍后重试'
      if (error.message) {
        if (error.message.includes('超时')) {
          errorMessage = '订单已超时，无法取消'
        } else if (error.message.includes('已处理')) {
          errorMessage = '订单已处理，无法取消'
        } else if (error.message.includes('API')) {
          errorMessage = '功能暂未开放，请联系客服'
        }
      }
      
      wx.showToast({ title: errorMessage, icon: 'none', duration: 3000 })
    }
  },

  // 取消取消订单
  onCancelCancel() {
    this.setData({
      showCancelDialog: false,
      orderToCancel: null
    })
  },

  getStatusLabel(status) {
    return (config.statusConfig[status] || config.statusConfig.pending).badgeLabel
  },

  getStatusColor(status) {
    return (config.statusConfig[status] || config.statusConfig.pending).badgeBg
  }
})