// app.js - 小程序入口文件
const auth = require('./services/auth')
const config = require('./utils/config')

App({
  globalData: {
    // 购物车数据
    cartItems: [],
    // 用户信息（从Storage同步）
    userInfo: null,
    // 商家ID（从 API 配置动态获取）
    merchantId: null
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
    // 恢复购物车数据
    this.restoreCart()
  },

  checkLoginStatus() {
    if (auth.isLoggedIn()) {
      // 已登录，恢复用户信息
      this.globalData.userInfo = auth.getCurrentUser()
    } else {
      // 未登录，尝试自动登录
      this.autoLogin()
    }
  },

  async autoLogin() {
    try {
      // 尝试微信登录
      const data = await auth.wxLogin()
      this.globalData.userInfo = {
        id: data.user_id,
        phone: data.phone,
        nickname: data.nickname,
        avatar_url: data.avatar_url
      }
      console.log('自动登录成功:', data.user_id)
    } catch (error) {
      console.log('自动登录失败:', error.message)
      // 不强制登录，允许用户浏览商品
    }
  },

  restoreCart() {
    const savedCart = wx.getStorageSync('cartItems')
    if (savedCart && Array.isArray(savedCart)) {
      this.globalData.cartItems = savedCart
    }
  },

  saveCart() {
    wx.setStorageSync('cartItems', this.globalData.cartItems)
  },

  // 计算购物车总件数
  getTotalItems() {
    return this.globalData.cartItems.reduce((sum, item) => sum + item.quantity, 0)
  },

  // 计算购物车总价
  getTotalPrice() {
    return this.globalData.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  // 添加商品到购物车
  addToCart(product, quantity = 1) {
    const cartItems = this.globalData.cartItems
    const existing = cartItems.find(item => item.id === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      cartItems.push({ ...product, quantity })
    }
    this.globalData.cartItems = [...cartItems]
    this.saveCart()
    return this.globalData.cartItems
  },

  // 更新购物车商品数量
  updateQuantity(productId, change) {
    const cartItems = this.globalData.cartItems
    const index = cartItems.findIndex(item => item.id === productId)
    if (index === -1) return cartItems
    const newQuantity = cartItems[index].quantity + change
    if (newQuantity <= 0) {
      cartItems.splice(index, 1)
    } else {
      cartItems[index].quantity = newQuantity
    }
    this.globalData.cartItems = [...cartItems]
    this.saveCart()
    return this.globalData.cartItems
  },

  // 清空购物车
  clearCart() {
    this.globalData.cartItems = []
    this.saveCart()
  },

  // 获取用户ID（用于订单等需要认证的操作）
  getUserId() {
    return auth.getUserId()
  },

  // 检查是否需要登录
  requireLogin(callback) {
    if (auth.isLoggedIn()) {
      callback()
    } else {
      wx.showModal({
        title: '请先登录',
        content: '下单和查看订单需要登录，是否立即登录？',
        success: (res) => {
          if (res.confirm) {
            // 跳转到登录页面
            const pages = getCurrentPages()
            const currentPage = pages[pages.length - 1]
            const currentPath = currentPage ? `/${currentPage.route}` : ''
            wx.navigateTo({
              url: `/pages/login/index${currentPath ? '?from=' + encodeURIComponent(currentPath) : ''}`
            })
          }
        }
      })
    }
  }
})