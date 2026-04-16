// utils/request.js - 统一请求封装
const config = require('./config')

/**
 * 统一请求函数
 * @param {string} url - 请求路径（不含基础地址）
 * @param {object} options - 请求选项
 * @returns {Promise} 请求结果
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(config.tokenKey)
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    wx.request({
      url: config.apiBase + config.apiPrefix + url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success(res) {
        if (res.statusCode === 401) {
          // Token 过期，清除登录状态
          wx.removeStorageSync(config.tokenKey)
          wx.removeStorageSync(config.userKey)
          reject(new Error('未授权，请重新登录'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const errMsg = (res.data && res.data.detail) || `请求失败 (${res.statusCode})`
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

// 便捷方法
function get(url, data) {
  return request(url, { method: 'GET', data })
}

function post(url, data) {
  return request(url, { method: 'POST', data })
}

function put(url, data) {
  return request(url, { method: 'PUT', data })
}

function del(url, data) {
  return request(url, { method: 'DELETE', data })
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}