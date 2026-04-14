// pages/price-query/index.js - 下单页
const { getProducts, getCategories } = require('../../services/product')
const config = require('../../utils/config')
const app = getApp()

Page({
  data: {
    products: [],
    categories: [],
    activeCategoryId: '',
    searchQuery: '',
    groupedProducts: [],
    showAddedToast: false,
    showCartPreview: false,
    totalItems: 0,
    totalPrice: 0
  },

  onLoad() {
    this.fetchData()
  },

  onShow() {
    this.updateCartInfo()
  },

  updateCartInfo() {
    const cartItems = app.globalData.cartItems
    this.setData({
      totalItems: app.getTotalItems(),
      totalPrice: app.getTotalPrice()
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
      const activeCategoryId = categories.length > 0 ? categories[0].id : ''
      this.setData({ products, categories, activeCategoryId }, () => {
        this.filterProducts()
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  },

  filterProducts() {
    const { products, categories, searchQuery, activeCategoryId } = this.data
    const normalizedQuery = searchQuery.trim().toLowerCase()
    
    const filtered = products.filter(p => {
      if (!normalizedQuery) return true
      return p.name.toLowerCase().includes(normalizedQuery) ||
        (p.category_name && p.category_name.toLowerCase().includes(normalizedQuery)) ||
        p.description.toLowerCase().includes(normalizedQuery)
    })

    const groupedProducts = categories
      .map(cat => ({
        ...cat,
        products: filtered.filter(p => p.category === cat.id)
      }))
      .filter(cat => cat.products.length > 0)

    this.setData({ groupedProducts })
  },

  onCategoryClick(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeCategoryId: id })
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value }, () => {
      this.filterProducts()
    })
  },

  onClearSearch() {
    this.setData({ searchQuery: '' }, () => {
      this.filterProducts()
    })
  },

  onProductClick(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}` })
  },

  onAddToCart(e) {
    const product = e.currentTarget.dataset.product
    app.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    })
    this.updateCartInfo()
    this.setData({ showAddedToast: true })
    setTimeout(() => {
      this.setData({ showAddedToast: false })
    }, 1400)
  },

  onDecreaseFromCart(e) {
    const productId = e.currentTarget.dataset.id
    app.updateQuantity(productId, -1)
    this.updateCartInfo()
  },

  onToggleCartPreview() {
    this.setData({ showCartPreview: !this.data.showCartPreview })
  },

  onGoToBooking() {
    wx.navigateTo({ url: '/pages/booking/index' })
  },

  onGoToOrders() {
    wx.switchTab({ url: '/pages/order-list/index' })
  },

  getQuantity(productId) {
    const item = app.globalData.cartItems.find(i => i.id === productId)
    return item ? item.quantity : 0
  }
})