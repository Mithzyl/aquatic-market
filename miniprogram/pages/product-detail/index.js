// pages/product-detail/index.js - 商品详情页
const { getProductById } = require('../../services/product')
const app = getApp()

Page({
  data: {
    product: null,
    quantity: 1,
    loading: true,
    fallbackImage: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&h=1200&fit=crop'
  },

  onLoad(options) {
    const id = options.id
    if (id) {
      this.fetchProduct(id)
    }
  },

  async fetchProduct(id) {
    try {
      this.setData({ loading: true })
      const data = await getProductById(id)
      this.setData({ product: data, loading: false })
    } catch (error) {
      console.error('Failed to fetch product:', error)
      this.setData({ product: null, loading: false })
    }
  },

  onDecrease() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 })
    }
  },

  onIncrease() {
    const max = this.data.product ? (this.data.product.stock || 99) : 99
    if (this.data.quantity < max) {
      this.setData({ quantity: this.data.quantity + 1 })
    }
  },

  onAddToCart() {
    if (!this.data.product) return
    app.addToCart({
      id: this.data.product.id,
      name: this.data.product.name,
      price: this.data.product.price,
      image: this.data.product.image
    }, this.data.quantity)
    wx.showToast({ title: '已加入已选', icon: 'none', duration: 1400 })
  },

  onBuyNow() {
    if (!this.data.product) return
    app.addToCart({
      id: this.data.product.id,
      name: this.data.product.name,
      price: this.data.product.price,
      image: this.data.product.image
    }, this.data.quantity)
    wx.navigateTo({ url: '/pages/booking/index' })
  },

  onGoBack() {
    wx.navigateBack()
  },

  onImageError(e) {
    // 图片加载失败时使用默认图片
  }
})