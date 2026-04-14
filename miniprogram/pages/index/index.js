// pages/index/index.js - 首页
const { getProducts, getCategories } = require('../../services/product')
const config = require('../../utils/config')

Page({
  data: {
    heroProduct: null,
    showcaseProducts: [],
    categories: [],
    serviceHighlights: config.serviceHighlights,
    loading: true
  },

  onLoad() {
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async fetchData() {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ])
      const products = Array.isArray(productsData) ? productsData : []
      const categories = Array.isArray(categoriesData) ? categoriesData : []
      this.setData({
        heroProduct: products[0] || null,
        showcaseProducts: products.slice(0, 3),
        categories,
        loading: false
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
      this.setData({ loading: false })
    }
  },

  onGoToOrder() {
    wx.switchTab({ url: '/pages/price-query/index' })
  },

  onGoToOrders() {
    wx.switchTab({ url: '/pages/order-list/index' })
  },

  onGoToProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}` })
  },

  onGoToPriceQuery() {
    wx.switchTab({ url: '/pages/price-query/index' })
  }
})