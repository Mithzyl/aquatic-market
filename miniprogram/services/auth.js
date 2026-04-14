// services/auth.js - 用户认证服务
const { post, get } = require('../utils/request')
const config = require('../utils/config')

/**
 * 微信登录
 * @returns {Promise} 登录结果，包含token和用户信息
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端微信登录接口
          post('/auth/login', { code: res.code })
            .then(data => {
              // 保存token和用户信息
              wx.setStorageSync(config.tokenKey, data.token)
              wx.setStorageSync(config.userKey, {
                id: data.user_id,
                phone: data.phone,
                nickname: data.nickname,
                avatar_url: data.avatar_url,
                default_merchant_id: data.default_merchant_id
              })
              resolve(data)
            })
            .catch(err => reject(err))
        } else {
          reject(new Error('微信登录失败：' + res.errMsg))
        }
      },
      fail: (err) => reject(new Error('wx.login调用失败：' + err.errMsg))
    })
  })
}

/**
 * 手机号注册/登录
 * @param {string} phone - 手机号
 * @param {string} nickname - 昵称（可选）
 * @param {number} merchantId - 默认商家ID（可选）
 * @returns {Promise} 登录结果
 */
function phoneLogin(phone, nickname = '', merchantId = null) {
  return post('/auth/register', {
    phone,
    nickname,
    merchant_id: merchantId
  }).then(data => {
    // 保存token和用户信息
    wx.setStorageSync(config.tokenKey, data.token)
    wx.setStorageSync(config.userKey, {
      id: data.user_id,
      phone: data.phone,
      nickname: data.nickname,
      avatar_url: data.avatar_url,
      default_merchant_id: data.default_merchant_id
    })
    return data
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息
 */
function getUserInfo() {
  return get('/auth/me')
}

/**
 * 更新用户信息
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
function updateUserInfo(data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.apiBase + '/api/customer/auth/me',
      method: 'PUT',
      data: data,
      header: {
        'Authorization': `Bearer ${wx.getStorageSync(config.tokenKey)}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data.detail || '更新失败'))
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '网络请求失败'))
    })
  })
}

/**
 * 检查登录状态
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
  const token = wx.getStorageSync(config.tokenKey)
  const user = wx.getStorageSync(config.userKey)
  return !!token && !!user && !!user.id
}

/**
 * 获取当前用户ID
 * @returns {number|null} 用户ID
 */
function getUserId() {
  const user = wx.getStorageSync(config.userKey)
  return user ? user.id : null
}

/**
 * 获取当前用户完整信息
 * @returns {object|null} 用户信息
 */
function getCurrentUser() {
  return wx.getStorageSync(config.userKey)
}

/**
 * 清除登录状态
 */
function logout() {
  wx.removeStorageSync(config.tokenKey)
  wx.removeStorageSync(config.userKey)
}

module.exports = {
  wxLogin,
  phoneLogin,
  getUserInfo,
  updateUserInfo,
  isLoggedIn,
  getUserId,
  getCurrentUser,
  logout
}