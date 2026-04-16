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
      console.log('[AdminAuth] 登录成功:', {
        merchantId: merchantInfo.id,
        shopName: merchantInfo.shop_name,
        role: merchantInfo.role ? {
          code: merchantInfo.role.code,
          name: merchantInfo.role.name,
          permissions: merchantInfo.role.permissions
        } : '无角色信息'
      })
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

  // 获取当前角色信息（便捷访问）
  const role = merchant?.role || null

  /**
   * 检查是否拥有指定权限
   * @param {string} permissionCode - 权限代码，如 'product:create'
   * @returns {boolean} 是否拥有该权限
   * 
   * @example
   * const { hasPermission } = useAdminAuth()
   * if (hasPermission('product:create')) {
   *   // 显示创建商品按钮
   * }
   */
  const hasPermission = useCallback((permissionCode) => {
    if (!role || !role.permissions || !Array.isArray(role.permissions)) {
      return false
    }
    return role.permissions.includes(permissionCode)
  }, [role])

  /**
   * 检查是否拥有任意一个指定权限
   * @param {string[]} permissionCodes - 权限代码数组
   * @returns {boolean} 是否拥有任意一个权限
   * 
   * @example
   * const { hasAnyPermission } = useAdminAuth()
   * if (hasAnyPermission(['product:create', 'product:delete'])) {
   *   // 用户有创建或删除商品的权限
   * }
   */
  const hasAnyPermission = useCallback((permissionCodes) => {
    if (!role || !role.permissions || !Array.isArray(role.permissions)) {
      return false
    }
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return false
    }
    return permissionCodes.some(code => role.permissions.includes(code))
  }, [role])

  /**
   * 检查是否拥有所有指定权限
   * @param {string[]} permissionCodes - 权限代码数组
   * @returns {boolean} 是否拥有所有权限
   * 
   * @example
   * const { hasAllPermissions } = useAdminAuth()
   * if (hasAllPermissions(['product:create', 'product:edit'])) {
   *   // 用户同时拥有创建和编辑权限
   * }
   */
  const hasAllPermissions = useCallback((permissionCodes) => {
    if (!role || !role.permissions || !Array.isArray(role.permissions)) {
      return false
    }
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return false
    }
    return permissionCodes.every(code => role.permissions.includes(code))
  }, [role])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始化时验证 token 有效性（可选，后续可对接后端验证接口）
  useEffect(() => {
    if (token && merchant) {
      console.log('[AdminAuth] 恢复登录状态:', {
        merchantId: merchant.id,
        shopName: merchant.shop_name,
        role: merchant.role ? {
          code: merchant.role.code,
          name: merchant.role.name
        } : '无角色信息'
      })
    }
  }, [token, merchant])

  const value = {
    token,
    merchant,
    role,           // 当前角色信息 (merchant.role 的便捷访问)
    isAuthenticated,
    isLoading,
    setIsLoading,
    error,
    setError,
    login,
    logout,
    clearError,
    // 权限检查方法
    hasPermission,        // 检查单个权限
    hasAnyPermission,     // 检查任意一个权限
    hasAllPermissions     // 检查所有权限
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export default AdminAuthContext