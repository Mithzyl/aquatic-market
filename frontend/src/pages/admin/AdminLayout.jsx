import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

// TabBar 配置
const adminTabs = [
  { path: '/admin/products', label: '商品', icon: 'grid' },
  { path: '/admin/categories', label: '品类', icon: 'folder' },
  { path: '/admin/revenue', label: '收益', icon: 'chart' },
  { path: '/admin/settings', label: '设置', icon: 'cog' }
]

// TabBar 图标组件
function AdminNavIcon({ type, isActive }) {
  const common = {
    className: `h-[22px] w-[22px] transition-transform duration-200 ${isActive ? 'scale-105' : ''}`,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }

  // 商品 - grid 图标
  if (type === 'grid') {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" strokeWidth={1.9} />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" strokeWidth={1.9} />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" strokeWidth={1.9} />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" strokeWidth={1.9} />
      </svg>
    )
  }

  // 品类 - folder 图标
  if (type === 'folder') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M3 7.5V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.5l-1.5-2H5a2 2 0 00-2 2v.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M3 9h18" />
      </svg>
    )
  }

  // 收益 - chart 图标
  if (type === 'chart') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M4 20V10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M10 20V4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M16 20v-8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M22 20v-4" />
      </svg>
    )
  }

  // 设置 - cog 图标
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" strokeWidth={1.9} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 1.5v2M12 20.5v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1.5 12h2M20.5 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

// 顶部栏组件
function AdminHeader() {
  const { merchant } = useAdminAuth()
  const shopName = merchant?.shop_name || '商家后台'
  const roleName = merchant?.role?.name || ''

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#fbf6ef] safe-area-top">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo + 店铺名称 */}
          <div className="flex items-center gap-2.5">
            {/* Logo */}
            <div className="w-9 h-9 rounded-full bg-[#201710] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#ff8b52]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10.5 12 4l8 6.5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.5 9.5V19h11V9.5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19v-5h4v5" />
              </svg>
            </div>
            {/* 店铺名称 */}
            <div className="flex flex-col">
              <span
                className="text-base font-semibold text-[#2c241b] truncate max-w-[180px]"
                style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
              >
                {shopName}
              </span>
              {/* 角色标签 */}
              {roleName && (
                <span className="text-xs text-[#8b755d] -mt-0.5">
                  {roleName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// 底部 TabBar 组件
function AdminTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#fbf6ef] safe-area-bottom">
      <div className="mx-auto max-w-lg px-4 pb-3">
        <div className="flex h-[72px] items-center rounded-[28px] border border-[#eadfce] bg-[#fbf6ef] px-2 shadow-[0_-8px_30px_rgba(76,56,32,0.08)]">
          {adminTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/admin/products'}
              className={({ isActive }) =>
                `relative flex h-full w-full flex-col items-center justify-center rounded-[22px] transition-all ${
                  isActive ? 'text-[#1f4034]' : 'text-[#8b755d]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute inset-x-2 inset-y-2 rounded-[20px] bg-[#fff3e7]" />
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <AdminNavIcon type={tab.icon} isActive={isActive} />
                    <span className={`mt-1 text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {tab.label}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

// AdminLayout 主组件
function AdminLayout() {
  const { isAuthenticated } = useAdminAuth()

  // 未登录时显示空白背景（路由守卫会重定向到登录页）
  // 这样可以避免布局闪烁，同时确保重定向正常工作
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #f6efe4 0%, #f8f4ee 50%, #f2ebe0 100%)'
        }}
      >
        <Outlet />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #f6efe4 0%, #f8f4ee 50%, #f2ebe0 100%)',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      {/* 顶部栏 */}
      <AdminHeader />

      {/* 主内容区 */}
      <main className="flex-1 pt-14 pb-[88px] overflow-y-auto">
        <div className="mx-auto max-w-lg px-4">
          <Outlet />
        </div>
      </main>

      {/* 底部 TabBar */}
      <AdminTabBar />
    </div>
  )
}

export default AdminLayout