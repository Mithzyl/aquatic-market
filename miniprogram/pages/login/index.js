// pages/login/index.js - 用户登录页
const auth = require('../../services/auth')
const config = require('../../utils/config')
const { post } = require('../../utils/request')

Page({
  data: {
    phone: '',
    verifyCode: '',
    inputError: '',
    apiError: '',
    isSendingCode: false,
    codeSent: false,
    isLoading: false,
    countdown: 0
  },

  onLoad(options) {
    // 获取来源页面，登录成功后跳转回去
    this.fromPage = options.from || ''
    this.tabIndex = options.tabIndex || ''
  },

  onShow() {
    // 检查是否已登录
    if (auth.isLoggedIn()) {
      this.navigateBack()
    }
  },

  // 手机号输入
  onPhoneInput(e) {
    const value = e.detail.value.replace(/\D/g, '').slice(0, 11)
    this.setData({
      phone: value,
      inputError: '',
      codeSent: false
    })
  },

  // 验证码输入
  onVerifyCodeInput(e) {
    const value = e.detail.value.replace(/\D/g, '').slice(0, 6)
    this.setData({
      verifyCode: value,
      inputError: ''
    })
  },

  // 校验手机号格式
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  },

  // 发送验证码（模拟）
  handleSendCode() {
    const { phone, isSendingCode, codeSent } = this.data

    if (isSendingCode || codeSent) return

    if (!this.validatePhone(phone)) {
      this.setData({ inputError: '请输入正确的手机号' })
      return
    }

    this.setData({
      isSendingCode: true,
      inputError: '',
      apiError: ''
    })

    // 模拟发送验证码（实际项目中对接短信服务）
    setTimeout(() => {
      this.setData({
        isSendingCode: false,
        codeSent: true,
        countdown: 60
      })

      // 开始倒计时
      this.startCountdown()

      wx.showToast({
        title: '验证码已发送',
        icon: 'success',
        duration: 2000
      })
    }, 1000)
  },

  // 倒计时
  startCountdown() {
    if (this.data.countdown > 0) {
      this.setData({
        countdown: this.data.countdown - 1
      })
      setTimeout(() => this.startCountdown(), 1000)
    }
  },

  // 登录提交
  async handleLogin() {
    const { phone, verifyCode, isLoading } = this.data

    if (isLoading) return

    // 校验手机号
    if (!this.validatePhone(phone)) {
      this.setData({ inputError: '请输入正确的手机号' })
      return
    }

    // 校验验证码
    if (!verifyCode || verifyCode.length !== 6) {
      this.setData({ inputError: '请输入 6 位验证码' })
      return
    }

    this.setData({
      isLoading: true,
      inputError: '',
      apiError: ''
    })

    try {
      console.log('[Login] 发起登录请求:', { phone })

      // 调用 POST /api/customer/auth/register 接口
      const data = await post('/auth/register', {
        phone,
        verify_code: verifyCode
      })

      console.log('[Login] 登录响应:', data)

      // 登录成功，存储 Token 和用户信息
      wx.setStorageSync(config.tokenKey, data.token)
      wx.setStorageSync(config.userKey, {
        id: data.user_id,
        phone: data.phone,
        nickname: data.nickname,
        avatar_url: data.avatar_url,
        default_merchant_id: data.default_merchant_id
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      // 延迟跳转
      setTimeout(() => {
        this.navigateBack()
      }, 1500)

    } catch (err) {
      console.error('[Login] 登录失败:', err.message)
      this.setData({
        apiError: err.message || '登录失败，请重试',
        isLoading: false
      })
    }
  },

  // 返回上一页或首页
  navigateBack() {
    if (this.fromPage) {
      // 返回来源页面
      wx.redirectTo({
        url: decodeURIComponent(this.fromPage)
      })
    } else {
      // 返回首页
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})