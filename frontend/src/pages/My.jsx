import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

const My = () => {
  const navigate = useNavigate()
  const { user, logout } = useCustomerAuth()

  // 处理登出
  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  // 用户信息（从 Context 获取）
  const userName = user?.name || '柳州鲜选会员'
  const userPhone = user?.phone || '未绑定手机'
  const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(255, 242, 221, 0.84) 0%, rgba(245, 238, 228, 0.96) 50%, #f7f2ea 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        paddingBottom: 'calc(var(--app-bottom-nav-space) + 12px)'
      }}
    >
      <div className="mx-auto max-w-lg px-4 pt-12 pb-8">
        {/* 头像区域 */}
        <div className="flex flex-col items-center">
          <div
            className="relative h-[120px] w-[120px] overflow-hidden rounded-full border-4 shadow-[0_10px_30px_rgba(105,77,44,0.12)]"
            style={{ borderColor: '#f3e8d8' }}
          >
            <img
              src={userAvatar}
              alt={userName}
              className="h-full w-full object-cover"
            />
          </div>

          {/* 用户名称 */}
          <h1
            className="mt-6 text-center text-[24px] font-bold"
            style={{
              color: '#2f281f',
              fontFamily: '"Noto Serif SC", "Songti SC", serif'
            }}
          >
            {userName}
          </h1>

          {/* 用户手机号 */}
          <p className="mt-2 text-sm text-[#7d6a53]">
            {userPhone}
          </p>
        </div>

        {/* 联系信息卡片 */}
        <div
          className="mt-12 rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_20px_rgba(130,96,59,0.05)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff8f0]">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="#b8860b"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#9a8a78]">联系手机</p>
              <p className="mt-1 text-base font-medium text-[#2f281f]">400-820-5520</p>
            </div>
            <a
              href="tel:400-820-5520"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f5e9] text-[#2f6b56] transition-transform active:scale-95"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* 登出按钮 */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full h-12 rounded-xl bg-[#f5ede1] text-[#7d6a53] font-medium text-sm hover:bg-[#ebe3d7] active:scale-[0.98] transition-all"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}

export default My
