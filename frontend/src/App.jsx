import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Booking from './pages/Booking'
import PriceQuery from './pages/PriceQuery'
import OrderManagement from './pages/OrderManagement'
import My from './pages/My'
import CustomerLogin from './pages/CustomerLogin'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminProducts from './pages/admin/AdminProducts'
import AdminRevenue from './pages/admin/AdminRevenue'
import AdminCategories from './pages/admin/AdminCategories'
import AdminSettings from './pages/admin/AdminSettings'
import AdminCarousels from './pages/admin/AdminCarousels'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
// 平台后台页面
import PlatformLogin from './pages/platform/PlatformLogin'
import PlatformLayout from './pages/platform/PlatformLayout'
import PlatformDashboard from './pages/platform/PlatformDashboard'
import PlatformMerchants from './pages/platform/PlatformMerchants'
import { PlatformAuthProvider, usePlatformAuth } from './contexts/PlatformAuthContext'
// 用户端认证
import { CustomerAuthProvider, useCustomerAuth } from './contexts/CustomerAuthContext'

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

// 管理端路由守卫
function AdminRouteGuard({ children }) {
  const { isAuthenticated } = useAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // 未登录则跳转到登录页，保存当前路径
    return <Navigate to="/admin" state={{ from: location.pathname }} replace />
  }

  return children
}

// 平台后台路由守卫
function PlatformRouteGuard({ children }) {
  const { isAuthenticated } = usePlatformAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // 未登录则跳转到登录页
    return <Navigate to="/platform/login" state={{ from: location.pathname }} replace />
  }

  return children
}

// 用户端路由守卫
function CustomerRouteGuard({ children }) {
  const { isAuthenticated } = useCustomerAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // 未登录则跳转到用户端登录页，保存当前路径
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}

const tabs = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/price-query', label: '下单', icon: 'order' },
  { path: '/order-management', label: '订单', icon: 'receipt' },
  { path: '/my', label: '我的', icon: 'user' }
]

function NavIcon({ type, isActive }) {
  const common = {
    className: `h-[22px] w-[22px] transition-transform duration-200 ${isActive ? 'scale-105' : ''}`,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }

  if (type === 'home') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M4 10.5 12 4l8 6.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M6.5 9.5V19h11V9.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M10 19v-5h4v5" />
      </svg>
    )
  }

  if (type === 'order') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M7.5 8.5h9l-.8 8H8.3l-.8-8Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M9.5 8.5a2.5 2.5 0 1 1 5 0" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M10 12h4" />
      </svg>
    )
  }

  if (type === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" strokeWidth={1.9} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect x="5" y="4.5" width="14" height="15" rx="2.5" strokeWidth={1.9} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M8 8.5h8M8 12h8M8 15.5h5" />
    </svg>
  )
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#fbf6ef] safe-area-bottom">
      <div className="mx-auto max-w-lg px-4 pb-3">
        <div className="flex h-[72px] items-center rounded-[28px] border border-[#eadfce] bg-[#fbf6ef] px-2 shadow-[0_-8px_30px_rgba(76,56,32,0.08)]">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
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
                    <NavIcon type={tab.icon} isActive={isActive} />
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

function AppShell() {
  const location = useLocation()
  const [cartItems, setCartItems] = useState([])

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { ...product, quantity }]
    })
  }

  const updateQuantity = (productId, change) => {
    setCartItems(prev =>
      prev.flatMap(item => {
        if (item.id !== productId) return [item]

        const newQuantity = item.quantity + change
        return newQuantity > 0 ? [{ ...item, quantity: newQuantity }] : []
      })
    )
  }

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const hideGlobalNav = location.pathname === '/booking' || location.pathname.startsWith('/product/') || location.pathname === '/login'

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}>
      <div className="min-h-screen bg-background">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/price-query" element={<PriceQuery />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route
              path="/order-management"
              element={
                <CustomerRouteGuard>
                  <OrderManagement />
                </CustomerRouteGuard>
              }
            />
            <Route
              path="/my"
              element={
                <CustomerRouteGuard>
                  <My />
                </CustomerRouteGuard>
              }
            />
          </Routes>
        </main>

        {!hideGlobalNav && <BottomNav />}
      </div>
    </CartContext.Provider>
  )
}

// 管理端 Shell（独立路由，无底部导航）
function AdminShell() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          {/* 管理端其他路由需要登录 */}
          <Route
            path="products"
            element={
              <AdminRouteGuard>
                <AdminProducts />
              </AdminRouteGuard>
            }
          />
          <Route
            path="categories"
            element={
              <AdminRouteGuard>
                <AdminCategories />
              </AdminRouteGuard>
            }
          />
          <Route
            path="carousels"
            element={
              <AdminRouteGuard>
                <AdminCarousels />
              </AdminRouteGuard>
            }
          />
          <Route
            path="revenue"
            element={
              <AdminRouteGuard>
                <AdminRevenue />
              </AdminRouteGuard>
            }
          />
          <Route
            path="settings"
            element={
              <AdminRouteGuard>
                <AdminSettings />
              </AdminRouteGuard>
            }
          />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}

// 平台后台 Shell（独立路由，侧边栏布局）
function PlatformShell() {
  return (
    <PlatformAuthProvider>
      <Routes>
        {/* 登录页 */}
        <Route path="login" element={<PlatformLogin />} />
        {/* 布局页 */}
        <Route element={<PlatformLayout />}>
          {/* Dashboard */}
          <Route
            path="dashboard"
            element={
              <PlatformRouteGuard>
                <PlatformDashboard />
              </PlatformRouteGuard>
            }
          />
          {/* 商家管理 */}
          <Route
            path="merchants"
            element={
              <PlatformRouteGuard>
                <PlatformMerchants />
              </PlatformRouteGuard>
            }
          />
          {/* 默认跳转到 Dashboard */}
          <Route
            path=""
            element={<Navigate to="/platform/dashboard" replace />}
          />
        </Route>
      </Routes>
    </PlatformAuthProvider>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 平台后台路由 */}
        <Route path="/platform/*" element={<PlatformShell />} />
        {/* 管理端路由 */}
        <Route path="/admin/*" element={<AdminShell />} />
        {/* 用户端路由 */}
        <Route
          path="/*"
          element={
            <CustomerAuthProvider>
              <AppShell />
            </CustomerAuthProvider>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
