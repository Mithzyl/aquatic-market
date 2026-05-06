// pages/index/index.js - 首页
const { getProducts, getCategories } = require('../../services/product')
const config = require('../../utils/config')
const configService = require('../../services/config')

Page({
  data: {
    heroProduct: null,
    showcaseProducts: [],
    categories: [],
    carousels: [],
    serviceHighlights: config.serviceHighlights,
    shopName: '柳州鲜选',
    loading: true,
    isEmptyMerchant: false,
    merchantConfig: null
  },

  onLoad() {
    this.checkMerchantStatus()
    this.fetchData()
    this.loadMerchantConfig()
    this.fetchCarousels()
  },

  onPullDownRefresh() {
    this.checkMerchantStatus()
    Promise.all([this.fetchData(), this.fetchCarousels()]).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async checkMerchantStatus() {
    try {
      const hasMerchant = await configService.hasMerchant()
      const merchantConfig = await configService.getConfig()
      this.setData({
        isEmptyMerchant: !hasMerchant,
        merchantConfig: merchantConfig,
        shopName: merchantConfig.shop_name || '柳州鲜选'
      })
    } catch (error) {
      console.error('Failed to check merchant status:', error)
      this.setData({
        isEmptyMerchant: true,
        merchantConfig: configService.getEmptyConfig()
      })
    }
  },

  async loadMerchantConfig() {
    try {
      const shopName = await configService.getShopName()
      this.setData({ shopName })
    } catch (error) {
      console.error('Failed to load merchant config:', error)
    }
  },

  async fetchCarousels() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${config.apiBase}/api/customer/carousels?merchant_id=1&is_active=true`,
          success: resolve,
          fail: reject
        })
      })
      this.setData({ carousels: res.data || [] })
    } catch (error) {
      console.warn('获取轮播图失败:', error)
    }
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

  onRetry() {
    wx.showLoading({ title: '重新加载...' })
    this.checkMerchantStatus()
    this.fetchData().then(() => {
      wx.hideLoading()
    })
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