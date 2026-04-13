/**
 * 平台后台登录页
 * 管理员使用用户名密码登录
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlatformAuth } from '../../contexts/PlatformAuthContext'
import { platformLogin } from '../../api/platform'

function PlatformLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, login: authLogin, isLoading, setIsLoading, error, setError, clearError } = usePlatformAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inputError, setInputError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 已登录则跳转到 Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[PlatformLogin] 已登录，跳转到 Dashboard')
      navigate('/platform/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 用户名输入变化
  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
    setInputError('')
  }

  // 密码输入变化
  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    setInputError('')
  }

  // 登录提交
  const handleLogin = async (e) => {
    e.preventDefault()

    // 校验用户名
    if (!username || username.length < 3) {
      setInputError('用户名至少 3 个字符')
      return
    }

    // 校验密码
    if (!password || password.length < 6) {
      setInputError('密码至少 6 个字符')
      return
    }

    setIsLoading(true)
    setInputError('')
    clearError()

    try {
      console.log('[PlatformLogin] 发起登录请求:', { username })

      const response = await platformLogin({
        username,
        password
      })

      // 登录成功
      authLogin(response.token, {
        id: response.admin_id,
        username: response.username,
        role: response.role,
        permissions: response.permissions
      })

      console.log('[PlatformLogin] 登录成功，等待自动跳转')

    } catch (err) {
      console.error('[PlatformLogin] 登录失败:', err.message)
      setError(err.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* 主内容区 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo + 品牌名 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              柳州鲜选 · 平台后台
            </h1>
            <p className="text-slate-400 text-sm">
              平台运营管理中心
            </p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="请输入用户名"
                className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="请输入密码"
                  className="w-full h-12 px-4 pr-12 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.413m-5.858.908l3.29 3.29" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 输入错误提示 */}
            {inputError && (
              <div className="text-sm text-red-400 text-center py-1 bg-red-500/10 rounded-lg">
                {inputError}
              </div>
            )}

            {/* API 错误提示 */}
            {error && (
              <div className="text-sm text-red-400 text-center py-1 bg-red-500/10 rounded-lg">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className={`w-full h-12 rounded-lg text-base font-semibold transition-all ${
                isLoading
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-blue-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 测试账号提示 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              测试账号: admin / admin123
            </p>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="py-4 text-center">
        <p className="text-xs text-slate-600">
          © 2024 柳州鲜选 · 平台运营中心
        </p>
      </div>
    </div>
  )
}

export default PlatformLogin