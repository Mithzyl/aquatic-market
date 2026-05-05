// pages/profile/index.js - 个人中心页
const auth = require('../../services/auth')
const configService = require('../../services/config')

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    defaultName: '柳州鲜选会员',
    contactPhone: '',
    refreshing: false
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadMerchantConfig()
  },

  onShow() {
    // 每次显示页面时，如果已登录则刷新用户数据
    this.refreshUserData()
  },

  async loadMerchantConfig() {
    try {
      const phone = await configService.getContactPhone()
      this.setData({ contactPhone: phone })
    } catch (error) {
      console.error('Failed to load merchant config:', error)
    }
  },

  checkLoginStatus() {
    const isLoggedIn = auth.isLoggedIn()
    const userInfo = auth.getCurrentUser()
    this.setData({
      isLoggedIn,
      userInfo: userInfo || { name: this.data.defaultName, phone: this.data.contactPhone }
    })
  },

  async refreshUserData() {
    // 如果未登录，只检查本地状态
    if (!auth.isLoggedIn()) {
      this.checkLoginStatus()
      return
    }

    // 已登录，调用 API 刷新用户数据
    try {
      this.setData({ refreshing: true })
      const userData = await auth.getUserInfo()
      
      // 更新本地存储的用户信息
      const updatedUser = {
        id: userData.id,
        phone: userData.phone,
        nickname: userData.nickname,
        avatar_url: userData.avatar_url,
        real_name: userData.real_name,
        default_merchant_id: userData.default_merchant_id
      }
      wx.setStorageSync('customer_user', updatedUser)
      
      // 更新页面显示
      this.setData({
        isLoggedIn: true,
        userInfo: updatedUser,
        refreshing: false
      })
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      this.setData({ refreshing: false })
      
      // 如果是授权错误，清除登录状态
      if (error.message && error.message.includes('未授权')) {
        auth.logout()
        this.checkLoginStatus()
      }
    }
  },

  onCallPhone() {
    wx.makePhoneCall({ phoneNumber: this.data.contactPhone })
  },

  onLogin() {
    wx.navigateTo({
      url: '/pages/login/index?from=' + encodeURIComponent('/pages/profile/index')
    })
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout()
          this.checkLoginStatus()
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          })
        }
      }
    })
  }
})