import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { login } from '../../api/admin'

function AdminLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, login: authLogin, isLoading, setIsLoading, error, setError, clearError } = useAdminAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inputError, setInputError] = useState('')

  // 已登录则跳转到商品管理
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[AdminLogin] 已登录，跳转到商品管理')
      navigate('/admin/products', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 登录提交
  const handleLogin = async (e) => {
    e.preventDefault()

    if (!username.trim()) {
      setInputError('请输入用户名或手机号')
      return
    }
    if (!password || password.length < 6) {
      setInputError('密码至少6位')
      return
    }

    setIsLoading(true)
    setInputError('')
    clearError()

    try {
      const response = await login({ username, password })
      authLogin(response.token, response.merchant)
    } catch (err) {
      console.error('[AdminLogin] 登录失败:', err.message)
      setError(err.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #f6efe4 0%, #f8f4ee 50%, #f2ebe0 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-[#201710] flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-[#ff8b52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10.5 12 4l8 6.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.5 9.5V19h11V9.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19v-5h4v5" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#2c241b] mb-2"
          style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}>
          柳州鲜选 · 商家版
        </h1>
        <p className="text-sm text-[#7d6a53] mb-8">海鲜零售门店管理系统</p>

        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5a4d3d] mb-2">用户名 / 手机号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setInputError('') }}
              placeholder="请输入用户名或手机号"
              className="w-full h-12 px-4 rounded-xl border border-[#eadfce] bg-white text-[#2c241b] placeholder-[#b5a18a] focus:outline-none focus:border-[#ff8b52] focus:ring-2 focus:ring-[#ff8b52]/20 transition-all"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a4d3d] mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setInputError('') }}
              placeholder="请输入密码"
              className="w-full h-12 px-4 rounded-xl border border-[#eadfce] bg-white text-[#2c241b] placeholder-[#b5a18a] focus:outline-none focus:border-[#ff8b52] focus:ring-2 focus:ring-[#ff8b52]/20 transition-all"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {inputError && (
            <div className="text-sm text-[#d67635] text-center py-1">{inputError}</div>
          )}
          {error && (
            <div className="text-sm text-[#d67635] text-center py-1">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-14 rounded-xl text-base font-semibold transition-all ${
              isLoading ? 'bg-[#e8dfd0] text-[#7d6a53]' : 'bg-[#ff8b52] text-white hover:bg-[#e67842] active:scale-[0.98] shadow-md'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-[#9a8062]">
            还没有店铺？<span className="ml-1 text-[#2f6b56] font-medium">请联系平台管理员</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
