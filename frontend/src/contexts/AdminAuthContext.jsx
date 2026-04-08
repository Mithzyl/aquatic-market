import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AdminAuthContext = createContext(null)

const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_MERCHANT_KEY = 'admin_merchant'

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY) || null
    } catch {
      return null
    }
  })

  const [merchant, setMerchant] = useState(() => {
    try {
      const stored = localStorage.getItem(ADMIN_MERCHANT_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // 登录成功后保存状态
  const login = useCallback((newToken, merchantInfo) => {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, newToken)
      localStorage.setItem(ADMIN_MERCHANT_KEY, JSON.stringify(merchantInfo))
      setToken(newToken)
      setMerchant(merchantInfo)
      setError(null)
      console.log('[AdminAuth] 登录成功:', { merchantId: merchantInfo.id, shopName: merchantInfo.shop_name })
    } catch (err) {
      console.error('[AdminAuth] Token 存储失败:', err)
      setError('登录状态保存失败')
    }
  }, [])

  // 退出登录清除状态
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_MERCHANT_KEY)
      setToken(null)
      setMerchant(null)
      setError(null)
      console.log('[AdminAuth] 已退出登录')
    } catch (err) {
      console.error('[AdminAuth] 清除状态失败:', err)
    }
  }, [])

  // 检查是否已登录
  const isAuthenticated = Boolean(token && merchant)

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始化时验证 token 有效性（可选，后续可对接后端验证接口）
  useEffect(() => {
    if (token && merchant) {
      console.log('[AdminAuth] 恢复登录状态:', { merchantId: merchant.id, shopName: merchant.shop_name })
    }
  }, [token, merchant])

  const value = {
    token,
    merchant,
    isAuthenticated,
    isLoading,
    setIsLoading,
    error,
    setError,
    login,
    logout,
    clearError
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export default AdminAuthContext