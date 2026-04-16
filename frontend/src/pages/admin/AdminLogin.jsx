import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { login } from '../../api/admin'

function AdminLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, login: authLogin, isLoading, setIsLoading, error, setError, clearError } = useAdminAuth()

  const [phone, setPhone] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [inputError, setInputError] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  // 已登录则跳转到商品管理
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[AdminLogin] 已登录，跳转到商品管理')
      navigate('/admin/products', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 手机号格式校验（11位数字，以1开头）
  const validatePhone = (value) => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(value)
  }

  // 手机号输入变化
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    setPhone(value)
    setInputError('')
    setCodeSent(false)
  }

  // 验证码输入变化
  const handleVerifyCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setVerifyCode(value)
  }

  // 发送验证码（模拟）
  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setInputError('请输入正确的手机号')
      return
    }

    setIsSendingCode(true)
    clearError()

    // 模拟发送验证码（实际项目中对接短信服务）
    setTimeout(() => {
      setIsSendingCode(false)
      setCodeSent(true)
      console.log('[AdminLogin] 验证码已发送（模拟）')
    }, 1000)
  }

  // 登录提交
  const handleLogin = async (e) => {
    e.preventDefault()

    // 校验手机号
    if (!validatePhone(phone)) {
      setInputError('请输入正确的手机号')
      return
    }

    // 校验验证码
    if (!verifyCode || verifyCode.length !== 6) {
      setInputError('请输入 6 位验证码')
      return
    }

    setIsLoading(true)
    setInputError('')
    clearError()

    try {
      console.log('[AdminLogin] 发起登录请求:', { phone })

      // 调用 API 封装的 login 函数
      const response = await login({
        phone,
        verify_code: verifyCode
      })

      // 登录成功，调用 AdminAuthContext.login() 存储 Token
      // isAuthenticated 状态更新后，useEffect 会自动触发跳转，避免双重 navigate 竞态问题
      authLogin(response.token, response.merchant)

      console.log('[AdminLogin] 登录成功，等待自动跳转')

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
      {/* Hero 区域 - Logo + 品牌 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-[#201710] flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-[#ff8b52]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 10.5 12 4l8 6.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M6.5 9.5V19h11V9.5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M10 19v-5h4v5"
              />
            </svg>
          </div>
        </div>

        {/* 品牌名 */}
        <h1
          className="text-2xl font-bold text-[#2c241b] mb-2"
          style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
        >
          柳州鲜选 · 商家版
        </h1>

        <p className="text-sm text-[#7d6a53] mb-8">
          海鲜零售门店管理系统
        </p>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          {/* 手机号输入 */}
          <div>
            <label className="block text-xs font-medium text-[#5a4d3d] mb-2">
              手机号
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="请输入手机号"
                className="flex-1 h-12 px-4 rounded-xl border border-[#eadfce] bg-white text-[#2c241b] placeholder-[#b5a18a] focus:outline-none focus:border-[#ff8b52] focus:ring-2 focus:ring-[#ff8b52]/20 transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading || isSendingCode || !phone || codeSent}
                className={`h-12 px-4 rounded-xl text-sm font-medium transition-all ${
                  codeSent
                    ? 'bg-[#e8dfd0] text-[#7d6a53]'
                    : 'bg-[#fff4e8] text-[#2f6b56] hover:bg-[#ffe8d6] active:scale-[0.98]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSendingCode ? '发送中...' : codeSent ? '已发送' : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 验证码输入 */}
          <div>
            <label className="block text-xs font-medium text-[#5a4d3d] mb-2">
              验证码
            </label>
            <input
              type="tel"
              value={verifyCode}
              onChange={handleVerifyCodeChange}
              placeholder="请输入 6 位验证码"
              maxLength={6}
              className="w-full h-12 px-4 rounded-xl border border-[#eadfce] bg-white text-[#2c241b] placeholder-[#b5a18a] focus:outline-none focus:border-[#ff8b52] focus:ring-2 focus:ring-[#ff8b52]/20 transition-all"
              disabled={isLoading}
            />
          </div>

          {/* 输入错误提示 */}
          {inputError && (
            <div className="text-sm text-[#d67635] text-center py-1">
              {inputError}
            </div>
          )}

          {/* API 错误提示 */}
          {error && (
            <div className="text-sm text-[#d67635] text-center py-1">
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading || !phone || !verifyCode}
            className={`w-full h-14 rounded-xl text-base font-semibold transition-all ${
              isLoading
                ? 'bg-[#e8dfd0] text-[#7d6a53]'
                : 'bg-[#ff8b52] text-white hover:bg-[#e67842] active:scale-[0.98] shadow-md'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 商家入驻入口 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#9a8062]">
            还没有店铺？
            <a
              href="#"
              className="ml-1 text-[#2f6b56] font-medium hover:underline"
              onClick={(e) => {
                e.preventDefault()
                console.log('[AdminLogin] 商家入驻入口（待实现）')
              }}
            >
              申请入驻
            </a>
          </p>
        </div>
      </div>

      {/* 开发环境提示 - 生产构建时此块会被 tree-shake 移除 */}
      {import.meta.env.DEV && (
        <div className="pb-6 text-center">
          <p className="text-xs text-[#b5a18a]">
            当前为开发环境，请使用测试验证码登录
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminLogin