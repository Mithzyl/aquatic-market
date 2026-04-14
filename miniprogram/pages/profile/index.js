// pages/profile/index.js - 个人中心页
Page({
  data: {
    userInfo: {
      name: '柳州鲜选会员',
      phone: '400-820-5520'
    }
  },

  onLoad() {},
  onShow() {},

  onCallPhone() {
    wx.makePhoneCall({ phoneNumber: '400-820-5520' })
  }
})