/**
 * 用户端认证 Context
 * 管理用户端登录状态、用户信息
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CustomerAuthContext = createContext(null)

const CUSTOMER_TOKEN_KEY = 'customer_token'
const CUSTOMER_USER_KEY = 'customer_user'

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider')
  }
  return context
}

export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(CUSTOMER_TOKEN_KEY) || null
    } catch {
      return null
    }
  })

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOMER_USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // 登录成功后保存状态
  const login = useCallback((newToken, userInfo) => {
    try {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, newToken)
      localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(userInfo))
      setToken(newToken)
      setUser(userInfo)
      setError(null)
      console.log('[CustomerAuth] 登录成功:', {
        userId: userInfo.id,
        phone: userInfo.phone,
        name: userInfo.name
      })
    } catch (err) {
      console.error('[CustomerAuth] Token 存储失败:', err)
      setError('登录状态保存失败')
    }
  }, [])

  // 退出登录清除状态
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY)
      localStorage.removeItem(CUSTOMER_USER_KEY)
      setToken(null)
      setUser(null)
      setError(null)
      console.log('[CustomerAuth] 已退出登录')
    } catch (err) {
      console.error('[CustomerAuth] 清除状态失败:', err)
    }
  }, [])

  // 检查是否已登录
  const isAuthenticated = Boolean(token && user)

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始化时验证状态
  useEffect(() => {
    if (token && user) {
      console.log('[CustomerAuth] 恢复登录状态:', {
        userId: user.id,
        phone: user.phone,
        name: user.name
      })
    }
  }, [token, user])

  const value = {
    token,
    user,
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
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export default CustomerAuthContext