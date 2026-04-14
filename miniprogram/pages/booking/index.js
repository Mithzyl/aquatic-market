// pages/booking/index.js - 预订确认页
const { createOrder } = require('../../services/order')
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

  onLoad() { this.updateCartInfo() },
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
    this.setData({ submitting: true })
    try {
      const orderData = {
        user_id: 1, merchant_id: 1,
        customer_name: this.data.customerName,
        customer_phone: this.data.customerPhone,
        pickup_time: this.data.pickupTime,
        items: this.data.cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })),
        total_amount: this.data.totalAmount, status: 'pending'
      }
      await createOrder(orderData)
      app.clearCart()
      wx.showToast({ title: '下单成功', icon: 'success', duration: 1800 })
      setTimeout(() => { wx.switchTab({ url: '/pages/order-list/index' }) }, 1800)
    } catch (error) {
      wx.showToast({ title: '下单失败，请重试', icon: 'none' })
    } finally { this.setData({ submitting: false }) }
  },

  onGoToOrderPage() { wx.switchTab({ url: '/pages/price-query/index' }) }
})