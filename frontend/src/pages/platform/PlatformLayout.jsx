/**
 * 平台后台布局组件
 * 包含侧边栏导航和顶部栏
 */
import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { usePlatformAuth } from '../../contexts/PlatformAuthContext'

// 侧边栏导航配置
const sidebarNav = [
  { path: '/platform/dashboard', label: '数据概览', icon: 'chart' },
  { path: '/platform/merchants', label: '商家管理', icon: 'store' },
  { path: '/platform/carousels', label: '轮播图', icon: 'image' },
  { path: '/platform/products', label: '商品管理', icon: 'box' },
  { path: '/platform/users', label: '用户管理', icon: 'users', disabled: true },
  { path: '/platform/audit', label: '审核管理', icon: 'audit', disabled: true },
]

// 侧边栏图标组件
function SidebarIcon({ type, isActive }) {
  const common = {
    className: `w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }

  // 数据概览 - chart 图标
  if (type === 'chart') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 20V10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20V4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 20v-8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M22 20v-4" />
      </svg>
    )
  }

  // 商家管理 - store 图标
  if (type === 'store') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10.5 12 4l8 6.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.5 9.5V19h11V9.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19v-5h4v5" />
      </svg>
    )
  }

  // 用户管理 - users 图标
  if (type === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="7" r="4" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 20c0-4 4-6 6-6s6 2 6 6" />
        <circle cx="17" cy="11" r="3" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 20c0-3-3-5-4-5" />
      </svg>
    )
  }

  // 轮播图 - image 图标
  if (type === 'image') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }

  // 商品管理 - box 图标
  if (type === 'box') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  }

  // 审核管理 - audit 图标
  return (
    <svg {...common}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

// 顶部栏组件
function PlatformHeader() {
  const { admin, logout } = usePlatformAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/platform/login', { replace: true })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center justify-between h-full px-4 ml-64">
        {/* 左侧标题 */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">
            平台运营中心
          </h1>
        </div>

        {/* 右侧用户信息 */}
        <div className="flex items-center gap-4">
          {/* 用户名 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {admin?.username?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <span className="text-sm text-slate-300">
              {admin?.username || '管理员'}
            </span>
          </div>

          {/* 退出按钮 */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出
          </button>
        </div>
      </div>
    </header>
  )
}

// 侧边栏组件
function PlatformSidebar() {
  const { admin } = usePlatformAuth()

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800">
      {/* Logo 区域 */}
      <div className="flex items-center gap-3 h-14 px-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
          </svg>
        </div>
        <div>
          <span className="text-base font-semibold text-white">
            柳州鲜选
          </span>
          <span className="text-xs text-slate-500 block -mt-0.5">
            平台后台
          </span>
        </div>
      </div>

      {/* 导航区域 */}
      <nav className="py-4 px-3">
        <div className="space-y-1">
          {sidebarNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.disabled ? '#' : item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  item.disabled
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : isActive
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault()
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <SidebarIcon type={item.icon} isActive={isActive && !item.disabled} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.disabled && (
                    <span className="text-xs text-slate-600 ml-auto">待开发</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* 底部用户信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-300">
              {admin?.username?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {admin?.username || '管理员'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {admin?.role || '管理员'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// PlatformLayout 主组件
function PlatformLayout() {
  const { isAuthenticated } = usePlatformAuth()

  // 未登录时显示空白背景（路由守卫会重定向到登录页）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 侧边栏 */}
      <PlatformSidebar />

      {/* 顶部栏 */}
      <PlatformHeader />

      {/* 主内容区 */}
      <main className="ml-64 pt-14 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default PlatformLayout