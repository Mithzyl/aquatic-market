import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Booking from './pages/Booking'
import PriceQuery from './pages/PriceQuery'
import OrderManagement from './pages/OrderManagement'

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

const tabs = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/price-query', label: '下单', icon: 'order' },
  { path: '/order-management', label: '订单', icon: 'receipt' }
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
  const hideGlobalNav = location.pathname === '/booking' || location.pathname.startsWith('/product/')

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}>
      <div className="min-h-screen bg-background">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/price-query" element={<PriceQuery />} />
            <Route path="/order-management" element={<OrderManagement />} />
          </Routes>
        </main>

        {!hideGlobalNav && <BottomNav />}
      </div>
    </CartContext.Provider>
  )
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  )
}

export default App
