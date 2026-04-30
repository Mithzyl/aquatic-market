import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { CUSTOMER_API_BASE_URL } from '../api/config.js'

function CustomerLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, isLoading, setIsLoading, error, setError, clearError } = useCustomerAuth()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [inputError, setInputError] = useState('')

  const from = location.state?.from || '/'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const validatePhone = (value) => /^1[3-9]\d{9}$/.test(value)

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    setPhone(value)
    setInputError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!validatePhone(phone)) {
      setInputError('请输入正确的手机号')
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
      const response = await fetch(`${CUSTOMER_API_BASE_URL}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '登录失败' }))
        throw new Error(errorData.detail || '登录失败，请重试')
      }

      const data = await response.json()
      const userInfo = {
        id: data.user_id,
        phone: data.phone,
        name: data.nickname,
        nickname: data.nickname,
        avatar_url: data.avatar_url,
        default_merchant_id: data.default_merchant_id
      }
      login(data.token, userInfo)
    } catch (err) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(255, 242, 221, 0.84) 0%, rgba(245, 238, 228, 0.96) 50%, #f7f2ea 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-[#1f4034] flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-[#ff8b52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10.5 12 4l8 6.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.5 9.5V19h11V9.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19v-5h4v5" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#2c241b] mb-2"
          style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}>
          柳州鲜选
        </h1>
        <p className="text-sm text-[#7d6a53] mb-8">新鲜海鲜，当日送达</p>

        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5a4d3d] mb-2">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="请输入手机号"
              className="w-full h-12 px-4 rounded-xl border border-[#eadfce] bg-white text-[#2c241b] placeholder-[#b5a18a] focus:outline-none focus:border-[#1f4034] focus:ring-2 focus:ring-[#1f4034]/20 transition-all"
              disabled={isLoading}
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5a4d3d] mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setInputError('') }}
              placeholder="请输入密码"
              className="w-full h-12 px-4 rounded-xl border border-[#eadfce] bg-white text-[#2c241b] placeholder-[#b5a18a] focus:outline-none focus:border-[#1f4034] focus:ring-2 focus:ring-[#1f4034]/20 transition-all"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {inputError && <div className="text-sm text-[#d67635] text-center py-1">{inputError}</div>}
          {error && <div className="text-sm text-[#d67635] text-center py-1">{error}</div>}

          <button
            type="submit"
            disabled={isLoading || !phone || !password}
            className={`w-full h-14 rounded-xl text-base font-semibold transition-all ${
              isLoading ? 'bg-[#e8dfd0] text-[#7d6a53]' : 'bg-[#1f4034] text-white hover:bg-[#2a5244] active:scale-[0.98] shadow-md'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-sm text-[#7d6a53] hover:text-[#5a4d3d] transition-colors">
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin
