// pages/profile/index.js - 个人中心页
const auth = require('../../services/auth')

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    defaultName: '柳州鲜选会员',
    defaultPhone: '400-820-5520'
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const isLoggedIn = auth.isLoggedIn()
    const userInfo = auth.getCurrentUser()
    this.setData({
      isLoggedIn,
      userInfo: userInfo || { name: this.data.defaultName, phone: this.data.defaultPhone }
    })
  },

  onCallPhone() {
    wx.makePhoneCall({ phoneNumber: '400-820-5520' })
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