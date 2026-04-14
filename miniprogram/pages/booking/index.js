// pages/booking/index.js - 预订确认页
const { createOrder } = require('../../services/order')
const auth = require('../../services/auth')
const app = getApp()

Page({
  data: {
    cartItems: [],
    customerName: '',
    customerPhone: '',
    pickupTime: '',
    submitting: false,
    totalAmount: 0,
    totalItems: 0,
    canSubmit: false,
    fallbackImage: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=400&fit=crop'
  },

  onLoad() {
    // 检查登录状态
    if (!auth.isLoggedIn()) {
      wx.showModal({
        title: '请先登录',
        content: '下单需要登录，是否立即登录？',
        success: (res) => {
          if (res.confirm) {
            app.autoLogin().then(() => {
              if (auth.isLoggedIn()) {
                this.updateCartInfo()
              } else {
                wx.showToast({ title: '登录失败', icon: 'none' })
                setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1500)
              }
            })
          } else {
            wx.switchTab({ url: '/pages/index/index' })
          }
        }
      })
    } else {
      this.updateCartInfo()
    }
  },
  
  onShow() { this.updateCartInfo() },

  updateCartInfo() {
    const cartItems = app.globalData.cartItems
    const totalAmount = app.getTotalPrice()
    const totalItems = app.getTotalItems()
    this.setData({ cartItems, totalAmount, totalItems })
    this.checkCanSubmit()
  },

  onNameInput(e) { this.setData({ customerName: e.detail.value }); this.checkCanSubmit() },
  onPhoneInput(e) { this.setData({ customerPhone: e.detail.value }); this.checkCanSubmit() },
  onPickupTimeChange(e) { this.setData({ pickupTime: e.detail.value }); this.checkCanSubmit() },

  checkCanSubmit() {
    const { cartItems, customerName, customerPhone, pickupTime, submitting } = this.data
    this.setData({ canSubmit: cartItems.length > 0 && !!customerName && !!customerPhone && !!pickupTime && !submitting })
  },

  onDecrease(e) { app.updateQuantity(e.currentTarget.dataset.id, -1); this.updateCartInfo() },
  onIncrease(e) { app.updateQuantity(e.currentTarget.dataset.id, 1); this.updateCartInfo() },

  async handleSubmit() {
    if (!this.data.canSubmit) return
    
    // 再次检查登录状态
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    this.setData({ submitting: true })
    try {
      // 从Token获取用户信息，不再硬编码
      const userId = auth.getUserId()
      const merchantId = app.globalData.defaultMerchantId || 1
      
      const orderData = {
        merchant_id: merchantId,
        // user_id 由后端从Token中获取，不再传递
        customer_name: this.data.customerName,
        customer_phone: this.data.customerPhone,
        pickup_time: this.data.pickupTime,
        items: this.data.cartItems.map(item => ({ product_id: item.id, quantity: item.quantity }))
      }
      
      await createOrder(orderData)
      app.clearCart()
      wx.showToast({ title: '下单成功', icon: 'success', duration: 1800 })
      setTimeout(() => { wx.switchTab({ url: '/pages/order-list/index' }) }, 1800)
    } catch (error) {
      console.error('下单失败:', error)
      wx.showToast({ title: error.message || '下单失败，请重试', icon: 'none' })
    } finally { 
      this.setData({ submitting: false }) 
    }
  },

  onGoToOrderPage() { wx.switchTab({ url: '/pages/price-query/index' }) }
})