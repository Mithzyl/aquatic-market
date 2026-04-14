// app.js - 小程序入口文件
App({
  globalData: {
    // 购物车数据
    cartItems: [],
    // API 基地址
    apiBase: 'http://localhost:8000',
    // 用户信息
    userInfo: null
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
    return this.globalData.cartItems
  },

  // 清空购物车
  clearCart() {
    this.globalData.cartItems = []
  }
})