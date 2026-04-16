/**
 * 平台后台认证 Context
 * 管理平台管理员登录状态、权限检查
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const PlatformAuthContext = createContext(null)

const PLATFORM_TOKEN_KEY = 'platform_token'
const PLATFORM_ADMIN_KEY = 'platform_admin'

export function usePlatformAuth() {
  const context = useContext(PlatformAuthContext)
  if (!context) {
    throw new Error('usePlatformAuth must be used within PlatformAuthProvider')
  }
  return context
}

export function PlatformAuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(PLATFORM_TOKEN_KEY) || null
    } catch {
      return null
    }
  })

  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(PLATFORM_ADMIN_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // 登录成功后保存状态
  const login = useCallback((newToken, adminInfo) => {
    try {
      localStorage.setItem(PLATFORM_TOKEN_KEY, newToken)
      localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(adminInfo))
      setToken(newToken)
      setAdmin(adminInfo)
      setError(null)
      console.log('[PlatformAuth] 登录成功:', {
        adminId: adminInfo.id,
        username: adminInfo.username,
        role: adminInfo.role,
        permissions: adminInfo.permissions
      })
    } catch (err) {
      console.error('[PlatformAuth] Token 存储失败:', err)
      setError('登录状态保存失败')
    }
  }, [])

  // 退出登录清除状态
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(PLATFORM_TOKEN_KEY)
      localStorage.removeItem(PLATFORM_ADMIN_KEY)
      setToken(null)
      setAdmin(null)
      setError(null)
      console.log('[PlatformAuth] 已退出登录')
    } catch (err) {
      console.error('[PlatformAuth] 清除状态失败:', err)
    }
  }, [])

  // 检查是否已登录
  const isAuthenticated = Boolean(token && admin)

  // 获取当前角色
  const role = admin?.role || null

  // 使用 useMemo 包装 permissions，避免每次渲染都创建新数组
  const permissions = useMemo(() => admin?.permissions || [], [admin?.permissions])

  /**
   * 检查是否拥有指定权限
   * @param {string} permissionCode - 权限代码
   * @returns {boolean} 是否拥有该权限
   */
  const hasPermission = useCallback((permissionCode) => {
    if (!permissions || !Array.isArray(permissions)) {
      return false
    }
    return permissions.includes(permissionCode)
  }, [permissions])

  /**
   * 检查是否拥有任意一个指定权限
   * @param {string[]} permissionCodes - 权限代码数组
   * @returns {boolean} 是否拥有任意一个权限
   */
  const hasAnyPermission = useCallback((permissionCodes) => {
    if (!permissions || !Array.isArray(permissions)) {
      return false
    }
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return false
    }
    return permissionCodes.some(code => permissions.includes(code))
  }, [permissions])

  /**
   * 检查是否拥有所有指定权限
   * @param {string[]} permissionCodes - 权限代码数组
   * @returns {boolean} 是否拥有所有权限
   */
  const hasAllPermissions = useCallback((permissionCodes) => {
    if (!permissions || !Array.isArray(permissions)) {
      return false
    }
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return false
    }
    return permissionCodes.every(code => permissions.includes(code))
  }, [permissions])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始化时验证状态
  useEffect(() => {
    if (token && admin) {
      console.log('[PlatformAuth] 恢复登录状态:', {
        adminId: admin.id,
        username: admin.username,
        role: admin.role
      })
    }
  }, [token, admin])

  const value = {
    token,
    admin,
    role,
    permissions,
    isAuthenticated,
    isLoading,
    setIsLoading,
    error,
    setError,
    login,
    logout,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  )
}

export default PlatformAuthContext